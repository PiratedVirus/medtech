import 'server-only';

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
  const prompt = `Return STRICT JSON ONLY with this schema (no extra keys):\n{\n  \"summary\": \"200-250 word clinical summary emphasizing significant abnormalities and their implications\",\n  \"keyFindings\": [\"short bullet of critical and notable findings (max 8)\"],\n  \"recommendations\": [\"short actionable next-step suggestions (max 8)\"],\n  \"urgency\": \"ROUTINE|SOON|URGENT\"\n}\nRules: Use precise medical language, avoid hallucinations, do not include code fences, comments, or trailing commas. Double quotes everywhere.\n\nLab Report Text:\n${text}`;

  const payload = {
    model: GROQ_SUMMARY_MODEL,
    messages: [ { role: 'user', content: prompt } ]
  } as const;

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText}`);
  }
  const data = await response.json();
  try { console.log('[LLM-PROC][RAW][SUMMARY] Provider response JSON:', JSON.stringify(data)); } catch {}
  const content = extractChatContent(data);
  console.log('[LLM-PROC][RAW][SUMMARY] Extracted content:', content);
  return safeParseSummary(content);
}

export async function llmGenerateValuesFromText(text: string, apiKey: string, _siteUrl: string): Promise<{ allValues: any[]; criticalValues: any[]; }>{
  assertValidGroqKey(apiKey);
  const prompt = `Return STRICT JSON ONLY with this schema (no extra keys):\n{\n  \"allValues\": [\n    {\"parameter\": \"\", \"value\": \"\", \"unit\": \"\", \"normalRange\": \"\", \"isAbnormal\": false, \"severity\": \"LOW|NORMAL|HIGH|CRITICAL\", \"category\": \"CBC|LFT|KFT|Lipid Profile|Glucose|Thyroid|Kidney|Liver|Electrolytes|Other\"}\n  ],\n  \"criticalValues\": [\n    {\"parameter\": \"\", \"value\": \"\", \"unit\": \"\", \"normalRange\": \"\", \"isAbnormal\": true, \"severity\": \"LOW|NORMAL|HIGH|CRITICAL\", \"category\": \"CBC|LFT|KFT|Lipid Profile|Glucose|Thyroid|Kidney|Liver|Electrolytes|Other\"}\n  ]\n}\nRules: Include every discernible parameter in allValues. criticalValues must be the subset with abnormal/clinically concerning values. Use double quotes only, no trailing commas, no code fences. If a section has no data, return an empty array.\n\nLab Report Text:\n${text}`;

  async function callModel(model: string) {
    const payload = {
      model,
      messages: [ { role: 'user', content: prompt } ]
    } as const;

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    try { console.log('[LLM-PROC][RAW][VALUES] Provider response JSON:', JSON.stringify(data)); } catch {}
    const content = extractChatContent(data);
    console.log('[LLM-PROC][RAW][VALUES] Extracted content:', content);
    return content;
  }

  try {
    const content = await callModel(GROQ_VALUES_MODEL);
    const parsed = tryParseLooseJson(content) || {};
    const allValues = Array.isArray(parsed.allValues) ? parsed.allValues : [];
    const criticalValues = Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [];
    return { allValues, criticalValues };
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes(' 503 ') || msg.toLowerCase().includes('temporarily unavailable') || msg.includes('429')) {
      console.warn('[LLM-PROC][VALUES] Provider error, retrying with summary model');
      await new Promise(r => setTimeout(r, 1200));
      const content = await callModel(GROQ_SUMMARY_MODEL);
      const parsed = tryParseLooseJson(content) || {};
      const allValues = Array.isArray(parsed.allValues) ? parsed.allValues : [];
      const criticalValues = Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [];
      return { allValues, criticalValues };
    }
    throw e;
  }
}
