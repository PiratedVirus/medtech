import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSummary } from "@/lib/llm/unified-service";
// Enhanced PDF processor - using dynamic import to avoid build issues
// import { EnhancedPDFProcessor } from "@/lib/llm/enhanced-pdf-processor";

// Ensure Node.js runtime for file uploads and larger payloads
export const runtime = 'nodejs';

// GROQ-only unified processing
const OR_MODEL = 'groq+extractor';
const MAX_TEXT_TOKENS = 8000; // Conservative token limit for input text

// GROQ content extractor (replaces OpenRouter helper)
function extractGroqContent(responseJson: any): string {
  if (!responseJson) {
    throw new Error('Empty response from Groq');
  }

  if (responseJson.error) {
    const err = typeof responseJson.error === 'string' ? responseJson.error : (responseJson.error.message || JSON.stringify(responseJson.error));
    throw new Error(`Groq API error: ${err}`);
  }

  const choice = responseJson.choices?.[0];
  const message = choice?.message ?? choice;
  let content = message?.content ?? choice?.content;

  if (Array.isArray(content)) {
    const text = content
      .map((part: any) => typeof part?.text === 'string' ? part.text : (typeof part === 'string' ? part : ''))
      .filter(Boolean)
      .join('\n')
      .trim();
    if (text) return text;
  }

  if (typeof content === 'string' && content.trim()) {
    return content;
  }

  const deltaContent = choice?.delta?.content;
  if (typeof deltaContent === 'string' && deltaContent.trim()) {
    return deltaContent;
  }

  throw new Error('No content received from LLM');
}

// Try to coerce slightly-invalid JSON to valid JSON
function tryParseLooseJson(jsonLike: string): any | null {
  try {
    let s = jsonLike.trim();
    s = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    // Extract the first top-level JSON object if extra text exists
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      s = s.slice(start, end + 1);
    }
    // Normalize smart quotes
    s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    // Remove trailing commas before } or ]
    s = s.replace(/,\s*([}\]])/g, '$1');
    // Parse
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * GET /api/llm-process?reportId=123
 * For testing: do NOT read analysis from DB. Only validate booking and return readiness.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    
    if (!reportId) {
      return NextResponse.json(
        { success: false, error: "Missing reportId query parameter", usage: "GET /api/llm-process?reportId=123" },
        { status: 400 }
      );
    }

    const reportIdNum = parseInt(reportId);
    if (isNaN(reportIdNum) || reportIdNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid report ID. Must be a positive number.", reportId },
        { status: 400 }
      );
    }

    const labBooking = await prisma.labBooking.findUnique({
      where: { id: reportIdNum },
      include: { labPackage: true, patient: { select: { id: true, name: true } } }
    });

    if (!labBooking) {
      return NextResponse.json(
        { success: false, error: "Lab booking not found", reportId: reportIdNum },
        { status: 404 }
      );
    }

    // Testing mode: always return not_found to force POST-based real-time LLM processing
    return NextResponse.json({
      success: true,
      status: "not_found",
      labBooking: {
        id: labBooking.id,
        labPackageName: labBooking.labPackage?.name || null
      },
      message: "Testing mode: always process via POST to get fresh LLM output.",
      canProcess: !!(labBooking.labResult && labBooking.labResult.length > 0)
    });

  } catch (error) {
    console.error("Error in llm-process GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined },
      { status: 500 }
    );
  }
}

/**
 * POST /api/llm-process
 * Testing mode: process synchronously and return LLM results directly. No DB reads for existing analysis.
 * Body: { reportId: number, patientId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, patientId, labResultIndex = 0 } = body;

    if (!reportId || !patientId) {
      return NextResponse.json(
        { success: false, error: "Missing reportId/patientId in request body", usage: "POST /api/llm-process with body: { reportId: number, patientId: number }" },
        { status: 400 }
      );
    }

    const reportIdNum = parseInt(reportId);
    const patientIdNum = parseInt(patientId);
    if (isNaN(reportIdNum) || reportIdNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid report ID. Must be a positive number.", reportId },
        { status: 400 }
      );
    }
    if (isNaN(patientIdNum) || patientIdNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID. Must be a positive number.", patientId },
        { status: 400 }
      );
    }

    const labBooking = await prisma.labBooking.findUnique({
      where: { id: reportIdNum },
      include: { labPackage: true, patient: true }
    });
    if (!labBooking) {
      return NextResponse.json(
        { success: false, error: "Lab booking not found", reportId: reportIdNum },
        { status: 404 }
      );
    }
    if (labBooking.patientId !== patientIdNum) {
      return NextResponse.json(
        { success: false, error: "Patient ID mismatch. This report belongs to a different patient.", reportId: reportIdNum, patientId: patientIdNum, actualPatientId: labBooking.patientId },
        { status: 403 }
      );
    }

    if (!labBooking.labResult || labBooking.labResult.length === 0) {
      return NextResponse.json({ success: false, error: "No PDF URL found. Please upload a lab report for analysis." }, { status: 400 });
    }

    // Check if the requested lab result index exists
    if (labResultIndex >= labBooking.labResult.length) {
      return NextResponse.json({ 
        success: false, 
        error: `Lab result index ${labResultIndex} not found. Available indices: 0-${labBooking.labResult.length - 1}` 
      }, { status: 400 });
    }

    const pdfUrl = labBooking.labResult[labResultIndex];
    try { new URL(pdfUrl); } catch { return NextResponse.json({ success: false, error: "Invalid PDF URL format", pdfUrl }, { status: 400 }); }

    console.log(`[LLM-PROC][POST] Request received: reportId=${reportIdNum}, patientId=${patientIdNum}`);
    const existingAnalysis = await prisma.labReportAnalysis.findFirst({
      where: {
        labBookingId: reportIdNum,
        labResultIndex,
        deletedAt: null
      },
      select: {
        id: true,
        trendAnalysis: true
      }
    });

    const analysis = await prisma.labReportAnalysis.upsert({
      where: {
        labBookingId_labResultIndex: {
          labBookingId: reportIdNum,
          labResultIndex
        }
      },
      update: {
        reportUrl: pdfUrl,
        processingStatus: 'PENDING',
        processingError: null,
        processedAt: null,
        deletedAt: null
      },
      create: {
        labBookingId: reportIdNum,
        labResultIndex,
        reportUrl: pdfUrl,
        processingStatus: 'PENDING'
      },
      select: {
        id: true,
        trendAnalysis: true
      }
    });

    const existingReportDateRaw = (analysis.trendAnalysis as any)?.reportDate || (existingAnalysis?.trendAnalysis as any)?.reportDate;
    const parsedExistingReportDate =
      typeof existingReportDateRaw === 'string' && !Number.isNaN(new Date(existingReportDateRaw).getTime())
        ? new Date(existingReportDateRaw)
        : undefined;

    const { processLabReportWithLLM } = await import('@/lib/llm/unified-lab-processor');
    const result = await processLabReportWithLLM(
      {
        reportType: 'labBooking',
        labBookingId: reportIdNum,
        labReportAnalysisId: analysis.id,
        labResultIndex,
        pdfUrl,
        patientId: patientIdNum,
        reportDate: parsedExistingReportDate || labBooking.labDate || new Date()
      },
      {
        analysisType: 'lab_analysis'
      }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'LLM processing failed'
        },
        { status: 500 }
      );
    }

    const persistedAnalysis = await prisma.labReportAnalysis.findUnique({
      where: { id: analysis.id },
      select: {
        id: true,
        llmSummary: true,
        criticalValues: true,
        allValues: true,
        trendAnalysis: true,
        processedAt: true,
        llmModel: true,
        processingStatus: true,
        processingError: true,
        keyFindings: true,
        recommendations: true,
        urgency: true
      }
    });

    return NextResponse.json({
      success: true,
      status: "completed",
      analysis: {
        ...persistedAnalysis,
        labBooking: { id: labBooking.id, labPackageName: labBooking.labPackage?.name || null }
      },
      message: "Completed with persisted lab booking pipeline"
    });

  } catch (error) {
    console.error("Error in llm-process POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined },
      { status: 500 }
    );
  }
}

// Process with production profile using GROQ
async function processWithProductionProfile(pdfUrl: string, profile: any, siteUrl: string): Promise<{ summary: string; allValues: any[]; criticalValues: any[]; }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  // Extract text via OCR
  const text = await extractPdfText(pdfUrl);

  // Run summary and values extraction in parallel using production profile settings
  const [summary, values] = await Promise.all([
    llmGenerateSummaryFromText(text, apiKey, profile),
    llmGenerateValuesFromText(text, apiKey, profile)
  ]);

  let allValues = normalizeLabValues(values.allValues || []);
  let criticalValues = normalizeLabValues(values.criticalValues || []);
  if (criticalValues.length === 0) {
    const abnormal = (allValues || []).filter((v: any) => v && v.isAbnormal && v.severity && v.severity !== 'NORMAL');
    criticalValues = abnormal;
  }

  return { summary, allValues, criticalValues };
}

// Call GROQ to generate summary using production profile
async function llmGenerateSummaryFromText(text: string, apiKey: string, profile: any): Promise<string> {
  const model = profile?.model || 'meta-llama/llama-4-scout-17b-16e-instruct';
  const temperature = profile?.temperature ?? 0.1;
  const maxTokens = profile?.maxTokens ?? 1200;
  
  const systemPrompt = profile?.systemPrompt || 'You are a strict JSON generator. Always respond with a single valid JSON object matching the requested schema. Do not include any prose, code fences, or explanations.';
  
  const userPrompt = profile?.summaryPrompt || `Return STRICT JSON ONLY with this schema:
{
  "summary": "Clinical summary in 200-250 words focusing on key findings, health implications, and recommendations"
}
Do not include any other keys. Use double quotes and valid JSON. No trailing commas.

Lab Report Text:
${text}`;

  console.log(`[LLM-PROC][SUMMARY] Using production profile: ${profile?.name || 'default'}, model: ${model}`);

  const chatPayload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: maxTokens,
    temperature,
    response_format: { type: 'json_object' }
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(chatPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = extractGroqContent(data);

  const parsed = tryParseLooseJson(content);
  if (parsed && typeof parsed.summary === 'string') {
    return parsed.summary;
  }

  if (typeof content === 'string' && content.length > 0) {
    return content.substring(0, 1200);
  }

  throw new Error('Failed to extract summary from LLM response');
}

// Call GROQ to generate values using production profile
async function llmGenerateValuesFromText(text: string, apiKey: string, profile: any): Promise<{ allValues: any[]; criticalValues: any[]; }> {
  const model = profile?.model || 'meta-llama/llama-4-scout-17b-16e-instruct';
  const temperature = profile?.temperature ?? 0.1;
  const maxTokens = profile?.maxTokens ?? 2500;
  
  const systemPrompt = profile?.systemPrompt || 'You are a medical lab report analyzer. Extract ONLY the test parameters and values that are explicitly mentioned in the provided lab report text. DO NOT generate, invent, or hallucinate any values not present in the text. Always respond with a single valid JSON object matching the requested schema. Do not include any prose, code fences, or explanations.';
  
  const userPrompt = profile?.valuesPrompt || `Extract ONLY the test parameters and values that are explicitly mentioned in the provided lab report text.

CRITICAL: DO NOT generate, invent, or hallucinate any values not present in the text. Only extract values that are explicitly shown in the report.

Return STRICT JSON ONLY with this schema:
{
  "allValues": [
    {"parameter": "", "value": "", "unit": "", "normalRange": "", "isAbnormal": false, "severity": "LOW|NORMAL|HIGH|CRITICAL", "category": "CBC|LFT|KFT|Lipid Profile|..."}
  ],
  "criticalValues": [
    {"parameter": "", "value": "", "unit": "", "normalRange": "", "isAbnormal": true, "severity": "LOW|NORMAL|HIGH|CRITICAL", "category": "CBC|LFT|KFT|Lipid Profile|..."}
  ]
}
Rules: 
- Extract ONLY values explicitly present in the report
- DO NOT add any tests not mentioned in the original report
- Use double quotes and valid JSON, no trailing commas, no additional keys
- If a section has no data, return an empty array for it

Lab Report Text:
${text}`;

  console.log(`[LLM-PROC][VALUES] Using production profile: ${profile?.name || 'default'}, model: ${model}`);

  const chatPayload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: maxTokens,
    temperature,
    response_format: { type: 'json_object' }
  };

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(chatPayload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = extractGroqContent(data);

  const parsed = tryParseLooseJson(content) || {};
  const allValues = Array.isArray(parsed.allValues) ? parsed.allValues : [];
  const criticalValues = Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [];
  
  const totalValues = allValues.length + criticalValues.length;
  if (totalValues > 20) {
    console.warn(`[LLM-PROC][VALUES] Warning: Extracted ${totalValues} values, which seems high. Please verify against original report.`);
  }
  
  console.log(`[LLM-PROC][VALUES] Extracted ${allValues.length} all values and ${criticalValues.length} critical values`);
  
  return { allValues, criticalValues };
}

// Parse LLM response to extract structured data
function parseLLMResponse(text: string) {
  try {
    let cleanText = text.trim();
    cleanText = cleanText.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const repaired = tryParseLooseJson(jsonMatch[0]);
      if (repaired) {
        const parsedResponse = repaired;
        const result = {
          summary: parsedResponse.summary || "Analysis completed successfully.",
          criticalValues: Array.isArray(parsedResponse.criticalValues) ? parsedResponse.criticalValues.filter((cv: any) => cv && typeof cv === 'object' && cv.parameter && cv.value) : [],
          allValues: Array.isArray(parsedResponse.allValues) ? parsedResponse.allValues.filter((av: any) => av && typeof av === 'object' && av.parameter && av.value) : [],
          trendAnalysis: null
        };
        if (result.criticalValues.length > 0 && result.allValues.length === 0) {
          result.allValues = [...result.criticalValues];
        }
        result.allValues = normalizeLabValues(result.allValues);
        result.criticalValues = normalizeLabValues(result.criticalValues) || [];
        console.log(`Parsed ${result.criticalValues.length} critical values and ${result.allValues.length} total values`);
        return result;
      }
    }

    console.warn("No valid JSON found, using fallback parsing");
    let summary = "";
    const summaryMatch = text.match(/summary[\"']?\s*[:=]\s*[\"']?([\s\S]*?)(?:[\"']?\s*[,}\n]|$)/i);
    if (summaryMatch) {
      summary = summaryMatch[1].trim().replace(/[\"']/g, '');
    } else {
      summary = text.substring(0, 300) + "...";
    }

    return {
      summary: summary.substring(0, 800),
      criticalValues: [],
      allValues: [],
      trendAnalysis: null
    };
  } catch (error) {
    console.error("Error parsing LLM response:", error);
    return {
      summary: "Failed to parse analysis results. Please try again.",
      criticalValues: [],
      allValues: [],
      trendAnalysis: null
    };
  }
}

function ensureSummary(summary: string | null | undefined, criticalValues: any[], allValues: any[]) {
  const s = (summary || '').toLowerCase();
  const looksBad = !summary || s.includes('not available') || s.includes('further analysis is required') || s.length < 40;
  if (!looksBad) return summary;

  const crit = Array.isArray(criticalValues) ? criticalValues : [];
  const all = Array.isArray(allValues) ? allValues : [];

  if (crit.length === 0 && all.length === 0) {
    return 'No extractable lab metrics found in the report. Please verify the report quality or try reprocessing.';
  }

  const parts: string[] = [];
  if (crit.length > 0) {
    const high = crit.filter(v => v.severity === 'HIGH' || v.severity === 'CRITICAL');
    if (high.length > 0) {
      const top = high.slice(0, 5)
        .map(v => `${v.parameter}: ${v.value}${v.unit ? ' ' + v.unit : ''} (${v.severity})`)
        .join('; ');
      parts.push(`Key abnormalities: ${top}.`);
    }
  }
  if (all.length > 0 && parts.length < 2) {
    const topAll = all.slice(0, 5)
      .map(v => `${v.parameter}: ${v.value}${v.unit ? ' ' + v.unit : ''}`)
      .join('; ');
    parts.push(`Notable metrics: ${topAll}.`);
  }
  return parts.join(' ');
}

// Normalize lab values array: ensure types, category, and derive isAbnormal/severity when missing
function normalizeLabValues(values: any[]): any[] {
  if (!Array.isArray(values)) return [];

  const parsedValues = values.map((v) => {
    const out: any = { ...v };
    // Coerce value to number when possible
    const num = typeof out.value === 'number' ? out.value : parseFloat(String(out.value).replace(/[^0-9.\-]/g, ''));
    out.value = isNaN(num) ? String(out.value ?? '') : num;
    out.unit = out.unit ?? '';
    out.normalRange = out.normalRange ?? '';
    out.category = out.category || inferCategory(out.parameter) || 'Other';

    // Derive abnormality if missing and we have a comparable normal range
    if (typeof out.isAbnormal !== 'boolean' || !out.severity) {
      const derived = deriveAbnormality(out.value, out.normalRange, out.parameter);
      if (typeof out.isAbnormal !== 'boolean') out.isAbnormal = derived.isAbnormal;
      if (!out.severity) out.severity = derived.severity;
    }
    // Default severity
    if (!out.severity) out.severity = 'NORMAL';
    if (typeof out.isAbnormal !== 'boolean') out.isAbnormal = out.severity !== 'NORMAL';
    return out;
  });

  return parsedValues;
}

// Try to infer category from parameter name
function inferCategory(param: string): string | null {
  const p = (param || '').toLowerCase();
  if (/hdl|ldl|triglycerides|cholesterol/.test(p)) return 'Lipid Profile';
  if (/hba1c|glucose|sugar/.test(p)) return 'Diabetes';
  if (/creatinine|urea|bun|uric|electrolyte|sodium|potassium|chloride/.test(p)) return 'KFT';
  if (/bilirubin|sgot|ast|sgpt|alt|alkaline|albumin|globulin|lft/.test(p)) return 'LFT';
  if (/haemoglobin|hemoglobin|wbc|rbc|platelet|cbc|dlc|mpv|rdw|mch|mcv|mchc/.test(p)) return 'CBC';
  if (/vitamin\s?d/.test(p)) return 'Vitamin D';
  if (/vitamin\s?b12/.test(p)) return 'Vitamin B12';
  if (/tsh|t3|t4|thyroid/.test(p)) return 'Thyroid';
  if (/bp|blood pressure|mmhg/.test(p)) return 'Vitals';
  return null;
}

// Derive abnormality and severity from value and normalRange when possible
function deriveAbnormality(value: any, normalRange: string, parameter: string): { isAbnormal: boolean; severity: 'LOW'|'NORMAL'|'HIGH'|'CRITICAL' } {
  // Defaults
  const res = { isAbnormal: false, severity: 'NORMAL' as 'LOW'|'NORMAL'|'HIGH'|'CRITICAL' };

  // Non-numeric values or missing range
  if (typeof value !== 'number' || !normalRange) return res;

  // Parse ranges like "70-100 mg/dL", "<200 mg/dL", ">40 mg/dL"
  const range = normalRange.toLowerCase();
  const between = range.match(/([0-9]+\.?[0-9]*)\s*[-–]\s*([0-9]+\.?[0-9]*)/);
  const lt = range.match(/<\s*([0-9]+\.?[0-9]*)/);
  const gt = range.match(/>\s*([0-9]+\.?[0-9]*)/);

  if (between) {
    const low = parseFloat(between[1]);
    const high = parseFloat(between[2]);
    if (!isNaN(low) && !isNaN(high)) {
      if (value < low) { res.isAbnormal = true; res.severity = 'LOW'; }
      if (value > high) { res.isAbnormal = true; res.severity = 'HIGH'; }
    }
  } else if (lt) {
    const max = parseFloat(lt[1]);
    if (!isNaN(max)) {
      if (value >= max) { res.isAbnormal = true; res.severity = 'HIGH'; }
    }
  } else if (gt) {
    const min = parseFloat(gt[1]);
    if (!isNaN(min)) {
      if (value <= min) { res.isAbnormal = true; res.severity = 'LOW'; }
    }
  }

  // Escalate some parameters to CRITICAL heuristically
  const p = (parameter || '').toLowerCase();
  if (res.isAbnormal) {
    if (/hba1c/.test(p) && value >= 9) res.severity = 'CRITICAL';
    if (/glucose/.test(p) && value >= 300) res.severity = 'CRITICAL';
    if (/ldl/.test(p) && value >= 190) res.severity = 'CRITICAL';
    if (/sodium/.test(p) && (value <= 120 || value >= 160)) res.severity = 'CRITICAL';
    if (/potassium/.test(p) && (value <= 2.5 || value >= 6.5)) res.severity = 'CRITICAL';
  }

  return res;
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

// Handle case when no PDF URL is available
async function createNoDataAnalysis(labBookingId: number, patientId: number) {
  const analysis = await prisma.labReportAnalysis.create({
    data: {
      labBookingId: labBookingId,
      reportUrl: "",
      llmSummary: "No PDF report available for analysis. Please upload a lab report to enable AI-powered analysis.",
      criticalValues: [],
      allValues: [],
      trendAnalysis: {},
      llmModel: 'no-data',
      processingStatus: 'COMPLETED',
      processedAt: new Date()
    }
  });

  return analysis;
}

// Extract PDF text using OCR and return cleaned text
async function extractPdfText(pdfUrl: string): Promise<string> {
  console.log('[LLM-PROC][PDF] Using OCR (Google Vision) for PDF text extraction');
  
  // Always use OCR for PDF text extraction
  const { ocrExtractPdfTextFromUrl } = await import('@/lib/ocr/google-vision');
  let extractedText = await ocrExtractPdfTextFromUrl(pdfUrl);
  
  if (!extractedText || extractedText.trim().length < 50) {
    throw new Error('OCR text extraction failed or insufficient content');
  }

  extractedText = extractedText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .substring(0, MAX_TEXT_TOKENS);

  console.log(`[LLM-PROC][PDF] Extracted ${extractedText.length} characters from PDF using OCR`);
  return extractedText;
}
