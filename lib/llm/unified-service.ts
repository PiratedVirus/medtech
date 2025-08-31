import 'server-only';
import { groqLimiter } from './limiter';

// Configuration
const GROQ_SUMMARY_MODEL = process.env.GROQ_SUMMARY_MODEL || 'llama-3.3-70b-versatile';
const GROQ_VALUES_MODEL = process.env.GROQ_VALUES_MODEL || 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_PDF_MB = Number(process.env.OPENROUTER_MAX_PDF_MB ?? 10);
const MAX_TEXT_TOKENS = 8000;

// Types
export interface LLMResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  cached?: boolean;
}

export interface SummaryResult {
  summary: string;
  keyFindings: string[];
  recommendations: string[];
  urgency: 'ROUTINE' | 'SOON' | 'URGENT';
}

export interface ValuesResult {
  allValues: any[];
  criticalValues: any[];
}

export interface UnifiedAnalysisResult {
  summary: SummaryResult;
  values: ValuesResult;
}

// Utility functions
function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  return Math.max(0, Math.ceil(text.length / 4));
}

function assertValidGroqKey(apiKey: string) {
  const isOpenRouterKey = apiKey.startsWith('sk-or-') || apiKey.toLowerCase().includes('openrouter');
  if (isOpenRouterKey) {
    throw new Error('Configured API key looks like an OpenRouter key. Set GROQ_API_KEY to a valid Groq key (starts with "gsk_") for this endpoint.');
  }
}

function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
}

function extractChatContent(responseJson: any): string {
  if (!responseJson) throw new Error('Empty LLM response');
  if (responseJson.error) {
    const err = typeof responseJson.error === 'string' ? responseJson.error : (responseJson.error.message || JSON.stringify(responseJson.error));
    throw new Error(`LLM API error: ${err}`);
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
  if (typeof content === 'string' && content.trim()) return content;
  const deltaContent = choice?.delta?.content;
  if (typeof deltaContent === 'string' && deltaContent.trim()) return deltaContent;
  throw new Error('No content received from LLM');
}

function tryParseLooseJson(jsonLike: string): any | null {
  try {
    let s = jsonLike.trim();
    s = s.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
    const start = s.indexOf('{');
    const end = s.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) s = s.slice(start, end + 1);
    s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
    s = s.replace(/,\s*([}\]])/g, '$1');
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// PDF Text Extraction
export async function extractPdfText(pdfUrl: string): Promise<string> {
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

// Unified LLM API Call
async function callGroqAPI(
  prompt: string, 
  apiKey: string, 
  model: string, 
  maxTokens: number = 1000,
  temperature: number = 0.1
): Promise<string> {
  assertValidGroqKey(apiKey);
  
  const payload = {
    model,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature,
    response_format: { type: 'json_object' }
  };

  const inputTokens = estimateTokensFromText(prompt);
  const outputTokens = maxTokens;
  const tokensCost = inputTokens + outputTokens;
  
  const response = await groqLimiter.scheduleWithWeight(async () => {
    return fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  }, tokensCost);

  if (!response.ok) {
    const errorText = await response.text();
    
    if (response.status === 400 && errorText.includes('context_length_exceeded')) {
      throw new Error('CONTEXT_LENGTH_EXCEEDED: Text too long for this model. Please use text chunking.');
    }
    
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = extractChatContent(data);
  
  if (content.length < 50) {
    throw new Error('POOR_QUALITY_RESPONSE: LLM returned response that is too short');
  }
  
  return content;
}

// Summary Generation
export async function generateSummary(
  text: string, 
  apiKey: string, 
  model: string = GROQ_SUMMARY_MODEL
): Promise<SummaryResult> {
  const processedText = preprocessText(text);
  const maxTextLength = 25000;
  const finalText = processedText.length > maxTextLength ? processedText.slice(0, maxTextLength) : processedText;
  
  if (processedText.length > maxTextLength) {
    console.warn(`[LLM-PROC][SUMMARY] Text truncated from ${processedText.length} to ${finalText.length} chars`);
  }

  const prompt = `You are a medical lab report analyzer. Create a clinical summary of the lab report.

IMPORTANT: Return ONLY valid JSON in this exact format (no extra text, no markdown):
{
  "summary": "200-250 word clinical summary emphasizing significant abnormalities and their implications",
  "keyFindings": ["short bullet of critical and notable findings (max 8)"],
  "recommendations": ["short actionable next-step suggestions (max 8)"],
  "urgency": "ROUTINE|SOON|URGENT"
}

Rules:
1. Use precise medical language
2. Avoid hallucinations - only use information from the report
3. Focus on clinically significant findings
4. NO extra text, comments, or markdown formatting
5. Use double quotes for all strings
6. NO trailing commas
7. Return empty arrays if no data found

Lab Report Text:
${finalText}`;

  try {
    const content = await callGroqAPI(prompt, apiKey, model, 1200);
    const parsed = tryParseLooseJson(content);
    
    if (parsed && typeof parsed.summary === 'string') {
      return {
        summary: parsed.summary,
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        urgency: parsed.urgency === 'URGENT' || parsed.urgency === 'SOON' ? parsed.urgency : 'ROUTINE'
      };
    }
    
    // Fallback parsing
    const summaryMatch = content.match(/"summary"\s*:\s*"([\s\S]*?)"\s*(?:,|\})/i);
    const summary = summaryMatch ? summaryMatch[1] : content.substring(0, 900);
    const urgencyMatch = content.match(/"urgency"\s*:\s*"(ROUTINE|SOON|URGENT)"/i);
    const urgency = urgencyMatch ? (urgencyMatch[1].toUpperCase() as 'ROUTINE'|'SOON'|'URGENT') : 'ROUTINE';
    
    function tryExtractArray(name: string): string[] {
      const arrMatch = content.match(new RegExp(`"${name}"\\s*:\\s*\\[([\\s\S]*?)\\]`, 'i'));
      if (!arrMatch) return [];
      const inner = `[${arrMatch[1]}]`;
      const wrap = `{ "arr": ${inner} }`;
      const p = tryParseLooseJson(wrap);
      if (p && Array.isArray(p.arr)) return p.arr.filter((x: any) => typeof x === 'string');
      return [];
    }
    
    return {
      summary,
      keyFindings: tryExtractArray('keyFindings'),
      recommendations: tryExtractArray('recommendations'),
      urgency
    };
    
  } catch (error) {
    console.error('[LLM-PROC][SUMMARY] Error:', error);
    throw error;
  }
}

// Values Extraction
export async function extractValues(
  text: string, 
  apiKey: string, 
  model: string = GROQ_VALUES_MODEL
): Promise<ValuesResult> {
  const processedText = preprocessText(text);
  const maxTextLength = 32000;
  const finalText = processedText.length > maxTextLength ? processedText.slice(0, maxTextLength) : processedText;
  
  if (processedText.length > maxTextLength) {
    console.warn(`[LLM-PROC][VALUES] Text truncated from ${processedText.length} to ${finalText.length} chars`);
  }

  const prompt = `You are a medical lab report analyzer. Extract all test parameters and their values from the lab report text.

IMPORTANT: Return ONLY valid JSON in this exact format (no extra text, no markdown):
{
  "allValues": [
    {
      "parameter": "Test Name",
      "value": "Test Result", 
      "unit": "Unit of Measurement",
      "normalRange": "Normal Range",
      "isAbnormal": true/false,
      "severity": "LOW|NORMAL|HIGH|CRITICAL",
      "category": "CBC|LFT|KFT|Lipid Profile|Glucose|Thyroid|Kidney|Liver|Electrolytes|Other"
    }
  ],
  "criticalValues": [
    {
      "parameter": "Test Name",
      "value": "Test Result",
      "unit": "Unit of Measurement", 
      "normalRange": "Normal Range",
      "isAbnormal": true,
      "severity": "LOW|NORMAL|HIGH|CRITICAL",
      "category": "CBC|LFT|KFT|Lipid Profile|Glucose|Thyroid|Kidney|Liver|Electrolytes|Other"
    }
  ]
}

Rules:
1. Extract EVERY test parameter you can find
2. Put abnormal values in criticalValues array
3. Use exact values from the report
4. Return empty arrays if no data found
5. NO extra text, comments, or markdown formatting
6. Use double quotes for all strings
7. NO trailing commas

Lab Report Text:
${finalText}`;

  try {
    const content = await callGroqAPI(prompt, apiKey, model, 2500);
    const parsed = tryParseLooseJson(content);
    
    if (parsed && (Array.isArray(parsed.allValues) || Array.isArray(parsed.criticalValues))) {
      return {
        allValues: Array.isArray(parsed.allValues) ? parsed.allValues : [],
        criticalValues: Array.isArray(parsed.criticalValues) ? parsed.criticalValues : []
      };
    }
    
    throw new Error('Failed to parse values from LLM response');
    
  } catch (error) {
    console.error('[LLM-PROC][VALUES] Error:', error);
    throw error;
  }
}

// Unified Analysis (Summary + Values)
export async function generateUnifiedAnalysis(
  text: string, 
  apiKey: string
): Promise<UnifiedAnalysisResult> {
  try {
    const [summaryResult, valuesResult] = await Promise.all([
      generateSummary(text, apiKey),
      extractValues(text, apiKey)
    ]);
    
    return {
      summary: summaryResult,
      values: valuesResult
    };
  } catch (error) {
    console.error('[LLM-PROC][UNIFIED] Error:', error);
    throw error;
  }
}

// Prescription Summary Generation
export async function generatePrescriptionSummary(
  texts: string[], 
  apiKey: string
): Promise<SummaryResult> {
  const combinedText = texts.join('\n\n---\n\n');
  const processedText = preprocessText(combinedText);
  const maxTextLength = 25000;
  const finalText = processedText.length > maxTextLength ? processedText.slice(0, maxTextLength) : processedText;

  const prompt = `You are a medical prescription analyzer. Analyze the provided prescription texts and create a comprehensive patient summary.

IMPORTANT: Return ONLY valid JSON in this exact format (no extra text, no markdown):
{
  "summary": "300-400 word comprehensive summary of all prescriptions, highlighting patterns, interactions, and clinical implications",
  "keyFindings": ["key observations about medication patterns, dosages, interactions, or concerns (max 10)"],
  "recommendations": ["actionable recommendations for healthcare providers (max 8)"],
  "urgency": "ROUTINE|SOON|URGENT"
}

Rules:
1. Analyze ALL prescription texts provided
2. Identify medication patterns, interactions, and clinical implications
3. Focus on patient safety and optimal care
4. NO extra text, comments, or markdown formatting
5. Use double quotes for all strings
6. NO trailing commas

Prescription Texts:
${finalText}`;

  try {
    const content = await callGroqAPI(prompt, apiKey, GROQ_SUMMARY_MODEL, 1500);
    const parsed = tryParseLooseJson(content);
    
    if (parsed && typeof parsed.summary === 'string') {
      return {
        summary: parsed.summary,
        keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        urgency: parsed.urgency === 'URGENT' || parsed.urgency === 'SOON' ? parsed.urgency : 'ROUTINE'
      };
    }
    
    throw new Error('Failed to parse prescription summary from LLM response');
    
  } catch (error) {
    console.error('[LLM-PROC][PRESCRIPTION] Error:', error);
    throw error;
  }
}
