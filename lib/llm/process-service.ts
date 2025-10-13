import prisma from "@/lib/prisma";

// Optimized model choices for medical text analysis
const OR_MODEL = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.2-3b-instruct:free';
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

// Strategy 1: Extract text from PDF using OCR and send to LLM
async function extractAndProcessText(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
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
  return await sendTextToLLM(extractedText, apiKey, siteUrl);
}

// Strategy 2: Send PDF URL directly to LLM
async function processWithDirectUrl(pdfUrl: string, apiKey: string, siteUrl: string): Promise<string> {
  console.log('[LLM-PROC][PDF] Using direct URL strategy');
  
  const systemPrompt = `You are a medical lab report analyzer. Extract and summarize lab values from the provided PDF URL. Return a JSON object with the following structure:
{
  "summary": "Brief summary of the lab report",
  "criticalValues": [
    {
      "parameter": "Parameter name",
      "value": "Value",
      "unit": "Unit",
      "normalRange": "Normal range",
      "isAbnormal": true/false,
      "severity": "CRITICAL/HIGH/MODERATE/NORMAL"
    }
  ],
  "allValues": [
    {
      "parameter": "Parameter name", 
      "value": "Value",
      "unit": "Unit", 
      "normalRange": "Normal range",
      "isAbnormal": true/false,
      "severity": "CRITICAL/HIGH/MODERATE/NORMAL"
    }
  ]
}`;

  const userPrompt = `Please analyze this lab report PDF: ${pdfUrl}

Extract all lab values and provide a comprehensive summary. Focus on identifying any abnormal or critical values that require immediate attention.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': 'CareDB Lab Analysis'
    },
    body: JSON.stringify({
      model: OR_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return extractOpenRouterContent(data);
}

// Send extracted text to LLM for analysis
async function sendTextToLLM(text: string, apiKey: string, siteUrl: string): Promise<string> {
  const systemPrompt = `You are a medical lab report analyzer. Extract and summarize lab values from the provided text. Return a JSON object with the following structure:
{
  "summary": "Brief summary of the lab report",
  "criticalValues": [
    {
      "parameter": "Parameter name",
      "value": "Value", 
      "unit": "Unit",
      "normalRange": "Normal range",
      "isAbnormal": true/false,
      "severity": "CRITICAL/HIGH/MODERATE/NORMAL"
    }
  ],
  "allValues": [
    {
      "parameter": "Parameter name",
      "value": "Value",
      "unit": "Unit", 
      "normalRange": "Normal range",
      "isAbnormal": true/false,
      "severity": "CRITICAL/HIGH/MODERATE/NORMAL"
    }
  ]
}`;

  const userPrompt = `Please analyze this lab report text:

${text}

Extract all lab values and provide a comprehensive summary. Focus on identifying any abnormal or critical values that require immediate attention.`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': 'CareDB Lab Analysis'
    },
    body: JSON.stringify({
      model: OR_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return extractOpenRouterContent(data);
}

// Parse LLM response into structured data
function parseLLMResponse(responseText: string): { summary: string; criticalValues: any[]; allValues: any[]; trendAnalysis: any } {
  try {
    const parsed = tryParseLooseJson(responseText);
    if (!parsed) {
      throw new Error('Failed to parse JSON response');
    }

    return {
      summary: parsed.summary || 'No summary provided',
      criticalValues: Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [],
      allValues: Array.isArray(parsed.allValues) ? parsed.allValues : [],
      trendAnalysis: parsed.trendAnalysis || {}
    };
  } catch (error) {
    console.error('Error parsing LLM response:', error);
    return {
      summary: 'Error parsing response',
      criticalValues: [],
      allValues: [],
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
