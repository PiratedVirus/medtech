import prisma from "@/lib/prisma";
import { generateSummary } from "@/lib/llm/unified-service";

// GROQ-only unified processing (no OpenRouter)
const OR_MODEL = 'groq+extractor';
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

// Process PDF with OpenRouter - Enhanced with multiple strategies
export async function processWithOpenRouter(analysisId: number, pdfUrl: string, patientId: number, labBookingId: number) {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    console.log(`[LLM-PROC][START] analysisId=${analysisId} unified GROQ pipeline`);

    // Unified pipeline: OCR -> GROQ summary -> internal extractor
    const ocrText = await extractOcrText(pdfUrl);
    const unifiedJson = await analyzeWithGroqAndExtractor(ocrText, siteUrl);
    const { summary, criticalValues, allValues, keyFindings, recommendations, urgency, trendAnalysis } = parseLLMResponse(unifiedJson);

    await prisma.labReportAnalysis.update({
      where: { id: analysisId },
      data: {
        llmSummary: ensureSummary(summary, criticalValues, allValues),
        criticalValues,
        allValues,
        keyFindings: keyFindings || [],
        recommendations: recommendations || [],
        urgency: urgency || 'ROUTINE',
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
async function processWithWorkingStrategy(pdfUrl: string, _apiKey: string, siteUrl: string): Promise<string> {
  console.log('[LLM-PROC][STRATEGY] Unified GROQ pipeline');
  const ocrText = await extractOcrText(pdfUrl);
  return await analyzeWithGroqAndExtractor(ocrText, siteUrl);
}

// Strategy 1: Extract text from PDF using OCR and send to LLM
async function extractAndProcessText(pdfUrl: string, _apiKey: string, siteUrl: string): Promise<string> {
  console.log('[LLM-PROC][PDF] Using OCR (Google Vision) for PDF text extraction');
  const extractedText = await extractOcrText(pdfUrl);

  if (!extractedText || extractedText.trim().length < 50) {
    throw new Error('OCR text extraction failed or insufficient content');
  }

  console.log('[LLM-PROC][PDF] Text extracted; analyzing with GROQ + extractor');
  return await analyzeWithGroqAndExtractor(extractedText, siteUrl);
}

// Strategy 2: Send PDF URL directly to LLM
// Deprecated: processWithDirectUrl no longer used (OpenRouter removed)

// Send extracted text to LLM for analysis
// Deprecated: sendTextToLLM no longer used (OpenRouter removed)

// Parse LLM response into structured data
function parseLLMResponse(responseText: string): { summary: string; criticalValues: any[]; allValues: any[]; keyFindings: any[]; recommendations: any[]; urgency: string; trendAnalysis: any } {
  try {
    const parsed = tryParseLooseJson(responseText);
    if (!parsed) {
      throw new Error('Failed to parse JSON response');
    }

    return {
      summary: parsed.summary || 'No summary provided',
      criticalValues: Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [],
      allValues: Array.isArray(parsed.allValues) ? parsed.allValues : [],
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      urgency: parsed.urgency || 'ROUTINE',
      trendAnalysis: parsed.trendAnalysis || {}
    };
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    return {
      summary: 'Error parsing response',
      criticalValues: [],
      allValues: [],
      keyFindings: [],
      recommendations: [],
      urgency: 'ROUTINE',
      trendAnalysis: {}
    };
  }
}

// Ensure summary is properly formatted
function ensureSummary(summary: string, criticalValues: any[], allValues: any[]): string {
  if (!summary || summary.trim() === '') {
    return `Lab report analysis completed. Found ${allValues.length} total values with ${criticalValues.length} critical values.`;
  }
  return summary;
}

// Save trend data for future analysis
async function saveTrendData(patientId: number, criticalValues: any[], labBookingId: number, analysisId: number) {
  try {
    for (const value of criticalValues) {
      if (value.parameter && value.value) {
        await prisma.reportTrendData.create({
          data: {
            patientId,
            parameter: String(value.parameter),
            value: String(value.value),
            unit: value.unit ? String(value.unit) : null,
            normalRange: value.normalRange ? String(value.normalRange) : null,
            isAbnormal: Boolean(value.isAbnormal),
            severity: value.severity && ['LOW','NORMAL','HIGH','CRITICAL'].includes(String(value.severity).toUpperCase())
              ? String(value.severity).toUpperCase() as any
              : null,
            reportDate: new Date(),
            labBookingId,
            sourceReportId: analysisId
          }
        });
      }
    }
  } catch (error) {
    console.error('Error saving trend data:', error);
  }
}

async function extractOcrText(pdfUrl: string): Promise<string> {
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
  return extractedText;
}

// Fallback analysis that mirrors the manual upload pipeline: GROQ summary + internal value extraction
async function analyzeWithGroqAndExtractor(text: string, siteUrl: string): Promise<string> {
  try {
    const groqKey = process.env.GROQ_API_KEY || '';
    let summary = 'Analysis completed.';
    let keyFindings: any[] = [];
    let recommendations: any[] = [];
    let urgency = 'ROUTINE';
    let allValues: any[] = [];
    let criticalValues: any[] = [];

    // Summary via GROQ if available
    if (groqKey) {
      try {
        const res = await generateSummary(text, groqKey);
        summary = res.summary || summary;
        keyFindings = res.keyFindings || [];
        recommendations = res.recommendations || [];
        urgency = res.urgency || 'ROUTINE';
      } catch (e) {
        console.warn('[LLM-PROC][FALLBACK] GROQ summary failed, continuing with defaults');
      }
    }

    // Extract values via internal API (same endpoint used by standalone flow)
    try {
      const extractUrl = `${siteUrl.replace(/\/$/, '')}/api/llm-process/extract-standalone-values`;
      const extractResponse = await fetch(extractUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, force: true })
      });
      if (extractResponse.ok) {
        const data = await extractResponse.json();
        if (data?.success) {
          allValues = data.data?.allValues || [];
          criticalValues = data.data?.criticalValues || [];
        }
      } else {
        const t = await extractResponse.text();
        console.warn('[LLM-PROC][FALLBACK] extractor response not OK:', t);
      }
    } catch (e) {
      console.warn('[LLM-PROC][FALLBACK] extractor call failed');
    }

    return JSON.stringify({ summary, keyFindings, recommendations, urgency, criticalValues, allValues });
  } catch (e) {
    console.error('[LLM-PROC][FALLBACK] unexpected failure', e);
    return `{"summary":"Fallback failed","keyFindings":[],"recommendations":[],"urgency":"ROUTINE","criticalValues":[],"allValues":[]}`;
  }
}
