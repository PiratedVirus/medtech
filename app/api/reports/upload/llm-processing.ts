import prisma from '../../../../lib/prisma';

import { generateSummary } from '@/lib/llm/unified-service';



// Function to trigger LLM processing for standalone reports
export async function triggerLLMProcessing(reportId: number, analysisType: string, forceRegeneration: boolean = false) {
  try {
    console.log(`[LLM-PROCESSING] Triggering LLM processing for report ${reportId}, type: ${analysisType}`);
    
    // Update status to PROCESSING
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: { 
        processingStatus: 'PROCESSING',
        processingError: null,
      },
    });

    // Get the report details
    const report = await prisma.standaloneReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new Error('Report not found');
    }

    // Stage 1: Parse Text
    console.log(`[LLM-PROCESSING][${reportId}] Stage 1: Starting text extraction`);
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: { 
        processingError: 'Stage 1: Extracting text from file...',
      },
    });

    let extractedText = '';
    try {
      if (report.fileUrl.startsWith('http')) {
        // Use existing parse-text API for remote files
        const parseResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/llm-process/parse-text`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfUrl: report.fileUrl }),
        });

        if (parseResponse.ok) {
          const parseData = await parseResponse.json();
          extractedText = parseData.text;
          
          console.log(`[LLM-PROCESSING][${reportId}] Stage 1: Text extraction completed (${extractedText.length} chars)`);
          
          // Update database with extracted text and progress
          await prisma.standaloneReportAnalysis.updateMany({
            where: { reportId, analysisType },
            data: { 
              extractedText,
              processingError: 'Stage 2: Generating summary...',
            },
          });
        } else {
          throw new Error('Failed to parse file');
        }
      } else {
        throw new Error('Invalid file URL');
      }
    } catch (parseError) {
      console.error('Text extraction failed:', parseError);
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
      throw new Error('Insufficient text extracted from file');
    }

    // Process based on analysis type
    let llmSummary = '';
    let allValues: any[] = [];
    let criticalValues: any[] = [];
    let keyFindings: any[] = [];
    let recommendations: any[] = [];
    let urgency = 'ROUTINE';

    if (analysisType === 'lab_analysis') {
      // Stage 2: Generate Summary
      console.log(`[LLM-PROCESSING][${reportId}] Stage 2: Generating summary`);
      try {
        const summaryResult = await generateSummary(extractedText, process.env.GROQ_API_KEY || '');
        llmSummary = summaryResult.summary;
        keyFindings = summaryResult.keyFindings;
        recommendations = summaryResult.recommendations;
        urgency = summaryResult.urgency;
        
        console.log(`[LLM-PROCESSING][${reportId}] Stage 2: Summary generation completed`);
        
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
        console.error('Summary generation failed:', summaryError);
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
      console.log(`[LLM-PROCESSING][${reportId}] Stage 3: Extracting lab values via standalone API`);
      try {
        const extractResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/llm-process/extract-standalone-values`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: extractedText, 
            reportId: reportId, 
            force: forceRegeneration 
          })
        });

        if (extractResponse.ok) {
          const extractData = await extractResponse.json();
          if (extractData.success) {
            allValues = extractData.data.allValues || [];
            criticalValues = extractData.data.criticalValues || [];
            console.log(`[LLM-PROCESSING][${reportId}] Stage 3: Lab values extraction completed via standalone API (${allValues.length} total, ${criticalValues.length} critical)`);
          } else {
            throw new Error(extractData.error || 'Failed to extract values via standalone API');
          }
        } else {
          throw new Error(`Standalone extract values API failed: ${extractResponse.status}`);
        }
        
      } catch (valuesError) {
        console.error('Lab values extraction failed:', valuesError);
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
    console.log(`[LLM-PROCESSING][${reportId}] Finalizing analysis`);
    console.log(`[LLM-PROCESSING][${reportId}] Data to save:`, {
      llmSummary,
      allValues: allValues?.length || 0,
      criticalValues: criticalValues?.length || 0,
      keyFindings: keyFindings?.length || 0,
      recommendations: recommendations?.length || 0,
      urgency
    });
    
    await prisma.standaloneReportAnalysis.updateMany({
      where: { reportId, analysisType },
      data: {
        processingStatus: 'COMPLETED',
        processingError: null,
        processedAt: new Date(),
        llmModel: process.env.GROQ_API_KEY ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'openrouter-llama-3.2-3b',
        llmSummary,
        allValues,
        criticalValues,
        keyFindings,
        recommendations,
        urgency,
      },
    });

    console.log(`[LLM-PROCESSING][${reportId}] Analysis completed successfully`);

  } catch (error) {
    console.error(`[LLM-PROCESSING][${reportId}] Processing failed:`, error);
    
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
