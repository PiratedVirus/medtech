import prisma from "@/lib/prisma";
import { generateSummary, extractValues } from "@/lib/llm/unified-service";
import { ocrExtractPdfTextFromUrl } from "@/lib/ocr/google-vision";

/**
 * Unified Lab Report Processing Service
 * 
 * Combines the best of both triggerLLMProcessing() and processWithOpenRouter():
 * - Detailed progress tracking (from triggerLLMProcessing)
 * - Clean unified architecture (from processWithOpenRouter)
 * - Supports both standalone and lab booking reports
 * - Proper trend data handling (no workarounds)
 * 
 * @param context - Processing context with report information
 * @param options - Processing options
 */
export interface LabReportProcessingContext {
  // Report identification
  reportType: 'standalone' | 'labBooking';
  
  // For standalone reports
  standaloneReportId?: number;
  standaloneAnalysisId?: number;
  
  // For lab booking reports
  labBookingId?: number;
  labReportAnalysisId?: number;
  labResultIndex?: number;
  
  // Common fields
  pdfUrl: string;
  patientId: number;
  reportDate?: Date;
}

export interface ProcessingOptions {
  analysisType?: 'lab_analysis' | 'prescription_analysis' | 'document_summary';
  updateProgress?: (stage: string, message: string) => Promise<void>;
  skipTrendData?: boolean;
}

export interface ProcessingResult {
  success: boolean;
  summary: string;
  allValues: any[];
  criticalValues: any[];
  keyFindings: any[];
  recommendations: any[];
  urgency: 'ROUTINE' | 'SOON' | 'URGENT';
  extractedText: string;
  error?: string;
}

/**
 * Unified function to process lab reports with LLM analysis
 * 
 * This function replaces both triggerLLMProcessing() and processWithOpenRouter()
 * with a unified, well-designed implementation.
 */
export async function processLabReportWithLLM(
  context: LabReportProcessingContext,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const { reportType, pdfUrl, patientId } = context;
  const { analysisType = 'lab_analysis', updateProgress, skipTrendData = false } = options;
  
  const requestId = `${reportType}-${context.standaloneReportId || context.labBookingId}-${Date.now()}`;
  
  console.log(`[UNIFIED-LLM][${requestId}] Starting lab report processing`);
  console.log(`[UNIFIED-LLM][${requestId}] Context:`, {
    reportType,
    standaloneReportId: context.standaloneReportId,
    labBookingId: context.labBookingId,
    analysisType
  });

  let extractedText = '';
  let llmSummary = '';
  let allValues: any[] = [];
  let criticalValues: any[] = [];
  let keyFindings: any[] = [];
  let recommendations: any[] = [];
  let urgency: 'ROUTINE' | 'SOON' | 'URGENT' = 'ROUTINE';

  try {
    // ============================================
    // STAGE 1: Update Status to PROCESSING
    // ============================================
    await updateProcessingStatus(context, 'PROCESSING', null);
    await updateProgressIfAvailable(updateProgress, 'Stage 1: Initializing...');

    // ============================================
    // STAGE 2: Extract Text from PDF (OCR)
    // ============================================
    console.log(`[UNIFIED-LLM][${requestId}] Stage 2: Starting OCR text extraction`);
    await updateProgressIfAvailable(updateProgress, 'Stage 2: Extracting text from PDF...');

    try {
      extractedText = await extractOcrText(pdfUrl);
      
      if (!extractedText || extractedText.trim().length < 50) {
        throw new Error('Insufficient text extracted from file (minimum 50 characters required)');
      }

      // Save extracted text to database
      await updateExtractedText(context, extractedText);
      await updateProgressIfAvailable(updateProgress, 'Stage 2: Text extraction completed');

      console.log(`[UNIFIED-LLM][${requestId}] Stage 2: OCR completed (${extractedText.length} characters)`);
    } catch (ocrError) {
      const errorMsg = ocrError instanceof Error ? ocrError.message : 'Unknown OCR error';
      console.error(`[UNIFIED-LLM][${requestId}] Stage 2 failed:`, errorMsg);
      await updateProcessingStatus(context, 'FAILED', `Stage 2 (OCR) failed: ${errorMsg}`);
      throw new Error(`OCR extraction failed: ${errorMsg}`);
    }

    // ============================================
    // STAGE 3: Process Based on Analysis Type
    // ============================================
    if (analysisType === 'lab_analysis') {
      await processLabAnalysis(requestId, context, extractedText, updateProgress);
    } else if (analysisType === 'prescription_analysis') {
      await processPrescriptionAnalysis(requestId, context, extractedText, updateProgress);
    } else {
      await processDocumentSummary(requestId, context, extractedText, updateProgress);
    }

    // ============================================
    // STAGE 4: Retrieve Results from Database
    // ============================================
    console.log(`[UNIFIED-LLM][${requestId}] Stage 4: Retrieving final results from database`);
    await updateProgressIfAvailable(updateProgress, 'Stage 4: Finalizing results...');

    const finalResults = await getFinalResults(context);
    llmSummary = finalResults.llmSummary || '';
    allValues = finalResults.allValues || [];
    criticalValues = finalResults.criticalValues || [];
    keyFindings = finalResults.keyFindings || [];
    recommendations = finalResults.recommendations || [];
    urgency = (finalResults.urgency as 'ROUTINE' | 'SOON' | 'URGENT') || 'ROUTINE';

    // ============================================
    // STAGE 5: Create Trend Data (if applicable)
    // ============================================
    if (analysisType === 'lab_analysis' && !skipTrendData && allValues.length > 0) {
      console.log(`[UNIFIED-LLM][${requestId}] Stage 5: Creating trend data for ${allValues.length} parameters`);
      await updateProgressIfAvailable(updateProgress, 'Stage 5: Creating trend data...');

      try {
        await createTrendData(context, allValues, criticalValues);
        console.log(`[UNIFIED-LLM][${requestId}] Stage 5: Trend data creation completed`);
      } catch (trendError) {
        // Don't fail the entire process if trend data creation fails
        console.error(`[UNIFIED-LLM][${requestId}] Stage 5: Trend data creation failed (non-critical):`, trendError);
      }
    }

    // ============================================
    // STAGE 6: Final Status Update
    // ============================================
    await updateProcessingStatus(context, 'COMPLETED', null);
    await updateProgressIfAvailable(updateProgress, 'Processing completed successfully!');

    console.log(`[UNIFIED-LLM][${requestId}] Processing completed successfully`);
    console.log(`[UNIFIED-LLM][${requestId}] Results:`, {
      summaryLength: llmSummary.length,
      allValuesCount: allValues.length,
      criticalValuesCount: criticalValues.length,
      keyFindingsCount: keyFindings.length,
      recommendationsCount: recommendations.length
    });

    return {
      success: true,
      summary: llmSummary,
      allValues,
      criticalValues,
      keyFindings,
      recommendations,
      urgency,
      extractedText
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[UNIFIED-LLM][${requestId}] Processing failed:`, errorMsg);
    
    await updateProcessingStatus(context, 'FAILED', errorMsg);
    await updateProgressIfAvailable(updateProgress, `Processing failed: ${errorMsg}`);

    return {
      success: false,
      summary: '',
      allValues: [],
      criticalValues: [],
      keyFindings: [],
      recommendations: [],
      urgency: 'ROUTINE',
      extractedText: extractedText || '',
      error: errorMsg
    };
  }
}

// ============================================
// Helper Functions
// ============================================

/**
 * Process lab analysis (summary + values extraction)
 */
async function processLabAnalysis(
  requestId: string,
  context: LabReportProcessingContext,
  extractedText: string,
  updateProgress?: (stage: string, message: string) => Promise<void>
) {
  const groqApiKey = process.env.GROQ_API_KEY || '';
  if (!groqApiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  // Stage 3a: Generate Summary
  console.log(`[UNIFIED-LLM][${requestId}] Stage 3a: Generating summary`);
  await updateProgressIfAvailable(updateProgress, 'Stage 3a: Generating AI summary...');

  try {
    const summaryResult = await generateSummary(extractedText, groqApiKey);
    
    await updateAnalysisResults(context, {
      llmSummary: summaryResult.summary,
      keyFindings: summaryResult.keyFindings || [],
      recommendations: summaryResult.recommendations || [],
      urgency: summaryResult.urgency || 'ROUTINE'
    });

    console.log(`[UNIFIED-LLM][${requestId}] Stage 3a: Summary generation completed`);
    await updateProgressIfAvailable(updateProgress, 'Stage 3a: Summary generated');
  } catch (summaryError) {
    const errorMsg = summaryError instanceof Error ? summaryError.message : 'Unknown error';
    console.error(`[UNIFIED-LLM][${requestId}] Stage 3a failed:`, errorMsg);
    await updateProcessingStatus(context, 'FAILED', `Stage 3a (Summary) failed: ${errorMsg}`);
    throw summaryError;
  }

  // Stage 3b: Extract Lab Values
  console.log(`[UNIFIED-LLM][${requestId}] Stage 3b: Extracting lab values`);
  await updateProgressIfAvailable(updateProgress, 'Stage 3b: Extracting lab values...');

  try {
    const valuesResult = await extractValues(extractedText, groqApiKey);
    
    // Fallback: If criticalValues is empty but allValues has abnormal values, populate criticalValues
    let finalCriticalValues = valuesResult.criticalValues || [];
    if (finalCriticalValues.length === 0 && valuesResult.allValues && valuesResult.allValues.length > 0) {
      const abnormal = valuesResult.allValues.filter((v: any) => 
        v && 
        (v.isAbnormal === true || 
         (v.severity && v.severity !== 'NORMAL' && v.severity !== 'normal'))
      );
      if (abnormal.length > 0) {
        finalCriticalValues = abnormal;
        console.log(`[UNIFIED-LLM][${requestId}] Fallback: Populated ${finalCriticalValues.length} critical values from allValues`);
      }
    }

    let extractedReportDate: Date | undefined;
    if (valuesResult.reportDate) {
      const parsed = new Date(valuesResult.reportDate);
      if (!Number.isNaN(parsed.getTime())) {
        extractedReportDate = parsed;
      }
    }

    const actualReportDate = extractedReportDate || context.reportDate;
    if (actualReportDate) {
      context.reportDate = actualReportDate;
    }

    await updateAnalysisResults(context, {
      allValues: valuesResult.allValues || [],
      criticalValues: finalCriticalValues,
      trendAnalysis: actualReportDate
        ? { reportDate: actualReportDate.toISOString() }
        : { reportDate: null }
    });

    console.log(`[UNIFIED-LLM][${requestId}] Stage 3b: Values extraction completed (${valuesResult.allValues?.length || 0} total, ${finalCriticalValues.length} critical). Report date: ${actualReportDate ? actualReportDate.toISOString() : 'NOT EXTRACTED'}`);
    await updateProgressIfAvailable(updateProgress, 'Stage 3b: Lab values extracted');
  } catch (valuesError) {
    const errorMsg = valuesError instanceof Error ? valuesError.message : 'Unknown error';
    console.error(`[UNIFIED-LLM][${requestId}] Stage 3b failed:`, errorMsg);
    await updateProcessingStatus(context, 'FAILED', `Stage 3b (Values) failed: ${errorMsg}`);
    throw valuesError;
  }
}

/**
 * Process prescription analysis
 */
async function processPrescriptionAnalysis(
  requestId: string,
  context: LabReportProcessingContext,
  extractedText: string,
  updateProgress?: (stage: string, message: string) => Promise<void>
) {
  console.log(`[UNIFIED-LLM][${requestId}] Stage 3: Analyzing prescription`);
  await updateProgressIfAvailable(updateProgress, 'Stage 3: Analyzing prescription...');

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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.2-3b-instruct:free',
          messages: [
            {
              role: 'system',
              content: 'You are a medical prescription analyzer. Return JSON with summary, key findings, and recommendations.'
            },
            {
              role: 'user',
              content: `Analyze this prescription text and return JSON: ${extractedText}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices[0]?.message?.content;
        if (content) {
          try {
            const parsed = JSON.parse(content);
            await updateAnalysisResults(context, {
              llmSummary: parsed.summary || '',
              keyFindings: parsed.keyFindings || [],
              recommendations: parsed.recommendations || []
            });
          } catch (e) {
            await updateAnalysisResults(context, {
              llmSummary: content.substring(0, 500)
            });
          }
        }
      }
    } catch (error) {
      console.error(`[UNIFIED-LLM][${requestId}] Prescription analysis failed:`, error);
    }
  }
}

/**
 * Process document summary
 */
async function processDocumentSummary(
  requestId: string,
  context: LabReportProcessingContext,
  extractedText: string,
  updateProgress?: (stage: string, message: string) => Promise<void>
) {
  console.log(`[UNIFIED-LLM][${requestId}] Stage 3: Processing document summary`);
  await updateProgressIfAvailable(updateProgress, 'Stage 3: Processing document...');

  const summary = `Document analysis completed. Extracted ${extractedText.length} characters of text.`;
  await updateAnalysisResults(context, {
    llmSummary: summary
  });
}

/**
 * Extract text from PDF using OCR
 */
async function extractOcrText(pdfUrl: string): Promise<string> {
  let extractedText = await ocrExtractPdfTextFromUrl(pdfUrl);
  
  if (!extractedText || extractedText.trim().length < 50) {
    throw new Error('OCR text extraction failed or insufficient content');
  }
  
  // Normalize text
  extractedText = extractedText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
  
  // Limit to prevent token overflow
  const MAX_TEXT_TOKENS = 8000;
  if (extractedText.length > MAX_TEXT_TOKENS * 4) {
    extractedText = extractedText.substring(0, MAX_TEXT_TOKENS * 4);
  }
  
  return extractedText;
}

/**
 * Update processing status in database
 */
async function updateProcessingStatus(
  context: LabReportProcessingContext,
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED',
  error: string | null
) {
  if (context.reportType === 'standalone' && context.standaloneAnalysisId) {
    await prisma.standaloneReportAnalysis.updateMany({
      where: { id: context.standaloneAnalysisId },
      data: {
        processingStatus: status,
        processingError: error,
        ...(status === 'COMPLETED' ? { processedAt: new Date() } : {}),
        ...(status === 'FAILED' ? { processedAt: new Date() } : {})
      }
    });
  } else if (context.reportType === 'labBooking' && context.labReportAnalysisId) {
    await prisma.labReportAnalysis.update({
      where: { id: context.labReportAnalysisId },
      data: {
        processingStatus: status,
        processingError: error,
        ...(status === 'COMPLETED' ? { processedAt: new Date() } : {}),
        ...(status === 'FAILED' ? { processedAt: new Date() } : {})
      }
    });
  }
}

/**
 * Update extracted text in database
 */
async function updateExtractedText(
  context: LabReportProcessingContext,
  extractedText: string
) {
  if (context.reportType === 'standalone' && context.standaloneAnalysisId) {
    await prisma.standaloneReportAnalysis.updateMany({
      where: { id: context.standaloneAnalysisId },
      data: { extractedText }
    });
  } else if (context.reportType === 'labBooking' && context.labReportAnalysisId) {
    await prisma.labReportAnalysis.update({
      where: { id: context.labReportAnalysisId },
      data: { extractedText }
    });
  }
}

/**
 * Update analysis results in database
 */
async function updateAnalysisResults(
  context: LabReportProcessingContext,
  results: {
    llmSummary?: string;
    allValues?: any[];
    criticalValues?: any[];
    keyFindings?: any[];
    recommendations?: any[];
    urgency?: string;
    trendAnalysis?: any;
  }
) {
  const updateData: any = {};
  
  if (results.llmSummary !== undefined) updateData.llmSummary = results.llmSummary;
  if (results.allValues !== undefined) updateData.allValues = results.allValues;
  if (results.criticalValues !== undefined) updateData.criticalValues = results.criticalValues;
  if (results.keyFindings !== undefined) updateData.keyFindings = results.keyFindings;
  if (results.recommendations !== undefined) updateData.recommendations = results.recommendations;
  if (results.urgency !== undefined) updateData.urgency = results.urgency;
  if (results.trendAnalysis !== undefined) updateData.trendAnalysis = results.trendAnalysis;
  
  updateData.llmModel = process.env.GROQ_SUMMARY_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

  if (context.reportType === 'standalone' && context.standaloneAnalysisId) {
    await prisma.standaloneReportAnalysis.updateMany({
      where: { id: context.standaloneAnalysisId },
      data: updateData
    });
  } else if (context.reportType === 'labBooking' && context.labReportAnalysisId) {
    await prisma.labReportAnalysis.update({
      where: { id: context.labReportAnalysisId },
      data: updateData
    });
  }
}

/**
 * Get final results from database
 */
async function getFinalResults(context: LabReportProcessingContext): Promise<{
  llmSummary: string | null;
  allValues: any[];
  criticalValues: any[];
  keyFindings: any[];
  recommendations: any[];
  urgency: string | null;
}> {
  if (context.reportType === 'standalone' && context.standaloneAnalysisId) {
    const analysis = await prisma.standaloneReportAnalysis.findUnique({
      where: { id: context.standaloneAnalysisId }
    });
    
    return {
      llmSummary: analysis?.llmSummary || null,
      allValues: (analysis?.allValues as any[]) || [],
      criticalValues: (analysis?.criticalValues as any[]) || [],
      keyFindings: (analysis?.keyFindings as any[]) || [],
      recommendations: (analysis?.recommendations as any[]) || [],
      urgency: analysis?.urgency || null
    };
  } else if (context.reportType === 'labBooking' && context.labReportAnalysisId) {
    const analysis = await prisma.labReportAnalysis.findUnique({
      where: { id: context.labReportAnalysisId }
    });
    
    return {
      llmSummary: analysis?.llmSummary || null,
      allValues: (analysis?.allValues as any[]) || [],
      criticalValues: (analysis?.criticalValues as any[]) || [],
      keyFindings: (analysis?.keyFindings as any[]) || [],
      recommendations: (analysis?.recommendations as any[]) || [],
      urgency: analysis?.urgency || null
    };
  }
  
  return {
    llmSummary: null,
    allValues: [],
    criticalValues: [],
    keyFindings: [],
    recommendations: [],
    urgency: null
  };
}

/**
 * Create trend data for lab values
 * 
 * PRACTICAL SOLUTION FOR TREND DATA:
 * 
 * Current Workaround (BAD):
 * - Standalone reports use the FIRST available lab booking in the database
 * - This links trend data to a random patient's booking (WRONG!)
 * 
 * Practical Solutions:
 * 1. Make labBookingId optional in schema (requires migration) ✅ RECOMMENDED
 * 2. Create a virtual/placeholder booking for standalone reports
 * 3. Use a separate trend model for standalone reports
 * 
 * We'll implement Solution 1: Make labBookingId optional
 * For standalone reports, we'll set labBookingId to null
 * The schema needs to be updated to allow nullable labBookingId
 */
async function createTrendData(
  context: LabReportProcessingContext,
  allValues: any[],
  criticalValues: any[]
) {
  const reportDate = context.reportDate;
  if (!reportDate) {
    console.warn('[UNIFIED-LLM] Skipping trend data creation: reportDate not available');
    return;
  }
  const valuesToProcess = criticalValues.length > 0 ? criticalValues : allValues;

  for (const value of valuesToProcess) {
    if (!value.parameter || !value.value) continue;

    try {
      // For standalone reports, labBookingId will be null (requires schema update)
      // For lab booking reports, use the actual labBookingId
      const labBookingId = context.reportType === 'labBooking' 
        ? context.labBookingId 
        : null; // Will be null for standalone reports

      // labBookingId is now optional in schema, so we can create trend data for standalone reports

      const sourceReportId = context.reportType === 'standalone'
        ? null
        : context.labReportAnalysisId || null;

      const standaloneReportId = context.reportType === 'standalone'
        ? context.standaloneReportId || null
        : null;

      await prisma.reportTrendData.create({
        data: {
          patientId: context.patientId,
          parameter: String(value.parameter),
          value: String(value.value),
          unit: value.unit ? String(value.unit) : null,
          normalRange: value.normalRange ? String(value.normalRange) : null,
          isAbnormal: Boolean(value.isAbnormal),
          severity: value.severity && ['LOW','NORMAL','HIGH','CRITICAL'].includes(String(value.severity).toUpperCase())
            ? String(value.severity).toUpperCase() as 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
            : null,
          reportDate,
          labBookingId: labBookingId || null, // Now optional - can be null for standalone reports
          standaloneReportId: standaloneReportId || null, // Link to standalone report if applicable
          sourceReportId
        }
      });
    } catch (error) {
      console.error(`[UNIFIED-LLM] Error creating trend data for ${value.parameter}:`, error);
      // Continue with other values
    }
  }
}

/**
 * Helper to update progress if callback is provided
 */
async function updateProgressIfAvailable(
  updateProgress: ((stage: string, message: string) => Promise<void>) | undefined,
  message: string
) {
  if (updateProgress) {
    try {
      await updateProgress('processing', message);
    } catch (error) {
      // Don't fail if progress update fails
      console.warn('[UNIFIED-LLM] Progress update failed:', error);
    }
  }
}
