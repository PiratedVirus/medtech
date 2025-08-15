import 'server-only';
import { groqLimiter } from './limiter';

// Simple token estimation function
function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  // Rough heuristic: 1 token ≈ 4 chars (varies by model). Clamp to non-negative.
  return Math.max(0, Math.ceil(text.length / 4));
}

const GROQ_SUMMARY_MODEL = process.env.GROQ_SUMMARY_MODEL || 'llama-3.3-70b-versatile';
const GROQ_VALUES_MODEL = process.env.GROQ_VALUES_MODEL || 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_PDF_MB = Number(process.env.OPENROUTER_MAX_PDF_MB ?? 10);
const MAX_TEXT_TOKENS = 8000;

function assertValidGroqKey(apiKey: string) {
  // OpenRouter keys commonly start with "sk-or-"; Groq keys start with "gsk_"
  const isOpenRouterKey = apiKey.startsWith('sk-or-') || apiKey.toLowerCase().includes('openrouter');
  if (isOpenRouterKey) {
    throw new Error('Configured API key looks like an OpenRouter key. Set GROQ_API_KEY to a valid Groq key (starts with "gsk_") for this endpoint.');
  }
}

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

export function extractChatContent(responseJson: any): string {
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

export function tryParseLooseJson(jsonLike: string): any | null {
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

function safeParseSummary(content: string): { summary: string; keyFindings: string[]; recommendations: string[]; urgency: 'ROUTINE'|'SOON'|'URGENT' } {
  const parsed = tryParseLooseJson(content);
  if (parsed) {
    const summary = typeof parsed.summary === 'string' ? parsed.summary : '';
    const keyFindings = Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [];
    const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
    const urgency = parsed.urgency === 'URGENT' || parsed.urgency === 'SOON' ? parsed.urgency : 'ROUTINE';
    if (summary) return { summary, keyFindings, recommendations, urgency };
  }
  const summaryMatch = content.match(/"summary"\s*:\s*"([\s\S]*?)"\s*(?:,|\})/i);
  const summary = summaryMatch ? summaryMatch[1] : content.substring(0, 900);
  const urgencyMatch = content.match(/"urgency"\s*:\s*"(ROUTINE|SOON|URGENT)"/i);
  const urgency = urgencyMatch ? (urgencyMatch[1].toUpperCase() as 'ROUTINE'|'SOON'|'URGENT') : 'ROUTINE';
  function tryExtractArray(name: string): string[] {
    const arrMatch = content.match(new RegExp(`"${name}"\\s*:\\s*\\[([\\s\\S]*?)\\]`, 'i'));
    if (!arrMatch) return [];
    const inner = `[${arrMatch[1]}]`;
    const wrap = `{ "arr": ${inner} }`;
    const p = tryParseLooseJson(wrap);
    if (p && Array.isArray(p.arr)) return p.arr.filter((x: any) => typeof x === 'string');
    return [];
  }
  const keyFindings = tryExtractArray('keyFindings');
  const recommendations = tryExtractArray('recommendations');
  return { summary, keyFindings, recommendations, urgency };
}

export async function llmGenerateSummaryFromText(text: string, apiKey: string, _siteUrl: string): Promise<{ summary: string; keyFindings: string[]; recommendations: string[]; urgency: 'ROUTINE'|'SOON'|'URGENT' }>{
  assertValidGroqKey(apiKey);
  
  // Preprocess text to reduce context length
  const processedText = preprocessText(text);
  console.log(`[LLM-PROC][SUMMARY] Original text: ${text.length} chars, processed: ${processedText.length} chars`);
  
  // If text is very long, truncate it to prevent context length issues
  const maxTextLength = 25000;
  const finalText = processedText.length > maxTextLength ? processedText.slice(0, maxTextLength) : processedText;
  
  if (processedText.length > maxTextLength) {
    console.warn(`[LLM-PROC][SUMMARY] Text truncated from ${processedText.length} to ${finalText.length} chars to prevent context length issues`);
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

  const payload = {
    model: GROQ_SUMMARY_MODEL,
    messages: [ { role: 'user', content: prompt } ],
    ...(process.env.GROQ_MAX_OUTPUT_TOKENS ? { max_tokens: Number(process.env.GROQ_MAX_OUTPUT_TOKENS) } : {})
  } as const;
  async function callOnce(modelOverride?: string) {
    const body = JSON.stringify({ ...payload, ...(modelOverride ? { model: modelOverride } : {}) });
    const inputTokens = estimateTokensFromText(prompt);
    const outputTokens = Number(process.env.GROQ_MAX_OUTPUT_TOKENS || 800);
    const tokensCost = inputTokens + outputTokens;
    const response = await groqLimiter.scheduleWithWeight(async () => {
      return fetch(GROQ_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body
      });
    }, tokensCost);
    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle context length exceeded specifically
      if (response.status === 400 && errorText.includes('context_length_exceeded')) {
        throw new Error('CONTEXT_LENGTH_EXCEEDED: Text too long for this model. Please use text chunking.');
      }
      
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }
    const data = await response.json();
    try { console.log('[LLM-PROC][RAW][SUMMARY] Provider response JSON:', JSON.stringify(data).slice(0, 2000)); } catch {}
    const content = extractChatContent(data);
    console.log('[LLM-PROC][RAW][SUMMARY] Extracted content (preview):', String(content).slice(0, 500));
    
    // Validate response quality - be more intelligent about what constitutes poor quality
    if (content.length < 50) {
      console.warn(`[LLM-PROC][SUMMARY] Response too short: ${content.length} chars`);
      throw new Error('POOR_QUALITY_RESPONSE: LLM returned response that is too short');
    }
    
    // Check if it's valid JSON structure
    if (!content.trim().startsWith('{') || !content.trim().endsWith('}')) {
      console.warn(`[LLM-PROC][SUMMARY] Response is not valid JSON structure: ${content.slice(0, 200)}`);
      throw new Error('POOR_QUALITY_RESPONSE: LLM response is not valid JSON structure');
    }
    
    return safeParseSummary(content);
  }

  try {
    // Use only the primary model - no fallbacks
    console.log(`[LLM-PROC][SUMMARY] Using primary model: ${GROQ_SUMMARY_MODEL}`);
    
    // Single attempt with primary model
    return await callOnce();
  } catch (error) {
    console.error('[LLM-PROC][SUMMARY] Error with primary model:', error);
    throw error;
  }
}

// Helper function to preprocess text to reduce context length
function preprocessText(text: string): string {
  // Remove excessive whitespace and normalize line breaks
  let processed = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  
  // Remove common redundant patterns in lab reports
  processed = processed
    .replace(/Page \d+ of \d+/gi, '')
    .replace(/Report Date:.*?\n/gi, '')
    .replace(/Generated on:.*?\n/gi, '')
    .replace(/Lab ID:.*?\n/gi, '')
    .replace(/Patient ID:.*?\n/gi, '')
    .replace(/Reference Range:/gi, 'Ref:')
    .replace(/Normal Range:/gi, 'Ref:');
  
  return processed;
}

// Helper function to chunk long text into manageable pieces
function chunkText(text: string, maxChunkSize: number = 25000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }
  
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Try to find a good break point (newline, period, or space)
    if (end < text.length) {
      const lastNewline = text.lastIndexOf('\n', end);
      const lastPeriod = text.lastIndexOf('.', end);
      const lastSpace = text.lastIndexOf(' ', end);
      
      // Prefer newlines, then periods, then spaces
      if (lastNewline > start + maxChunkSize * 0.8) {
        end = lastNewline + 1;
      } else if (lastPeriod > start + maxChunkSize * 0.8) {
        end = lastPeriod + 1;
      } else if (lastSpace > start + maxChunkSize * 0.8) {
        end = lastSpace + 1;
      }
    }
    
    chunks.push(text.slice(start, end));
    start = end;
  }
  
  return chunks;
}

export async function llmGenerateValuesFromText(text: string, apiKey: string, _siteUrl: string): Promise<{ allValues: any[]; criticalValues: any[]; }>{
  assertValidGroqKey(apiKey);
  
  // Preprocess text to reduce context length
  const processedText = preprocessText(text);
  console.log(`[LLM-PROC][VALUES] Original text: ${text.length} chars, processed: ${processedText.length} chars`);
  
  // If text is very long, process it in chunks and merge results
  if (processedText.length > 30000) {
    console.log(`[LLM-PROC][VALUES] Text too long (${processedText.length} chars), processing in chunks`);
    const chunks = chunkText(processedText, 25000);
    const allResults: any[] = [];
    const allCriticalResults: any[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      console.log(`[LLM-PROC][VALUES] Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
      try {
        const chunkResult = await llmGenerateValuesFromText(chunks[i], apiKey, _siteUrl);
        allResults.push(...chunkResult.allValues);
        allCriticalResults.push(...chunkResult.criticalValues);
      } catch (error) {
        console.warn(`[LLM-PROC][VALUES] Error processing chunk ${i + 1}:`, error);
        // Continue with other chunks
      }
    }
    
    // Remove duplicates based on parameter name
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.parameter === item.parameter)
    );
    const uniqueCriticalResults = allCriticalResults.filter((item, index, self) => 
      index === self.findIndex(t => t.parameter === item.parameter)
    );
    
    return {
      allValues: uniqueResults,
      criticalValues: uniqueCriticalResults
    };
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
${processedText}`;

  async function callModel(model: string) {
    const payload = {
      model,
      messages: [ { role: 'user', content: prompt } ],
      ...(process.env.GROQ_MAX_OUTPUT_TOKENS ? { max_tokens: Number(process.env.GROQ_MAX_OUTPUT_TOKENS) } : {})
    } as const;

    const inputTokens = estimateTokensFromText(prompt);
    const outputTokens = Number(process.env.GROQ_MAX_OUTPUT_TOKENS || 1200);
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
      
      // Handle context length exceeded specifically
      if (response.status === 400 && errorText.includes('context_length_exceeded')) {
        throw new Error('CONTEXT_LENGTH_EXCEEDED: Text too long for this model. Please use text chunking.');
      }
      
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    try { console.log('[LLM-PROC][RAW][VALUES] Provider response JSON:', JSON.stringify(data).slice(0, 2000)); } catch {}
    const content = extractChatContent(data);
    console.log('[LLM-PROC][RAW][VALUES] Extracted content (preview):', String(content).slice(0, 500));
    
    // Validate response quality - be more intelligent about what constitutes poor quality
    if (content.length < 50) {
      console.warn(`[LLM-PROC][VALUES] Response too short: ${content.length} chars`);
      throw new Error('POOR_QUALITY_RESPONSE: LLM returned response that is too short');
    }
    
    // Check for actual error patterns, not legitimate medical terms
    if (content.includes('Error:') || 
        content.includes('BC Medic') ||  // Only flag the specific error pattern
        content.includes('Error BC') ||   // Only flag the specific error pattern
        content.includes('Medic Error')) { // Only flag the specific error pattern
      console.warn(`[LLM-PROC][VALUES] Error pattern detected in response: ${content.slice(0, 200)}`);
      throw new Error('POOR_QUALITY_RESPONSE: LLM returned error pattern in response');
    }
    
    // Check if it's valid JSON structure
    if (!content.trim().startsWith('{') || !content.trim().endsWith('}')) {
      console.warn(`[LLM-PROC][VALUES] Response is not valid JSON structure: ${content.slice(0, 200)}`);
      throw new Error('POOR_QUALITY_RESPONSE: LLM response is not valid JSON structure');
    }
    
    return content;
  }

  try {
    // Use only the primary model - no fallbacks
    console.log(`[LLM-PROC][VALUES] Using primary model: ${GROQ_VALUES_MODEL}`);
    
    // Single attempt with primary model
    const content = await callModel(GROQ_VALUES_MODEL);
    const parsed = tryParseLooseJson(content) || {};
    const allValues = Array.isArray(parsed.allValues) ? parsed.allValues : [];
    const criticalValues = Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [];
    return { allValues, criticalValues };
  } catch (error) {
    console.error('[LLM-PROC][VALUES] Error with primary model:', error);
    throw error;
  }
}
