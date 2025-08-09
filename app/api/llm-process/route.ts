import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Enhanced PDF processor - using dynamic import to avoid build issues
// import { EnhancedPDFProcessor } from "@/lib/llm/enhanced-pdf-processor";

// Ensure Node.js runtime for file uploads and larger payloads
export const runtime = 'nodejs';

// Optimized model choices for medical text analysis
const OR_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
const FALLBACK_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free',
  'microsoft/phi-3-mini-128k-instruct:free',
  'openai/gpt-oss-20b:free'
];
const MAX_PDF_MB = Number(process.env.OPENROUTER_MAX_PDF_MB ?? 10);
const MAX_TEXT_TOKENS = 8000; // Conservative token limit for input text

/**
 * GET /api/llm-process?reportId=123
 * Check status and retrieve existing analysis
 */
export async function GET(request: NextRequest) {
  try {
    // Get reportId from query parameters
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    
    if (!reportId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing reportId query parameter",
          usage: "GET /api/llm-process?reportId=123"
        },
        { status: 400 }
      );
    }

    // Validate reportId
    const reportIdNum = parseInt(reportId);
    if (isNaN(reportIdNum) || reportIdNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid report ID. Must be a positive number.",
          reportId 
        },
        { status: 400 }
      );
    }

    // Check if lab booking exists
    const labBooking = await prisma.labBooking.findUnique({
      where: { id: reportIdNum },
      include: {
        labPackage: true,
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!labBooking) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Lab booking not found",
          reportId: reportIdNum 
        },
        { status: 404 }
      );
    }

    // Check for existing analysis
    const analysis = await prisma.labReportAnalysis.findUnique({
      where: { labBookingId: reportIdNum },
      include: {
        labBooking: {
          include: {
            labPackage: true,
            patient: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (analysis) {
      return NextResponse.json({
        success: true,
        status: "exists",
        analysis,
        message: `Analysis found with status: ${analysis.processingStatus}`
      });
    }

    // No analysis exists
    return NextResponse.json({
      success: true,
      status: "not_found",
      labBooking,
      message: "No analysis found. Ready for processing.",
      canProcess: !!(labBooking.labResult && labBooking.labResult.length > 0)
    });

  } catch (error) {
    console.error("Error in llm-process GET:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llm-process
 * Start LLM processing or retrieve existing results
 * Body: { reportId: number, patientId: number, forceReprocess?: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, patientId, forceReprocess = false, force = false } = body;
    const shouldForce = Boolean(forceReprocess || force);

    // Validate required fields
    if (!reportId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing reportId in request body",
          usage: "POST /api/llm-process with body: { reportId: number, patientId: number }"
        },
        { status: 400 }
      );
    }

    if (!patientId) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing patientId in request body",
          usage: "POST /api/llm-process with body: { reportId: number, patientId: number }"
        },
        { status: 400 }
      );
    }

    // Validate inputs
    const reportIdNum = parseInt(reportId);
    const patientIdNum = parseInt(patientId);
    
    if (isNaN(reportIdNum) || reportIdNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid report ID. Must be a positive number.",
          reportId 
        },
        { status: 400 }
      );
    }

    if (isNaN(patientIdNum) || patientIdNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid patient ID. Must be a positive number.",
          patientId 
        },
        { status: 400 }
      );
    }

    // Get lab booking with validation
    const labBooking = await prisma.labBooking.findUnique({
      where: { id: reportIdNum },
      include: {
        labPackage: true,
        patient: true
      }
    });

    if (!labBooking) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Lab booking not found",
          reportId: reportIdNum 
        },
        { status: 404 }
      );
    }

    // Validate patient ownership
    if (labBooking.patientId !== patientIdNum) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Patient ID mismatch. This report belongs to a different patient.",
          reportId: reportIdNum,
          patientId: patientIdNum,
          actualPatientId: labBooking.patientId
        },
        { status: 403 }
      );
    }

    // Check for existing analysis
    let analysis = await prisma.labReportAnalysis.findUnique({
      where: { labBookingId: reportIdNum }
    });

    // If analysis exists and is completed, return it (unless force/forceReprocess)
    if (analysis && analysis.processingStatus === 'COMPLETED' && !shouldForce) {
      return NextResponse.json({
        success: true,
        status: "already_exists",
        analysis,
        message: "Analysis already completed. Use forceReprocess=true to regenerate."
      });
    }

    // If analysis is currently processing, return status
    if (analysis && analysis.processingStatus === 'PROCESSING') {
      return NextResponse.json({
        success: true,
        status: "processing",
        analysis,
        message: "Analysis is currently being processed. Please wait."
      });
    }

    // Check if we have PDF URL
    if (!labBooking.labResult || labBooking.labResult.length === 0) {
      // Create sample analysis for testing
      const sampleAnalysis = await createSampleAnalysis(reportIdNum, patientIdNum);
      return NextResponse.json({
        success: true,
        status: "sample_created",
        analysis: sampleAnalysis,
        message: "No PDF URL found. Created sample analysis for testing."
      });
    }

    const pdfUrl = labBooking.labResult[0];

    // Validate PDF URL
    try {
      new URL(pdfUrl);
    } catch (urlError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid PDF URL format",
          pdfUrl 
        },
        { status: 400 }
      );
    }

    // Create or update analysis record
    if (!analysis) {
      analysis = await prisma.labReportAnalysis.create({
        data: {
          labBookingId: reportIdNum,
          reportUrl: pdfUrl,
          processingStatus: 'PROCESSING',
          llmModel: OR_MODEL
        }
      });
    } else {
      analysis = await prisma.labReportAnalysis.update({
        where: { id: analysis.id },
        data: { 
          processingStatus: 'PROCESSING',
          processingError: null,
          llmModel: OR_MODEL
        }
      });
    }

    // Start background processing
    processWithOpenRouter(analysis.id, pdfUrl, patientIdNum, reportIdNum)
      .catch(error => {
        console.error("Background processing failed:", error);
      });

    return NextResponse.json({
      success: true,
      status: "processing_started",
      analysisId: analysis.id,
      message: "LLM processing started successfully",
      estimatedTime: "30-60 seconds"
    });
    
  } catch (error) {
    console.error("Error in llm-process POST:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  }
}

// Process PDF with OpenRouter - Enhanced with multiple strategies
async function processWithOpenRouter(analysisId: number, pdfUrl: string, patientId: number, labBookingId: number) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY not configured in environment variables");
    }

    console.log(`[LLM-PROC] [${analysisId}] Starting PDF analysis with OpenRouter`);

    // Use working PDF processor
    console.log(`[LLM-PROC] [${analysisId}] Starting PDF processing`);
    const analysisText = await processWithWorkingStrategy(pdfUrl, apiKey, siteUrl);

    console.log(`[LLM-PROC] [${analysisId}] Parsing LLM response to structured fields`);
    const { summary, criticalValues, trendAnalysis } = parseLLMResponse(analysisText);

    // Update analysis in database
    await prisma.labReportAnalysis.update({
      where: { id: analysisId },
      data: {
        llmSummary: summary,
        criticalValues: criticalValues,
        trendAnalysis: trendAnalysis?.trends ? { trends: trendAnalysis.trends } : null,
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
        processingError: null,
        llmModel: OR_MODEL
      }
    });

    // Correctly link trend data to the lab booking and source analysis
    await saveTrendData(patientId, criticalValues, labBookingId, analysisId);

    console.log(`[LLM-PROC] [${analysisId}] Analysis saved; processing complete`);
  } catch (error) {
    console.error(`[LLM-PROC] [${analysisId}] ERROR:`, error);

    // Update analysis with error status
    await prisma.labReportAnalysis.update({
      where: { id: analysisId },
      data: {
        processingStatus: 'FAILED',
        processingError: (error as Error).message
      }
    });

    throw error; // Re-throw for caller handling
  }
}

// Working PDF processing implementation
async function processWithWorkingStrategy(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
  // Check if API key is configured
  if (!apiKey || apiKey.trim() === '') {
    console.warn('No OpenRouter API key configured');
    return `**SUMMARY**
🔑 **API Key Required**: To enable AI-powered analysis of your lab reports, please configure your OpenRouter API key.

**Setup Instructions:**
1. Sign up at https://openrouter.ai (free)
2. Get your API key from the dashboard  
3. Add to your .env.local file: OPENROUTER_API_KEY="your_key_here"
4. Restart your development server

**CRITICAL VALUES**
[
  {"parameter": "Setup Required", "value": "Missing API Key", "unit": "config", "normalRange": "API key configured", "isAbnormal": true, "severity": "HIGH"}
]

**TRENDS**
Please configure your API key to enable real-time AI analysis of lab reports with medical insights and trend tracking.`;
  }

  try {
    // Strategy 1: Try text extraction first (most reliable)
    console.log('Attempting PDF text extraction strategy');
    return await extractAndProcessText(pdfUrl, apiKey, siteUrl);
  } catch (textError) {
    console.log('Text extraction failed, trying direct URL approach:', textError);
    
    // Strategy 2: Try direct URL approach
    try {
      return await processWithDirectUrl(pdfUrl, apiKey, siteUrl);
    } catch (urlError) {
      console.error('All strategies failed:', urlError);
      throw new Error(`PDF processing failed: ${urlError instanceof Error ? urlError.message : 'Unknown error'}`);
    }
  }
}

// Strategy 1: Extract text from PDF and send to LLM
async function extractAndProcessText(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
  // Download PDF
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  
  // Check file size
  const fileSizeMB = buffer.length / (1024 * 1024);
  console.log(`PDF size: ${fileSizeMB.toFixed(2)}MB`);
  
  if (fileSizeMB > MAX_PDF_MB) {
    throw new Error(`PDF too large: ${fileSizeMB.toFixed(2)}MB (max: ${MAX_PDF_MB}MB)`);
  }

  // Extract text using pdf-parse with dynamic import
  const pdfParse = (await import('pdf-parse')).default;
  const pdfData = await pdfParse(buffer);
  let extractedText = pdfData.text;
  
  if (!extractedText || extractedText.trim().length < 50) {
    throw new Error('PDF text extraction failed or insufficient content');
  }

  // Clean and limit text
  extractedText = extractedText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .substring(0, MAX_TEXT_TOKENS);

  console.log(`Extracted ${extractedText.length} characters from PDF`);

  // Send extracted text to LLM
  return await sendTextToLLM(extractedText, apiKey, siteUrl);
}

// Strategy 2: Send PDF URL directly to LLM
async function processWithDirectUrl(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
  const chatPayload = {
    model: OR_MODEL,
    messages: [{
      role: 'user',
      content: `Please analyze the PDF document at this URL and provide:

**SUMMARY** (max 250 words)

**CRITICAL VALUES** as a JSON array. Use this exact JSON shape:
[
  {"parameter": string, "value": string|number, "unit": string, "normalRange": string, "isAbnormal": boolean, "severity": "LOW"|"NORMAL"|"HIGH"}
]

**TRENDS** (plain text). Focus on diabetes markers, cardiovascular risk, metabolic, kidney and liver function.

PDF URL: ${pdfUrl}`
    }],
    max_tokens: 1800,
    temperature: 0.2
  };

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': siteUrl,
      'X-Title': 'CareDB Lab Analysis',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(chatPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) {
    throw new Error('No content received from LLM');
  }

  return content;
}

// Send extracted text to LLM for analysis
async function sendTextToLLM(text: string, apiKey: string, siteUrl: string): Promise<string> {
  const models = [
    'meta-llama/llama-3.2-3b-instruct:free',
    'microsoft/phi-3-mini-128k-instruct:free',
    'openai/gpt-oss-20b:free'
  ];

  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      
      const chatPayload = {
        model,
        messages: [{
          role: 'user',
          content: `Analyze this medical lab report text and return:

**SUMMARY** (max 250 words)

**CRITICAL VALUES** as a JSON array. Use this exact JSON shape:
[
  {"parameter": string, "value": string|number, "unit": string, "normalRange": string, "isAbnormal": boolean, "severity": "LOW"|"NORMAL"|"HIGH"}
]

**TRENDS** (plain text). Focus on diabetes markers, cardiovascular risk, metabolic, kidney and liver function.

Lab Report Text:
${text}`
        }],
        max_tokens: 1800,
        temperature: 0.2
      };

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': siteUrl,
          'X-Title': 'CareDB Lab Analysis',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(chatPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from LLM');
      }

      console.log(`Model ${model} succeeded`);
      return content;
    } catch (error) {
      console.warn(`Model ${model} failed:`, error);
      lastError = error as Error;
      continue;
    }
  }

  throw new Error(`All models failed. Last error: ${lastError?.message}`);
}

// Parse LLM response to extract structured data
function parseLLMResponse(text: string) {
  try {
    // Try to extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    let criticalValues = [];
    
    if (jsonMatch) {
      try {
        criticalValues = JSON.parse(jsonMatch[0]);
        // Validate that it's an array of objects with required fields
        if (Array.isArray(criticalValues)) {
          criticalValues = criticalValues.filter(cv => 
            cv && typeof cv === 'object' && cv.parameter && cv.value
          );
        } else {
          criticalValues = [];
        }
      } catch (e) {
        console.warn("Failed to parse critical values JSON:", e);
        criticalValues = [];
      }
    }

    // Extract summary (text before JSON or first major section)
    let summary = "";
    const summaryMatch = text.match(/\*\*SUMMARY\*\*\s*[:\s]*([\s\S]*?)(?:\*\*CRITICAL|$)/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim();
    } else {
      // Fallback: take first paragraph or first 300 chars
      const firstParagraph = text.split('\n\n')[0];
      summary = firstParagraph.length > 50 ? firstParagraph : text.substring(0, 300);
    }

    // Extract trends section
    let trendAnalysis = null;
    const trendsMatch = text.match(/\*\*TRENDS\*\*\s*[:\s]*([\s\S]*?)$/i);
    if (trendsMatch) {
      trendAnalysis = { trends: trendsMatch[1].trim() };
    }

    return {
      summary: summary.substring(0, 800), // Reasonable limit
      criticalValues: criticalValues,
      trendAnalysis: trendAnalysis
    };
  } catch (error) {
    console.error("Error parsing LLM response:", error);
    return {
      summary: text.substring(0, 300) + "...",
      criticalValues: [],
      trendAnalysis: null
    };
  }
}

// Save trend data for historical tracking (correct labBookingId/sourceReportId)
async function saveTrendData(patientId: number, criticalValues: any[], labBookingId: number, sourceAnalysisId: number) {
  try {
    if (!Array.isArray(criticalValues)) return;

    const trendPromises = criticalValues.map(async (cv) => {
      if (cv?.parameter && (cv.value !== undefined && cv.value !== null)) {
        try {
          await prisma.reportTrendData.create({
            data: {
              patientId: patientId,
              parameter: cv.parameter,
              value: String(cv.value),
              unit: cv.unit || '',
              normalRange: cv.normalRange || '',
              isAbnormal: Boolean(cv.isAbnormal),
              severity: cv.severity || 'NORMAL',
              reportDate: new Date(),
              labBookingId: labBookingId,       // correct link to lab booking
              sourceReportId: sourceAnalysisId   // link back to the analysis row
            }
          });
        } catch (trendError) {
          console.warn(`Failed to save trend data for ${cv.parameter}:`, trendError);
        }
      }
    });

    await Promise.allSettled(trendPromises);
  } catch (error) {
    console.error("Error saving trend data:", error);
  }
}

// Create sample analysis for testing when no PDF URL
async function createSampleAnalysis(labBookingId: number, patientId: number) {
  const sampleCriticalValues = [
    {
      parameter: "HbA1c",
      value: "7.2",
      unit: "%",
      normalRange: "<7.0%",
      isAbnormal: true,
      severity: "HIGH"
    },
    {
      parameter: "Fasting Glucose",
      value: "135",
      unit: "mg/dL",
      normalRange: "70-100 mg/dL",
      isAbnormal: true,
      severity: "HIGH"
    },
    {
      parameter: "Total Cholesterol",
      value: "220",
      unit: "mg/dL",
      normalRange: "<200 mg/dL",
      isAbnormal: true,
      severity: "HIGH"
    },
    {
      parameter: "HDL Cholesterol",
      value: "35",
      unit: "mg/dL",
      normalRange: ">40 mg/dL",
      isAbnormal: true,
      severity: "LOW"
    }
  ];

  const analysis = await prisma.labReportAnalysis.create({
    data: {
      labBookingId: labBookingId,
      reportUrl: 'sample://test-report',
      llmSummary: "**SAMPLE ANALYSIS** - Patient shows elevated glucose and HbA1c indicating suboptimal diabetic control. The HbA1c of 7.2% exceeds the target of <7.0% for most diabetic patients. Fasting glucose of 135 mg/dL is also elevated (normal: 70-100 mg/dL). Cholesterol profile shows total cholesterol at 220 mg/dL (elevated) and HDL at 35 mg/dL (low), indicating dyslipidemia. This combination increases cardiovascular risk. Recommendations include medication review, dietary modifications, and closer monitoring.",
      criticalValues: sampleCriticalValues,
      trendAnalysis: { 
        trends: "Based on current values, glucose control needs improvement. HbA1c trending above target suggests need for therapeutic intervention. Lipid management should be addressed to reduce cardiovascular risk."
      },
      llmModel: 'sample-analysis-v1',
      processingStatus: 'COMPLETED',
      processedAt: new Date()
    }
  });

  // Save sample trend data
  await saveTrendData(patientId, sampleCriticalValues, labBookingId, analysis.id);

  return analysis;
}
