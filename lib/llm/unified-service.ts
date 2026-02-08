import 'server-only';
import { groqLimiter } from './limiter';
import { getActiveProductionProfile } from './profile-service';

// Configuration
const GROQ_SUMMARY_MODEL = process.env.GROQ_SUMMARY_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
const GROQ_VALUES_MODEL = process.env.GROQ_VALUES_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';
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
  reportDate?: string; // Date extracted from the report text (ISO string or natural date)
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

// Unified LLM API Call
async function callGroqAPI(
  prompt: string, 
  apiKey: string, 
  model: string, 
  maxTokens: number = 1000,
  temperature: number = 0.1
): Promise<string> {
  return callGroqAPIWithProfile(prompt, apiKey, model, maxTokens, temperature);
}

// Enhanced LLM API Call with system prompt support
async function callGroqAPIWithProfile(
  userPrompt: string, 
  apiKey: string, 
  model: string, 
  maxTokens: number = 1000,
  temperature: number = 0.1,
  systemPrompt?: string
): Promise<string> {
  assertValidGroqKey(apiKey);
  
  const messages: Array<{ role: string; content: string }> = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: userPrompt });
  
  const payload = {
    model,
    messages,
    max_tokens: maxTokens,
    temperature,
    response_format: { type: 'json_object' }
  };

  const inputTokens = estimateTokensFromText(systemPrompt ? `${systemPrompt}\n${userPrompt}` : userPrompt);
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
  console.log('[LLM-PROC][VALUES] Raw Groq response:', JSON.stringify(data, null, 2));
  
  const content = extractChatContent(data);
  console.log('[LLM-PROC][VALUES] Extracted content length:', content.length);
  console.log('[LLM-PROC][VALUES] Extracted content:', content);
  
  if (content.length < 50) {
    console.error('[LLM-PROC][VALUES] LLM response too short:', {
      contentLength: content.length,
      content: content,
      rawResponse: data
    });
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

  // Try to get production profile
  let productionProfile = null;
  try {
    productionProfile = await getActiveProductionProfile();
  } catch (error) {
    console.warn('[LLM-PROC][SUMMARY] Failed to get production profile, using defaults:', error);
  }

  // Use production profile prompts if available, otherwise use defaults
  const systemPrompt = productionProfile?.systemPrompt || `You are a medical lab report analyzer. Create a clinical summary of the lab report.

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
7. Return empty arrays if no data found`;

  let userPrompt;
  if (productionProfile?.summaryPrompt) {
    // Replace template variables in production profile prompt
    userPrompt = productionProfile.summaryPrompt
      .replace(/\{\{TEXT\}\}/g, finalText)
      .replace(/\{\{PDF_URL\}\}/g, '')
      .replace(/\{\{ADDITIONAL_CONTEXT\}\}/g, '');
  } else {
    userPrompt = `Lab Report Text:
${finalText}`;
  }

  const finalModel = productionProfile?.model || model;
  const temperature = productionProfile?.temperature || 0.1;
  const maxTokens = productionProfile?.maxTokens || 1200;

  console.log(`[LLM-PROC][SUMMARY] Using ${productionProfile ? 'production profile' : 'default settings'}: ${finalModel}`);

  try {
    const content = await callGroqAPIWithProfile(userPrompt, apiKey, finalModel, maxTokens, temperature, systemPrompt);
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

  // Try to get production profile
  let productionProfile = null;
  try {
    productionProfile = await getActiveProductionProfile();
    if (productionProfile) {
      console.log('[LLM-PROC][VALUES] Production profile found:', {
        id: productionProfile.id,
        name: productionProfile.name,
        model: productionProfile.model,
        valuesPromptLength: productionProfile.valuesPrompt?.length || 0,
        systemPromptLength: productionProfile.systemPrompt?.length || 0
      });
    }
  } catch (error) {
    console.warn('[LLM-PROC][VALUES] Failed to get production profile, using defaults:', error);
  }

  // Use production profile prompts if available, otherwise use defaults
  const systemPrompt = productionProfile?.systemPrompt || `You are a medical lab report analyzer. Extract ONLY the test parameters and values that are explicitly mentioned in the provided lab report text.

CRITICAL RULES:
- Extract ONLY values that are explicitly present in the report text
- DO NOT generate, invent, or hallucinate any values not present in the text
- DO NOT add common lab tests that might be expected but are not in the report
- If a test is not mentioned in the report, DO NOT include it in the results

REPORT DATE (REQUIRED):
- You MUST extract the date of the report from the document text. Look for: "Sample Collection Date", "Collection Date", "Report Date", "Date of Sample", "Test Date", "Sample Date", "Collected on", "Drawn on", or any date printed on the report header/footer.
- Output it as "reportDate" in strict format YYYY-MM-DD (e.g. 2024-03-15). If the document shows DD/MM/YYYY or DD-MM-YYYY, convert to YYYY-MM-DD.
- If you truly find no date anywhere in the text, use null for reportDate. Do NOT use today's date.

Return ONLY valid JSON in this exact format (no extra text, no markdown):
{
  "reportDate": "YYYY-MM-DD",
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
1. Extract ONLY test parameters explicitly mentioned in the report
2. Put abnormal values in criticalValues array
3. Use exact values from the report
4. Return empty arrays if no data found
5. NO extra text, comments, or markdown formatting
6. Use double quotes for all strings
7. NO trailing commas
8. DO NOT add any tests not present in the original report
9. reportDate is REQUIRED: scan the entire document for any date (collection date, report date, sample date). Output as YYYY-MM-DD. Prefer "sample collection" or "collection" date over "report printed" date. If no date found in document, use null.`;

  // Use production profile valuesPrompt only if it's substantial, otherwise use default
  const defaultValuesPrompt = `Please extract all lab test parameters and values from the following lab report text. Return ONLY valid JSON in the exact format specified in the system prompt.

IMPORTANT - Report date: Before extracting parameters, look through the document for the date of the report. Common labels: "Sample Collection Date", "Collection Date", "Report Date", "Date of Sample", "Collected on", "Drawn on". Extract that date and set "reportDate" to YYYY-MM-DD. If no date appears in the document, set "reportDate" to null.

Lab Report Text:
${finalText}`;
  
  let userPrompt;
  if (productionProfile?.valuesPrompt && productionProfile.valuesPrompt.length > 100) {
    // Replace template variables in production profile prompt
    userPrompt = productionProfile.valuesPrompt
      .replace(/\{\{TEXT\}\}/g, finalText)
      .replace(/\{\{PDF_URL\}\}/g, '')
      .replace(/\{\{ADDITIONAL_CONTEXT\}\}/g, '');
  } else {
    userPrompt = defaultValuesPrompt;
  }

  const finalModel = productionProfile?.model || model;
  const temperature = productionProfile?.temperature || 0.1;
  const maxTokens = productionProfile?.maxTokens || 2500;

  console.log(`[LLM-PROC][VALUES] Using ${productionProfile ? 'production profile' : 'default settings'}: ${finalModel}`);
  console.log(`[LLM-PROC][VALUES] User prompt length: ${userPrompt.length}`);
  console.log(`[LLM-PROC][VALUES] System prompt length: ${systemPrompt.length}`);

  try {
    const content = await callGroqAPIWithProfile(userPrompt, apiKey, finalModel, maxTokens, temperature, systemPrompt);
    const parsed = tryParseLooseJson(content);

    // DEBUG: Log what the LLM returned for report date and top-level keys
    const debugKeys = parsed && typeof parsed === 'object' ? Object.keys(parsed) : [];
    console.log('[LLM-PROC][VALUES][DEBUG] LLM response top-level keys:', debugKeys.join(', '));
    console.log('[LLM-PROC][VALUES][DEBUG] parsed.reportDate (raw):', parsed?.reportDate, '(type:', typeof parsed?.reportDate, ')');
    if (parsed && !parsed.reportDate && debugKeys.length) {
      console.warn('[LLM-PROC][VALUES][DEBUG] No reportDate in LLM response. Text excerpt (first 400 chars):', typeof finalText === 'string' ? finalText.slice(0, 400).replace(/\n/g, ' ') : 'N/A');
    }
    
    if (parsed && (Array.isArray(parsed.allValues) || Array.isArray(parsed.criticalValues))) {
      let allValues = Array.isArray(parsed.allValues) ? parsed.allValues : [];
      let criticalValues = Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [];
      
      // Fallback: If criticalValues is empty but allValues has abnormal values, populate criticalValues
      if (criticalValues.length === 0 && allValues.length > 0) {
        const abnormal = allValues.filter((v: any) => 
          v && 
          (v.isAbnormal === true || 
           (v.severity && v.severity !== 'NORMAL' && v.severity !== 'normal'))
        );
        if (abnormal.length > 0) {
          criticalValues = abnormal;
          console.log(`[LLM-PROC][VALUES] Fallback: Populated ${criticalValues.length} critical values from allValues (AI did not populate criticalValues)`);
        }
      }
      
      // Log warning if too many values are extracted (potential hallucination)
      const totalValues = allValues.length + criticalValues.length;
      if (totalValues > 20) {
        console.warn(`[LLM-PROC][VALUES] Warning: Extracted ${totalValues} values, which seems high. Please verify against original report.`);
      }
      
      // Extract reportDate if present
      let reportDate: string | undefined;
      if (parsed.reportDate != null && parsed.reportDate !== '' && String(parsed.reportDate).toLowerCase() !== 'null') {
        const rawReportDate = String(parsed.reportDate).trim();
        const parsedDate = new Date(rawReportDate);
        if (!isNaN(parsedDate.getTime())) {
          reportDate = parsedDate.toISOString();
          console.log(`[LLM-PROC][VALUES] Extracted report date: ${reportDate} (from LLM raw: "${rawReportDate}")`);
        } else {
          console.warn(`[LLM-PROC][VALUES] Could not parse report date (invalid): "${rawReportDate}"`);
        }
      } else {
        console.warn('[LLM-PROC][VALUES][DEBUG] reportDate missing or null from LLM – UI will show upload date as fallback.');
      }

      console.log(`[LLM-PROC][VALUES] Extracted ${allValues.length} all values and ${criticalValues.length} critical values`);
      
      return {
        allValues,
        criticalValues,
        reportDate
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
