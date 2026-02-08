import prisma from '../../../../lib/prisma';

import { generateSummary, extractValues } from '@/lib/llm/unified-service';

// Parse a DD/MM/YYYY or DD-MM-YYYY date string (with optional time) into a Date object
function parseDMYDate(dateStr: string): Date | null {
  const m = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (!m) return null;
  const day = parseInt(m[1]);
  const month = parseInt(m[2]) - 1; // JS months are 0-indexed
  let year = parseInt(m[3]);
  if (year < 100) year += 2000;
  if (day < 1 || day > 31 || month < 0 || month > 11) return null;
  const d = new Date(year, month, day);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) return null;
  return d;
}

// Parse "DD Mon YYYY" or "DD Month YYYY" style dates
function parseNamedMonthDate(dateStr: string): Date | null {
  const m = dateStr.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{4})/i);
  if (!m) return null;
  const d = new Date(`${m[2]} ${m[1]}, ${m[3]}`);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) return null;
  return d;
}

// Extract date from OCR text using robust pattern matching
function extractDateFromOCRText(text: string): string | null {
  if (!text) return null;

  // Normalize: collapse \r\n to \n
  const normalized = text.replace(/\r\n/g, '\n');

  // ── STEP 1: Label-associated dates ──
  // Labels in priority order (collection/sample > reported/received > generic date)
  const labelGroups = [
    // Highest priority: sample/collection dates
    [
      'sample\\s*collected',
      'sample\\s*collection\\s*date',
      'collection\\s*date',
      'collected\\s*on',
      'collected',
      'date\\s*of\\s*collection',
      'drawn\\s*on',
      'sample\\s*date',
      'specimen\\s*collected',
      'received\\s*on',
      'received',
    ],
    // Medium priority: report/test dates
    [
      'reported',
      'report\\s*date',
      'reporting\\s*date',
      'date\\s*of\\s*report',
      'test\\s*date',
      'date\\s*of\\s*test',
      'registered',
      'registration\\s*date',
    ],
  ];

  for (const labels of labelGroups) {
    for (const label of labels) {
      // Allow label, then optional newlines/spaces/colons/tabs, then a date
      // This handles: "Reported\n: 28/08/2025 03:24 PM" and "Collection Date : 28/08/2025"
      const re = new RegExp(
        label + '[\\s\\n\\r]*[:\\-]?[\\s\\n\\r]*(\\d{1,2}[/\\-]\\d{1,2}[/\\-]\\d{2,4})',
        'im'
      );
      const match = normalized.match(re);
      if (match && match[1]) {
        const d = parseDMYDate(match[1]);
        if (d) {
          console.log(`[OCR-DATE] Matched label "${label}" → ${match[1]} → ${d.toISOString()}`);
          return d.toISOString();
        }
      }

      // Also try "DD Mon YYYY" style after a label
      const re2 = new RegExp(
        label + '[\\s\\n\\r]*[:\\-]?[\\s\\n\\r]*(\\d{1,2}\\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\\s,]+\\d{4})',
        'im'
      );
      const match2 = normalized.match(re2);
      if (match2 && match2[1]) {
        const d = parseNamedMonthDate(match2[1]);
        if (d) {
          console.log(`[OCR-DATE] Matched label "${label}" → ${match2[1]} → ${d.toISOString()}`);
          return d.toISOString();
        }
      }
    }
  }

  // ── STEP 2: Fallback – grab the first DD/MM/YYYY anywhere in the text ──
  const allDatesRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/g;
  let firstDate: Date | null = null;
  let firstDateStr = '';
  let matchArr;
  while ((matchArr = allDatesRegex.exec(normalized)) !== null) {
    const d = parseDMYDate(matchArr[0]);
    if (d) {
      if (!firstDate) { firstDate = d; firstDateStr = matchArr[0]; }
    }
  }
  if (firstDate) {
    console.log(`[OCR-DATE] No label matched, using first date in text: ${firstDateStr} → ${firstDate.toISOString()}`);
    return firstDate.toISOString();
  }

  // ── STEP 3: Try named-month dates anywhere ──
  const namedMonthRegex = /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+\d{4})/gi;
  let nmMatch;
  while ((nmMatch = namedMonthRegex.exec(normalized)) !== null) {
    const d = parseNamedMonthDate(nmMatch[1]);
    if (d) {
      console.log(`[OCR-DATE] No label matched, using first named-month date: ${nmMatch[1]} → ${d.toISOString()}`);
      return d.toISOString();
    }
  }

  return null;
}



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
    let extractedReportDate: string | undefined; // Date extracted from OCR text via regex
    try {
      if (report.fileUrl.startsWith('http')) {
        console.log(`[LLM-PROCESSING][${requestId}] Calling OCR function directly instead of HTTP request`);
        
        try {
          const { ocrExtractPdfTextFromUrl } = await import('@/lib/ocr/google-vision');
          extractedText = await ocrExtractPdfTextFromUrl(report.fileUrl);
          
          console.log(`[LLM-PROCESSING][${requestId}] Direct OCR extraction completed (${extractedText.length} chars)`);
          console.log(`[LLM-PROCESSING][${requestId}][DEBUG] OCR text preview (first 800 chars):`, extractedText.substring(0, 800));
          
          // Extract date immediately from OCR text
          const ocrExtractedDate = extractDateFromOCRText(extractedText);
          if (ocrExtractedDate) {
            extractedReportDate = ocrExtractedDate;
            console.log(`[LLM-PROCESSING][${requestId}][DEBUG] ✓ Date extracted from OCR: ${extractedReportDate}`);
          } else {
            console.warn(`[LLM-PROCESSING][${requestId}][DEBUG] ✗ No date found in OCR text using regex patterns`);
          }
          
          if (extractedText.length === 0) {
            console.warn(`[LLM-PROCESSING][${requestId}] No text extracted from PDF`);
          }
          
          // Update database with extracted text and progress
          await prisma.standaloneReportAnalysis.updateMany({
            where: { reportId, analysisType },
            data: { 
              extractedText,
              processingError: 'Stage 2: Generating summary...',
            },
          });
        } catch (directOcrError) {
          console.error(`[LLM-PROCESSING][${requestId}] Direct OCR extraction failed:`, {
            error: directOcrError,
            message: directOcrError instanceof Error ? directOcrError.message : 'Unknown error',
            stack: directOcrError instanceof Error ? directOcrError.stack : undefined
          });
          throw new Error(`Failed to extract text from file: ${directOcrError instanceof Error ? directOcrError.message : 'Unknown error'}`);
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

      // Stage 3: Extract Lab Values using direct function call
      console.log(`[LLM-PROCESSING][${requestId}] Stage 3: Extracting lab values via direct function call`);
      try {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
          throw new Error('GROQ_API_KEY not configured');
        }
        
        console.log(`[LLM-PROCESSING][${requestId}] Calling extractValues directly with ${extractedText.length} characters`);
        
        const valuesResult = await extractValues(extractedText, groqApiKey);
        
        allValues = valuesResult.allValues || [];
        criticalValues = valuesResult.criticalValues || [];
        
        // Use LLM-extracted date if present, otherwise use OCR regex-extracted date
        if (valuesResult.reportDate) {
          extractedReportDate = valuesResult.reportDate;
          console.log(`[LLM-PROCESSING][${requestId}][DEBUG] Using LLM-extracted date: ${extractedReportDate}`);
        } else if (extractedReportDate) {
          console.log(`[LLM-PROCESSING][${requestId}][DEBUG] LLM didn't extract date, using OCR regex-extracted date: ${extractedReportDate}`);
        } else {
          console.warn(`[LLM-PROCESSING][${requestId}][DEBUG] No date extracted by either OCR regex or LLM`);
        }

        console.log(`[LLM-PROCESSING][${requestId}][DEBUG] valuesResult.reportDate:`, valuesResult.reportDate ?? '(undefined)');
        console.log(`[LLM-PROCESSING][${requestId}] Extract values result:`, {
          allValuesCount: allValues.length,
          criticalValuesCount: criticalValues.length,
          reportDate: extractedReportDate || 'NOT EXTRACTED'
        });
        
        // Fallback: If criticalValues is empty but allValues has abnormal values, populate criticalValues
        if (criticalValues.length === 0 && allValues.length > 0) {
          const abnormal = allValues.filter((v: any) => 
            v && 
            (v.isAbnormal === true || 
             (v.severity && v.severity !== 'NORMAL' && v.severity !== 'normal'))
          );
          if (abnormal.length > 0) {
            criticalValues = abnormal;
            console.log(`[LLM-PROCESSING][${requestId}] Fallback: Populated ${criticalValues.length} critical values from allValues (AI did not populate criticalValues)`);
          }
        }
        
        console.log(`[LLM-PROCESSING][${requestId}] Stage 3: Lab values extraction completed (${allValues.length} total, ${criticalValues.length} critical)`);
        
        if (allValues.length > 0) {
          console.log(`[LLM-PROCESSING][${requestId}] Sample extracted values:`, allValues.slice(0, 3));
        }
        if (criticalValues.length > 0) {
          console.log(`[LLM-PROCESSING][${requestId}] Critical values:`, criticalValues.slice(0, 3));
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

      try {
        const groqApiKey = process.env.GROQ_API_KEY || '';
        const result = await generateSummary(extractedText, groqApiKey);
        llmSummary = result.summary || 'Prescription analysis completed.';
        keyFindings = Array.isArray(result.keyFindings) ? result.keyFindings : [];
        recommendations = Array.isArray(result.recommendations) ? result.recommendations : [];
        urgency = result.urgency || 'ROUTINE';
      } catch (e) {
        console.error('Prescription GROQ analysis failed:', e);
        llmSummary = 'Prescription analysis completed.';
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
    
    // Get the report to find patientId and createdAt for fallback date
    const reportMeta = await prisma.standaloneReport.findUnique({
      where: { id: reportId },
      select: { patientId: true, createdAt: true }
    });

    // Determine the actual report date: prefer extracted date from report text, fallback to upload date
    const actualReportDate = extractedReportDate ? new Date(extractedReportDate) : (reportMeta?.createdAt || new Date());
    console.log(`[LLM-PROCESSING][${requestId}][DEBUG] Report date: extractedReportDate=${extractedReportDate ?? 'null'}, actualReportDate=${actualReportDate.toISOString()} (${extractedReportDate ? 'EXTRACTED' : 'FALLBACK upload date'})`);

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
        trendAnalysis: { reportDate: actualReportDate.toISOString() },
      },
    });

    // Create trend data for standalone lab reports
    if (analysisType === 'lab_analysis' && Array.isArray(allValues) && allValues.length > 0 && reportMeta) {
      console.log(`[LLM-PROCESSING][${requestId}] Creating trend data for ${allValues.length} parameters`);
      
      // Delete old trend data for this standalone report (in case of regeneration)
      await prisma.reportTrendData.deleteMany({
        where: { standaloneReportId: reportId }
      });

      for (const value of allValues) {
        if (value.parameter && value.value) {
          try {
            await prisma.reportTrendData.create({
              data: {
                patientId: reportMeta.patientId,
                parameter: String(value.parameter),
                value: String(value.value),
                unit: value.unit ? String(value.unit) : null,
                normalRange: value.normalRange ? String(value.normalRange) : null,
                isAbnormal: Boolean(value.isAbnormal),
                severity: value.severity && ['LOW','NORMAL','HIGH','CRITICAL'].includes(String(value.severity).toUpperCase())
                  ? String(value.severity).toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
                  : null,
                reportDate: actualReportDate, // Use date from report text, not upload date
                labBookingId: null,
                standaloneReportId: reportId,
                sourceReportId: null
              }
            });
          } catch (trendError) {
            console.log(`[LLM-PROCESSING][${requestId}] Error creating trend data for ${value.parameter}: ${trendError instanceof Error ? trendError.message : 'Unknown error'}`);
          }
        }
      }
      console.log(`[LLM-PROCESSING][${requestId}] Trend data creation completed`);
    }

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
