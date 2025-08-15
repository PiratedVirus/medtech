import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
// Enhanced PDF processor - using dynamic import to avoid build issues
// import { EnhancedPDFProcessor } from "@/lib/llm/enhanced-pdf-processor";

// Ensure Node.js runtime for file uploads and larger payloads
export const runtime = 'nodejs';

// Optimized model choices for medical text analysis
// Use gpt-oss-20b by default as requested
const OR_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
const FALLBACK_MODELS = [
  'meta-llama/llama-3.2-3b-instruct:free'
];
const MAX_PDF_MB = Number(process.env.OPENROUTER_MAX_PDF_MB ?? 10);
const MAX_TEXT_TOKENS = 8000; // Conservative token limit for input text

function extractOpenRouterContent(responseJson: any): string {
  if (!responseJson) {
    throw new Error('Empty response from OpenRouter');
  }

  if (responseJson.error) {
    const err = typeof responseJson.error === 'string' ? responseJson.error : (responseJson.error.message || JSON.stringify(responseJson.error));
    throw new Error(`OpenRouter API error: ${err}`);
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

    console.log(`[LLM-PROC][POST] Request received: reportId=${reportIdNum}, patientId=${patientIdNum}, force=false. Model=${OR_MODEL}`);

    const apiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'OPENROUTER_API_KEY not configured in environment variables' }, { status: 500 });
    }

    // New pipeline: extract text once, then make two LLM calls (summary + values)
    const { summary, allValues, criticalValues } = await processUsingTextThenLLMs(pdfUrl, apiKey, siteUrl);

    return NextResponse.json({
      success: true,
      status: "completed",
      analysis: {
        id: null,
        llmSummary: ensureSummary(summary, criticalValues, allValues),
        criticalValues: criticalValues || [],
        allValues: allValues || [],
        trendAnalysis: {},
        processedAt: new Date().toISOString(),
        llmModel: OR_MODEL,
        labBooking: { id: labBooking.id, labPackageName: labBooking.labPackage?.name || null }
      },
      message: "Completed with fresh LLM output (testing mode, parsed once then reused)"
    });

  } catch (error) {
    console.error("Error in llm-process POST:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error", details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined },
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

    console.log(`[LLM-PROC][START] analysisId=${analysisId} model=${OR_MODEL}`);

    // Use working PDF processor
    console.log(`[LLM-PROC][STRATEGY] analysisId=${analysisId} Starting PDF processing`);
    const analysisText = await processWithWorkingStrategy(pdfUrl, apiKey, siteUrl);

    console.log(`[LLM-PROC][PARSE] analysisId=${analysisId} Parsing LLM response to structured fields`);
    const { summary, criticalValues, allValues, trendAnalysis } = parseLLMResponse(analysisText);

    await prisma.labReportAnalysis.update({
      where: { id: analysisId },
      data: {
        llmSummary: ensureSummary(summary, criticalValues, allValues),
        criticalValues,
        allValues,
        trendAnalysis: {},
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
        processingError: null,
        llmModel: OR_MODEL
      }
    });

    await saveTrendData(patientId, criticalValues, labBookingId, analysisId);

    console.log(`[LLM-PROC][DONE] analysisId=${analysisId} saved; processing complete`);
  } catch (error) {
    console.error(`[LLM-PROC][ERROR] analysisId=${analysisId}:`, error);

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
  if (!apiKey || apiKey.trim() === '') {
    console.warn('No OpenRouter API key configured');
    return `{"summary":"API key missing","criticalValues":[],"allValues":[]}`;
  }

  try {
    // Strategy 1: Try text extraction first (most reliable)
    console.log('[LLM-PROC][STRATEGY] Attempting PDF text extraction strategy');
    return await extractAndProcessText(pdfUrl, apiKey, siteUrl);
  } catch (textError) {
    console.log('[LLM-PROC][STRATEGY] Text extraction failed, trying direct URL approach:', textError);
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
  console.log('[LLM-PROC][PDF] Downloading PDF from URL');
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer || buffer.length === 0) {
    throw new Error('Downloaded PDF buffer is empty');
  }

  const fileSizeMB = buffer.length / (1024 * 1024);
  console.log(`[LLM-PROC][PDF] Size: ${fileSizeMB.toFixed(2)}MB (max ${MAX_PDF_MB}MB)`);
  if (fileSizeMB > MAX_PDF_MB) {
    throw new Error(`PDF too large: ${fileSizeMB.toFixed(2)}MB (max: ${MAX_PDF_MB}MB)`);
  }

  let pdfParse: any;
  try {
    pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  } catch {
    pdfParse = (await import('pdf-parse')).default;
  }
  const pdfData = await pdfParse(buffer);
  let extractedText = pdfData.text;

  if (!extractedText || extractedText.trim().length < 50) {
    throw new Error('PDF text extraction failed or insufficient content');
  }

  extractedText = extractedText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .substring(0, MAX_TEXT_TOKENS);

  console.log(`[LLM-PROC][PDF] Extracted ${extractedText.length} characters from PDF`);
  return await sendTextToLLM(extractedText, apiKey, siteUrl);
}

// Strategy 2: Send PDF URL directly to LLM
async function processWithDirectUrl(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
  const chatPayload = {
    model: OR_MODEL,
    messages: [
      { role: 'system', content: 'You are a strict JSON generator. Always respond with a single valid JSON object matching the requested schema. Do not include any prose, code fences, or explanations.' },
      {
        role: 'user',
        content: `You are a medical lab report parser. Return STRICT JSON ONLY. Do not include any text outside JSON. Rules: use double quotes for all keys and strings, booleans as true/false, no trailing commas, no comments, no code fences.

Schema:
{
  "summary": "Clinical summary in 200-250 words focusing on key findings, health implications, and recommendations",
  "criticalValues": [
    {
      "parameter": "Parameter name",
      "value": "actual value",
      "unit": "unit of measurement",
      "normalRange": "normal reference range",
      "isAbnormal": true,
      "severity": "LOW|NORMAL|HIGH|CRITICAL",
      "category": "CBC|LFT|KFT|Lipid Profile|..."
    }
  ],
  "allValues": [
    {
      "parameter": "Parameter name",
      "value": "actual value",
      "unit": "unit of measurement",
      "normalRange": "normal reference range",
      "isAbnormal": false,
      "severity": "LOW|NORMAL|HIGH|CRITICAL",
      "category": "CBC|LFT|KFT|Lipid Profile|..."
    }
  ]
}

If a section has no data, return an empty array for it. Do not add explanations.

PDF URL: ${pdfUrl}`
      }
    ],
    max_tokens: 2500,
    temperature: 0.1,
    response_format: { type: 'json_object' }
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
  // Always log raw provider response (may be large)
  try {
    console.log('[LLM-PROC][RAW][URL] Provider response JSON:', JSON.stringify(data));
  } catch {
    console.log('[LLM-PROC][RAW][URL] Provider response JSON: <unserializable>');
  }
  const content = extractOpenRouterContent(data);
  // Always log extracted content
  console.log('[LLM-PROC][RAW][URL] Extracted content:', typeof content === 'string' ? content : String(content));
  if (!content) {
    throw new Error('No content received from LLM');
  }

  return content;
}

// Send extracted text to LLM for comprehensive analysis
async function sendTextToLLM(text: string, apiKey: string, siteUrl: string): Promise<string> {
  const models = [ 'meta-llama/llama-3.2-3b-instruct:free' ];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      console.log(`Trying model: ${model}`);
      const chatPayload = {
        model,
        messages: [
          { role: 'system', content: 'You are a strict JSON generator. Always respond with a single valid JSON object matching the requested schema. Do not include any prose, code fences, or explanations.' },
          {
            role: 'user',
            content: `You are a medical lab report parser. Return STRICT JSON ONLY. Do not include any text outside JSON. Rules: use double quotes for all keys and strings, booleans as true/false, no trailing commas, no comments, no code fences.

Schema:
{
  "summary": "Clinical summary in 200-250 words focusing on key findings, health implications, and recommendations",
  "criticalValues": [
    {
      "parameter": "Parameter name",
      "value": "actual value",
      "unit": "unit of measurement",
      "normalRange": "normal reference range",
      "isAbnormal": true,
      "severity": "LOW|NORMAL|HIGH|CRITICAL",
      "category": "CBC|LFT|KFT|Lipid Profile|..."
    }
  ],
  "allValues": [
    {
      "parameter": "Parameter name",
      "value": "actual value",
      "unit": "unit of measurement",
      "normalRange": "normal reference range",
      "isAbnormal": false,
      "severity": "LOW|NORMAL|HIGH|CRITICAL",
      "category": "CBC|LFT|KFT|Lipid Profile|..."
    }
  ]
}

If a section has no data, return an empty array for it. Do not add explanations.

Lab Report Text:\n${text}`
          }
        ],
        max_tokens: 2500,
        temperature: 0.1,
        response_format: { type: 'json_object' }
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
      // Always log raw provider response (may be large)
      try {
        console.log('[LLM-PROC][RAW][TEXT] Provider response JSON:', JSON.stringify(data));
      } catch {
        console.log('[LLM-PROC][RAW][TEXT] Provider response JSON: <unserializable>');
      }
      const content = extractOpenRouterContent(data);
      // Always log extracted content
      console.log('[LLM-PROC][RAW][TEXT] Extracted content:', typeof content === 'string' ? content : String(content));
      if (!content) {
        throw new Error('No content received from LLM');
      }

      console.log(`[LLM-PROC][MODEL] ${model} succeeded`);
      return content;
    } catch (error) {
      console.warn(`[LLM-PROC][MODEL] ${model} failed:`, error);
      lastError = error as Error;
      continue;
    }
  }

  throw new Error(`All models failed. Last error: ${lastError?.message}`);
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

// Extract PDF text once (download + parse) and return cleaned text
async function extractPdfText(pdfUrl: string): Promise<string> {
  console.log('[LLM-PROC][PDF] Downloading PDF from URL');
  const response = await fetch(pdfUrl);
  if (!response.ok) {
    throw new Error(`Failed to download PDF: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer || buffer.length === 0) {
    throw new Error('Downloaded PDF buffer is empty');
  }

  const fileSizeMB = buffer.length / (1024 * 1024);
  console.log(`[LLM-PROC][PDF] Size: ${fileSizeMB.toFixed(2)}MB (max ${MAX_PDF_MB}MB)`);
  if (fileSizeMB > MAX_PDF_MB) {
    throw new Error(`PDF too large: ${fileSizeMB.toFixed(2)}MB (max: ${MAX_PDF_MB}MB)`);
  }

  let pdfParse: any;
  try {
    pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
  } catch {
    pdfParse = (await import('pdf-parse')).default;
  }

  const pdfData = await pdfParse(buffer);
  let extractedText = pdfData.text;
  if (!extractedText || extractedText.trim().length < 50) {
    throw new Error('PDF text extraction failed or insufficient content');
  }

  extractedText = extractedText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .substring(0, MAX_TEXT_TOKENS);

  console.log(`[LLM-PROC][PDF] Extracted ${extractedText.length} characters from PDF`);
  return extractedText;
}

// Call LLM to generate summary only from text; returns a plain string summary
async function llmGenerateSummaryFromText(text: string, apiKey: string, siteUrl: string): Promise<string> {
  const chatPayload = {
    model: OR_MODEL,
    messages: [
      { role: 'system', content: 'You are a strict JSON generator. Always respond with a single valid JSON object matching the requested schema. Do not include any prose, code fences, or explanations.' },
      {
        role: 'user',
        content: `Return STRICT JSON ONLY with this schema:
{
  "summary": "Clinical summary in 200-250 words focusing on key findings, health implications, and recommendations"
}
Do not include any other keys. Use double quotes and valid JSON. No trailing commas.
\n\nLab Report Text:\n${text}`
      }
    ],
    max_tokens: 1200,
    temperature: 0.1,
    response_format: { type: 'json_object' }
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
  try { console.log('[LLM-PROC][RAW][SUMMARY] Provider response JSON:', JSON.stringify(data)); } catch {}
  const content = extractOpenRouterContent(data);
  console.log('[LLM-PROC][RAW][SUMMARY] Extracted content:', content);

  const parsed = tryParseLooseJson(content);
  if (parsed && typeof parsed.summary === 'string') {
    return parsed.summary;
  }

  // Fallback: if content itself looks like a summary string
  if (typeof content === 'string' && content.length > 0) {
    return content.substring(0, 1200);
  }

  throw new Error('Failed to extract summary from LLM response');
}

// Call LLM to generate values (allValues and criticalValues) from text; returns arrays
async function llmGenerateValuesFromText(text: string, apiKey: string, siteUrl: string): Promise<{ allValues: any[]; criticalValues: any[]; }> {
  const chatPayload = {
    model: OR_MODEL,
    messages: [
      { role: 'system', content: 'You are a strict JSON generator. Always respond with a single valid JSON object matching the requested schema. Do not include any prose, code fences, or explanations.' },
      {
        role: 'user',
        content: `Return STRICT JSON ONLY with this schema:
{
  "allValues": [
    {"parameter": "", "value": "", "unit": "", "normalRange": "", "isAbnormal": false, "severity": "LOW|NORMAL|HIGH|CRITICAL", "category": "CBC|LFT|KFT|Lipid Profile|..."}
  ],
  "criticalValues": [
    {"parameter": "", "value": "", "unit": "", "normalRange": "", "isAbnormal": true, "severity": "LOW|NORMAL|HIGH|CRITICAL", "category": "CBC|LFT|KFT|Lipid Profile|..."}
  ]
}
Rules: use double quotes and valid JSON, no trailing commas, no additional keys. If a section has no data, return an empty array for it.
\n\nLab Report Text:\n${text}`
      }
    ],
    max_tokens: 2500,
    temperature: 0.1,
    response_format: { type: 'json_object' }
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
  try { console.log('[LLM-PROC][RAW][VALUES] Provider response JSON:', JSON.stringify(data)); } catch {}
  const content = extractOpenRouterContent(data);
  console.log('[LLM-PROC][RAW][VALUES] Extracted content:', content);

  const parsed = tryParseLooseJson(content) || {};
  const allValues = Array.isArray(parsed.allValues) ? parsed.allValues : [];
  const criticalValues = Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [];
  return { allValues, criticalValues };
}

// Orchestrate: extract text once, then call two LLMs; fallback to URL strategy if needed
async function processUsingTextThenLLMs(pdfUrl: string, apiKey: string, siteUrl: string): Promise<{ summary: string; allValues: any[]; criticalValues: any[]; }> {
  try {
    const text = await extractPdfText(pdfUrl);
    const [summary, values] = await Promise.all([
      llmGenerateSummaryFromText(text, apiKey, siteUrl),
      llmGenerateValuesFromText(text, apiKey, siteUrl)
    ]);

    // Normalize values
    let allValues = normalizeLabValues(values.allValues || []);
    let criticalValues = normalizeLabValues(values.criticalValues || []);
    if (criticalValues.length === 0) {
      // Derive criticals if missing
      const abnormal = (allValues || []).filter((v: any) => v && v.isAbnormal && v.severity && v.severity !== 'NORMAL');
      criticalValues = abnormal;
    }

    return { summary, allValues, criticalValues };
  } catch (err) {
    console.warn('[LLM-PROC] Text-first pipeline failed, falling back to URL strategy:', err);
    const content = await processWithDirectUrl(pdfUrl, apiKey, siteUrl);
    const parsed = tryParseLooseJson(content) || {};
    let allValues = normalizeLabValues(Array.isArray(parsed.allValues) ? parsed.allValues : []);
    let criticalValues = normalizeLabValues(Array.isArray(parsed.criticalValues) ? parsed.criticalValues : []);
    const summary = typeof parsed.summary === 'string' ? parsed.summary : (content.substring(0, 800));
    return { summary, allValues, criticalValues };
  }
}
