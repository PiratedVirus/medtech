import prisma from '../../../../lib/prisma';

import { generateSummary } from '@/lib/llm/unified-service';



// Function to trigger LLM processing for standalone reports
export async function triggerLLMProcessing(reportId: number, analysisType: string, forceRegeneration: boolean = false) {
  const requestId = Math.random().toString(36).substring(7);
  console.log(`[LLM-PROCESSING][${requestId}] Starting LLM processing for report ${reportId}, type: ${analysisType}, forceRegeneration: ${forceRegeneration}`);
  
  // Log to database for tracking
  try {
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: {
        processingError: `[${requestId}] LLM processing started at ${new Date().toISOString()}`
      }
    });
  } catch (dbLogError) {
    console.error(`[LLM-PROCESSING][${requestId}] Failed to log start to database:`, dbLogError);
  }
  
  try {
    // Update status to PROCESSING
    console.log(`[LLM-PROCESSING][${requestId}] Updating analysis status to PROCESSING...`);
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: { 
        processingStatus: 'PROCESSING',
        processingError: null,
      },
    });

    // Get the report details
    console.log(`[LLM-PROCESSING][${requestId}] Fetching report details...`);
    const report = await prisma.standaloneReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      console.error(`[LLM-PROCESSING][${requestId}] Report not found: ${reportId}`);
      throw new Error('Report not found');
    }

    console.log(`[LLM-PROCESSING][${requestId}] Report details:`, {
      id: report.id,
      fileUrl: report.fileUrl?.substring(0, 100) + '...',
      reportType: report.reportType,
      status: report.status
    });

    // Stage 1: Parse Text
    console.log(`[LLM-PROCESSING][${requestId}] Stage 1: Starting text extraction from ${report.fileUrl?.substring(0, 50)}...`);
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: { 
        processingError: 'Stage 1: Extracting text from file...',
      },
    });

    let extractedText = '';
    try {
      if (report.fileUrl.startsWith('http')) {
        console.log(`[LLM-PROCESSING][${requestId}] Making request to parse-text API...`);
        // Use relative URL to avoid localhost issues
        const parseUrl = process.env.NEXT_PUBLIC_SITE_URL ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/llm-process/parse-text` : '/api/llm-process/parse-text';
        console.log(`[LLM-PROCESSING][${requestId}] Parse-text API URL: ${parseUrl}`);
        console.log(`[LLM-PROCESSING][${requestId}] Environment NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL}`);
        
        const parseResponse = await fetch(parseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfUrl: report.fileUrl }),
        });

        console.log(`[LLM-PROCESSING][${requestId}] Parse-text API response:`, {
          status: parseResponse.status,
          statusText: parseResponse.statusText,
          ok: parseResponse.ok
        });

        if (parseResponse.ok) {
          const parseData = await parseResponse.json();
          extractedText = parseData.text;
          
          console.log(`[LLM-PROCESSING][${requestId}] Stage 1: Text extraction completed (${extractedText.length} chars)`);
          
          if (extractedText.length === 0) {
            console.warn(`[LLM-PROCESSING][${requestId}] No text extracted from PDF`);
          } else {
            console.log(`[LLM-PROCESSING][${requestId}] Text preview: ${extractedText.substring(0, 200)}...`);
          }
          
          // Update database with extracted text and progress
          await prisma.standaloneReportAnalysis.updateMany({
            where: { reportId, analysisType },
            data: { 
              extractedText,
              processingError: 'Stage 2: Generating summary...',
            },
          });
        } else {
          const errorText = await parseResponse.text();
          console.error(`[LLM-PROCESSING][${requestId}] Parse-text API failed:`, {
            status: parseResponse.status,
            statusText: parseResponse.statusText,
            errorText
          });
          throw new Error(`Failed to parse file: ${parseResponse.status} ${errorText}`);
        }
      } else {
        console.error(`[LLM-PROCESSING][${requestId}] Invalid file URL format: ${report.fileUrl}`);
        throw new Error('Invalid file URL');
      }
    } catch (parseError) {
      console.error(`[LLM-PROCESSING][${requestId}] Text extraction failed:`, {
        error: parseError,
        message: parseError instanceof Error ? parseError.message : 'Unknown error',
        stack: parseError instanceof Error ? parseError.stack : undefined
      });
      
      await prisma.standaloneReportAnalysis.updateMany({
        where: { reportId, analysisType },
        data: { 
          processingStatus: 'FAILED',
          processingError: `Stage 1 failed: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
        },
      });
      throw new Error('Failed to extract text from file');
    }

    if (!extractedText || extractedText.trim().length < 50) {
      console.error(`[LLM-PROCESSING][${requestId}] Insufficient text extracted: ${extractedText.length} characters`);
      throw new Error('Insufficient text extracted from file');
    }

    console.log(`[LLM-PROCESSING][${requestId}] Text validation passed: ${extractedText.length} characters`);

    // Process based on analysis type
    let llmSummary = '';
    let allValues: any[] = [];
    let criticalValues: any[] = [];
    let keyFindings: any[] = [];
    let recommendations: any[] = [];
    let urgency = 'ROUTINE';

    if (analysisType === 'lab_analysis') {
      // Stage 2: Generate Summary
      console.log(`[LLM-PROCESSING][${requestId}] Stage 2: Generating summary for lab analysis`);
      try {
        const groqApiKey = process.env.GROQ_API_KEY;
        console.log(`[LLM-PROCESSING][${requestId}] Using Groq API key: ${groqApiKey ? 'configured' : 'missing'}`);
        
        const summaryResult = await generateSummary(extractedText, groqApiKey || '');
        llmSummary = summaryResult.summary;
        keyFindings = summaryResult.keyFindings;
        recommendations = summaryResult.recommendations;
        urgency = summaryResult.urgency;
        
        console.log(`[LLM-PROCESSING][${requestId}] Stage 2: Summary generation completed:`, {
          summaryLength: llmSummary.length,
          keyFindingsCount: keyFindings.length,
          recommendationsCount: recommendations.length,
          urgency
        });
        
        // Update database with summary progress
        await prisma.standaloneReportAnalysis.updateMany({
          where: { reportId, analysisType },
          data: { 
            llmSummary,
            keyFindings,
            recommendations,
            urgency,
            processingError: 'Stage 3: Extracting lab values...',
          },
        });
      } catch (summaryError) {
        console.error(`[LLM-PROCESSING][${requestId}] Summary generation failed:`, {
          error: summaryError,
          message: summaryError instanceof Error ? summaryError.message : 'Unknown error',
          stack: summaryError instanceof Error ? summaryError.stack : undefined
        });
        
        await prisma.standaloneReportAnalysis.updateMany({
          where: { reportId, analysisType },
          data: { 
            processingStatus: 'FAILED',
            processingError: `Stage 2 failed: ${summaryError instanceof Error ? summaryError.message : 'Unknown error'}`,
          },
        });
        throw summaryError;
      }

      // Stage 3: Extract Lab Values using standalone extract-values API
      console.log(`[LLM-PROCESSING][${requestId}] Stage 3: Extracting lab values via standalone API`);
      try {
        const extractUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/llm-process/extract-standalone-values`;
        console.log(`[LLM-PROCESSING][${requestId}] Extract values API URL: ${extractUrl}`);
        
        const extractResponse = await fetch(extractUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: extractedText, 
            reportId: reportId, 
            force: forceRegeneration 
          })
        });

        console.log(`[LLM-PROCESSING][${requestId}] Extract values API response:`, {
          status: extractResponse.status,
          statusText: extractResponse.statusText,
          ok: extractResponse.ok
        });

        if (extractResponse.ok) {
          const extractData = await extractResponse.json();
          console.log(`[LLM-PROCESSING][${requestId}] Extract values API response data:`, {
            success: extractData.success,
            hasData: !!extractData.data,
            allValuesCount: extractData.data?.allValues?.length || 0,
            criticalValuesCount: extractData.data?.criticalValues?.length || 0
          });
          
          if (extractData.success) {
            allValues = extractData.data.allValues || [];
            criticalValues = extractData.data.criticalValues || [];
            console.log(`[LLM-PROCESSING][${requestId}] Stage 3: Lab values extraction completed via standalone API (${allValues.length} total, ${criticalValues.length} critical)`);
            
            if (allValues.length > 0) {
              console.log(`[LLM-PROCESSING][${requestId}] Sample extracted values:`, allValues.slice(0, 3));
            }
            if (criticalValues.length > 0) {
              console.log(`[LLM-PROCESSING][${requestId}] Critical values:`, criticalValues.slice(0, 3));
            }
          } else {
            console.error(`[LLM-PROCESSING][${requestId}] Extract values API returned error:`, extractData.error);
            throw new Error(extractData.error || 'Failed to extract values via standalone API');
          }
        } else {
          const errorText = await extractResponse.text();
          console.error(`[LLM-PROCESSING][${requestId}] Extract values API failed:`, {
            status: extractResponse.status,
            statusText: extractResponse.statusText,
            errorText
          });
          throw new Error(`Standalone extract values API failed: ${extractResponse.status} ${errorText}`);
        }
        
      } catch (valuesError) {
        console.error(`[LLM-PROCESSING][${requestId}] Lab values extraction failed:`, {
          error: valuesError,
          message: valuesError instanceof Error ? valuesError.message : 'Unknown error',
          stack: valuesError instanceof Error ? valuesError.stack : undefined
        });
        
        await prisma.standaloneReportAnalysis.updateMany({
          where: { reportId, analysisType },
          data: { 
            processingStatus: 'FAILED',
            processingError: `Stage 3 failed: ${valuesError instanceof Error ? valuesError.message : 'Unknown error'}`,
          },
        });
        throw valuesError;
      }
    } else if (analysisType === 'prescription_analysis') {
      // For prescriptions, use a simpler approach
      console.log(`[LLM-PROCESSING][${reportId}] Stage 2: Analyzing prescription`);
      await prisma.standaloneReportAnalysis.updateMany({
        where: { reportId, analysisType },
        data: { 
          processingError: 'Stage 2: Analyzing prescription...',
        },
      });

      const apiKey = process.env.OPENROUTER_API_KEY;
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      
      if (apiKey) {
        try {
          const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': siteUrl,
              'X-Title': 'CareDB Prescription Analysis',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'meta-llama/llama-3.2-3b-instruct:free',
              messages: [
                {
                  role: 'system',
                  content: 'You are a medical prescription analyzer. Return JSON with summary, key findings, and recommendations.',
                },
                {
                  role: 'user',
                  content: `Analyze this prescription text and return JSON: ${extractedText}`,
                },
              ],
              max_tokens: 1000,
              temperature: 0.1,
              response_format: { type: 'json_object' },
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (content) {
              try {
                const parsed = JSON.parse(content);
                llmSummary = parsed.summary || 'Prescription analysis completed.';
                keyFindings = Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [];
                recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
                urgency = parsed.urgency || 'ROUTINE';
              } catch (parseError) {
                console.error('Failed to parse prescription analysis response:', parseError);
                llmSummary = 'Prescription analysis completed.';
              }
            }
          }
        } catch (apiError) {
          console.error('OpenRouter API error:', apiError);
          llmSummary = 'Prescription analysis completed.';
        }
      }
    } else {
      // For other document types, generate summary
      console.log(`[LLM-PROCESSING][${reportId}] Stage 2: Generating document summary`);
      try {
        const summaryResult = await generateSummary(extractedText, process.env.GROQ_API_KEY || '');
        llmSummary = summaryResult.summary;
        keyFindings = summaryResult.keyFindings;
        recommendations = summaryResult.recommendations;
        urgency = summaryResult.urgency;
      } catch (summaryError) {
        console.error('Summary generation failed:', summaryError);
        llmSummary = 'Document analysis completed.';
      }
    }

    // Final update: Mark as completed
    console.log(`[LLM-PROCESSING][${requestId}] Finalizing analysis`);
    console.log(`[LLM-PROCESSING][${requestId}] Data to save:`, {
      llmSummary: llmSummary?.length || 0,
      allValues: allValues?.length || 0,
      criticalValues: criticalValues?.length || 0,
      keyFindings: keyFindings?.length || 0,
      recommendations: recommendations?.length || 0,
      urgency
    });
    
    const llmModel = process.env.GROQ_API_KEY ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'openrouter-llama-3.2-3b';
    console.log(`[LLM-PROCESSING][${requestId}] Using LLM model: ${llmModel}`);
    
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: {
        processingStatus: 'COMPLETED',
        processingError: null,
        processedAt: new Date(),
        llmModel,
        llmSummary,
        allValues,
        criticalValues,
        keyFindings,
        recommendations,
        urgency,
      },
    });

    console.log(`[LLM-PROCESSING][${requestId}] Analysis completed successfully for report ${reportId}`);

  } catch (error) {
    console.error(`[LLM-PROCESSING][${requestId}] Processing failed for report ${reportId}:`, {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Update status to failed
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: {
        processingStatus: 'FAILED',
        processingError: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    });
    
    throw error;
  }
}
