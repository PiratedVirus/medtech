import 'server-only';
import { appendStageLog, completeRun, getProfileById } from './profile-service';
import { extractPdfText } from './unified-service';
import { ocrExtractPdfTextFromUrl } from '../ocr/google-vision';

// Use Groq model configuration for uniformity
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const FALLBACK_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant'
];

// Groq API functions for uniformity
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

// Call LLM to generate summary only from text; returns a plain string summary
async function llmGenerateSummaryFromText(text: string, apiKey: string, model: string = GROQ_MODEL): Promise<string> {
  const chatPayload = {
    model,
    messages: [
      { role: 'system', content: 'You are a strict JSON generator. Always respond with a single valid JSON object matching the requested schema. Do not include any prose, code fences, or explanations.' },
      { role: 'user', content: `Return STRICT JSON ONLY with this schema:
{
  "summary": "Clinical summary in 200-250 words focusing on key findings, health implications, and recommendations"
}
Do not include any other keys. Use double quotes and valid JSON. No trailing commas.

Lab Report Text:
${text}` }
    ],
    max_tokens: 1200,
    temperature: 0.1,
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
  try { console.log('[PLAYGROUND][RAW][SUMMARY] Provider response JSON:', JSON.stringify(data)); } catch {}
  const content = extractGroqContent(data);
  console.log('[PLAYGROUND][RAW][SUMMARY] Extracted content:', content);

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
async function llmGenerateValuesFromText(text: string, apiKey: string, model: string = GROQ_MODEL): Promise<{ allValues: any[]; criticalValues: any[]; }> {
  const chatPayload = {
    model,
    messages: [
      { role: 'system', content: 'You are a medical lab report analyzer. Extract ONLY the test parameters and values that are explicitly mentioned in the provided lab report text. DO NOT generate, invent, or hallucinate any values not present in the text. Always respond with a single valid JSON object matching the requested schema. Do not include any prose, code fences, or explanations.' },
      { role: 'user', content: `Extract ONLY the test parameters and values that are explicitly mentioned in this lab report. DO NOT generate, invent, or hallucinate any values not present in the text. Return ONLY the JSON object:

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
${text}` }
    ],
    max_tokens: 2500,
    temperature: 0.1,
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
  try { console.log('[PLAYGROUND][RAW][VALUES] Provider response JSON:', JSON.stringify(data)); } catch {}
  const content = extractGroqContent(data);
  console.log('[PLAYGROUND][RAW][VALUES] Extracted content:', content);

  const parsed = tryParseLooseJson(content) || {};
  const allValues = Array.isArray(parsed.allValues) ? parsed.allValues : [];
  const criticalValues = Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [];
  
  // Log warning if too many values are extracted (potential hallucination)
  const totalValues = allValues.length + criticalValues.length;
  if (totalValues > 20) {
    console.warn(`[PLAYGROUND][VALUES] Warning: Extracted ${totalValues} values, which seems high. Please verify against original report.`);
  }
  
  console.log(`[PLAYGROUND][VALUES] Extracted ${allValues.length} all values and ${criticalValues.length} critical values`);
  
  return { allValues, criticalValues };
}

type RunInput = {
  runId: number;
  profileId: number;
  inputType: 'pdf' | 'text' | 'json' | 'prescriptionDraft';
  rawInput?: string | null;
  sourceFileUrl?: string | null;
  sourceFileUrls?: string[] | null;
  documentType?: 'lab_report' | 'prescription';
};

export async function executePlaygroundRun(input: RunInput) {
  const profile = await getProfileById(input.profileId);
  
  // Use only Groq API for uniformity
  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) {
    await appendStageLog(input.runId, { 
      name: 'init', 
      error: 'Missing GROQ_API_KEY', 
      startedAt: new Date().toISOString(), 
      finishedAt: new Date().toISOString() 
    }, 'failed');
    await completeRun(input.runId, { error: 'Missing GROQ_API_KEY' }, 'failed');
    return;
  }
  
  console.log(`[PLAYGROUND] Using Groq API for processing. Model: ${profile?.model || 'llama-3.3-70b-versatile'}`);

  // Stage 1: parse-text (PDF -> Text)
  let extractedText = input.rawInput || '';
  let extractionMethod = 'text-input';
  
  if (input.inputType === 'pdf') {
    const startedAt = Date.now();
    try {
      // Handle multiple PDFs for prescriptions
      if (input.sourceFileUrls && input.sourceFileUrls.length > 0) {
        extractionMethod = 'ocr-multiple';
        console.log(`[PLAYGROUND] Processing ${input.sourceFileUrls.length} PDFs for ${input.documentType || 'lab_report'}`);
        
        const allTexts: string[] = [];
        for (let i = 0; i < input.sourceFileUrls.length; i++) {
          const url = input.sourceFileUrls[i];
          console.log(`[PLAYGROUND] Processing PDF ${i + 1}/${input.sourceFileUrls.length}: ${url}`);
          const text = await ocrExtractPdfTextFromUrl(url);
          if (text && text.trim()) {
            allTexts.push(`[Document ${i + 1}]\n${text}`);
          }
        }
        
        extractedText = allTexts.join('\n\n---\n\n');
      } else if (input.sourceFileUrl) {
        // Single PDF processing
        extractionMethod = 'ocr';
        console.log('[PLAYGROUND] Using OCR (Google Vision) for single PDF text extraction');
        extractedText = await ocrExtractPdfTextFromUrl(input.sourceFileUrl);
      }
      
      const preview = (extractedText || '').slice(0, 1000);
      await appendStageLog(input.runId, { 
        name: 'parse-text', 
        request: { 
          pdfUrl: input.sourceFileUrl,
          pdfUrls: input.sourceFileUrls,
          documentType: input.documentType,
          pdfCount: input.sourceFileUrls?.length || (input.sourceFileUrl ? 1 : 0)
        }, 
        response: { 
          textPreview: preview, 
          textLength: (extractedText || '').length,
          extractionMethod: extractionMethod,
          fullText: extractedText || '',
          documentType: input.documentType,
          pdfCount: input.sourceFileUrls?.length || (input.sourceFileUrl ? 1 : 0)
        }, 
        error: null, 
        latencyMs: Date.now() - startedAt, 
        startedAt: new Date(startedAt).toISOString(), 
        finishedAt: new Date().toISOString() 
      }, 'running');
    } catch (e: any) {
      await appendStageLog(input.runId, {
        name: 'parse-text',
        request: { 
          pdfUrl: input.sourceFileUrl,
          pdfUrls: input.sourceFileUrls,
          documentType: input.documentType
        },
        response: { 
          textPreview: '', 
          textLength: 0,
          extractionMethod: 'failed',
          fullText: '',
          error: e.message
        },
        error: e.message,
        latencyMs: Date.now() - startedAt,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
      }, 'running');
      extractedText = '';
    }
  }

  // Prepare combined text and variable map (using same preprocessing as working version)
  let combinedText = extractedText;
  if (input.inputType === 'pdf' && input.rawInput && input.rawInput.trim()) {
    combinedText = `${extractedText}\n\n[Additional Context]\n${input.rawInput}`;
  }
  
  // Apply same text preprocessing as working version
  combinedText = combinedText
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim();
    
  // Validate text length (same as working version)
  if (!combinedText || combinedText.trim().length < 50) {
    await appendStageLog(input.runId, {
      name: 'text-validation',
      request: { textLength: combinedText.length },
      response: { error: 'Insufficient text for processing' },
      error: 'Insufficient text extracted for analysis',
      latencyMs: 0,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
    }, 'failed');
    await completeRun(input.runId, { error: 'Insufficient text for analysis' }, 'failed');
    return;
  }
  
  const variables = {
    TEXT: combinedText,
    PDF_URL: input.sourceFileUrl || null,
    ADDITIONAL_CONTEXT: input.rawInput || null,
  } as const;

  // Stage 2: extract-values (skip for prescriptions)
  const valuesStart = Date.now();
  let allValues: any[] = [];
  let criticalValues: any[] = [];
  
  if (input.documentType === 'prescription') {
    // Skip extract-values stage for prescriptions
    await appendStageLog(input.runId, {
      name: 'extract-values',
      request: { 
        documentType: input.documentType,
        skipped: true,
        reason: 'Lab values extraction not applicable for prescription analysis'
      },
      response: { 
        allValuesCount: 0, 
        criticalValuesCount: 0,
        allValues: [],
        criticalValues: [],
        documentType: input.documentType,
        skipped: true,
        reason: 'Lab values extraction not applicable for prescription analysis',
        summary: 'Stage skipped for prescription analysis'
      },
      error: null,
      latencyMs: Date.now() - valuesStart,
      startedAt: new Date(valuesStart).toISOString(),
      finishedAt: new Date().toISOString(),
    }, 'running');
  } else {
    // Extract values for lab reports using playground profile
    try {
      // Use playground profile prompts directly
      const model = profile?.model || GROQ_MODEL;
      const temperature = profile?.temperature || 0.1;
      const maxTokens = profile?.maxTokens || 2500;
      
      // Use ONLY playground profile prompts (no hardcoded fallbacks)
      const systemPrompt = profile?.systemPrompt;
      const userPrompt = profile?.valuesPrompt;

      // Validate that profile has required prompts
      if (!systemPrompt || !userPrompt) {
        throw new Error(`Playground profile is missing required prompts for values extraction. System Prompt: ${!!systemPrompt}, Values Prompt: ${!!userPrompt}. Please configure your profile prompts in the playground.`);
      }

      // Replace template variables in playground profile prompt
      const resolvedUserPrompt = userPrompt
        .replace(/\{\{TEXT\}\}/g, combinedText)
        .replace(/\{\{PDF_URL\}\}/g, variables.PDF_URL || '')
        .replace(/\{\{ADDITIONAL_CONTEXT\}\}/g, variables.ADDITIONAL_CONTEXT || '');

      console.log(`[PLAYGROUND][VALUES] Using playground profile: ${profile?.name || 'default'}`);
      console.log(`[PLAYGROUND][VALUES] Model: ${model}, Temperature: ${temperature}, MaxTokens: ${maxTokens}`);
      console.log(`[PLAYGROUND][VALUES] User prompt length: ${userPrompt.length}`);

      // Call Groq API directly with playground profile settings
      const chatPayload = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: resolvedUserPrompt }
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
      console.log(`[PLAYGROUND][VALUES] Raw response:`, content);

      const parsed = tryParseLooseJson(content);
      if (!parsed) {
        throw new Error('Failed to parse JSON response from LLM');
      }

      allValues = Array.isArray(parsed.allValues) ? parsed.allValues : [];
      criticalValues = Array.isArray(parsed.criticalValues) ? parsed.criticalValues : [];
      
      const valuesPromptTemplate = profile?.valuesPrompt || '';
      const resolvedValuesPromptPreview = valuesPromptTemplate
        ? valuesPromptTemplate
            .replace(/\{\{TEXT\}\}/g, (variables.TEXT || '').slice(0, 400))
            .replace(/\{\{PDF_URL\}\}/g, String(variables.PDF_URL || ''))
            .replace(/\{\{ADDITIONAL_CONTEXT\}\}/g, String(variables.ADDITIONAL_CONTEXT || '').slice(0, 400))
        : undefined;
      await appendStageLog(input.runId, {
        name: 'extract-values',
        request: {
          model: model,
          promptTemplate: valuesPromptTemplate || 'default-values-prompt',
          variablesPreview: {
            TEXT: (variables.TEXT || '').slice(0, 400),
            PDF_URL: variables.PDF_URL,
            ADDITIONAL_CONTEXT: (variables.ADDITIONAL_CONTEXT || '').slice(0, 400),
          },
          variablesFull: {
            TEXT: variables.TEXT,
            PDF_URL: variables.PDF_URL,
            ADDITIONAL_CONTEXT: variables.ADDITIONAL_CONTEXT,
          },
          textLength: (variables.TEXT || '').length,
          resolvedPromptPreview: resolvedValuesPromptPreview,
        },
        response: { 
          allValuesCount: allValues.length, 
          criticalValuesCount: criticalValues.length,
          allValues: allValues,
          criticalValues: criticalValues,
          documentType: input.documentType,
          summary: `Extracted ${allValues.length} total values with ${criticalValues.length} critical values`
        },
        error: null,
        latencyMs: Date.now() - valuesStart,
        startedAt: new Date(valuesStart).toISOString(),
        finishedAt: new Date().toISOString(),
      }, 'running');
    } catch (e: any) {
      console.error('[PLAYGROUND][VALUES] Error:', e);
      await appendStageLog(input.runId, {
        name: 'extract-values',
        request: { promptTemplate: profile?.valuesPrompt || 'default-values-prompt', model: profile?.model },
        response: null,
        error: String(e?.message || e),
        latencyMs: Date.now() - valuesStart,
        startedAt: new Date(valuesStart).toISOString(),
        finishedAt: new Date().toISOString(),
      }, 'failed');
      await completeRun(input.runId, { error: 'Value extraction failed' }, 'failed');
      return;
    }
  }

  // Stage 3: generate-summary (using same approach as working LLM processing)
  const summaryStart = Date.now();
  try {
    // Use playground profile prompts directly instead of production profile
    const model = profile?.model || GROQ_MODEL;
    const temperature = profile?.temperature || 0.1;
    const maxTokens = profile?.maxTokens || 1200;
    
    // Use ONLY playground profile prompts (no hardcoded fallbacks)
    const systemPrompt = profile?.systemPrompt;
    const userPrompt = profile?.summaryPrompt;

    // Validate that profile has required prompts
    if (!systemPrompt || !userPrompt) {
      throw new Error(`Playground profile is missing required prompts. System Prompt: ${!!systemPrompt}, User Prompt: ${!!userPrompt}. Please configure your profile prompts in the playground.`);
    }

    // Replace template variables in playground profile prompt
    const resolvedUserPrompt = userPrompt
      .replace(/\{\{TEXT\}\}/g, combinedText)
      .replace(/\{\{PDF_URL\}\}/g, variables.PDF_URL || '')
      .replace(/\{\{ADDITIONAL_CONTEXT\}\}/g, variables.ADDITIONAL_CONTEXT || '');

    console.log(`[PLAYGROUND][SUMMARY] Using playground profile: ${profile?.name || 'default'}`);
    console.log(`[PLAYGROUND][SUMMARY] Model: ${model}, Temperature: ${temperature}, MaxTokens: ${maxTokens}`);
    console.log(`[PLAYGROUND][SUMMARY] User prompt length: ${userPrompt.length}`);

    // Call Groq API directly with playground profile settings
    const chatPayload = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: resolvedUserPrompt }
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
    console.log(`[PLAYGROUND][SUMMARY] Raw response:`, content);

    const parsed = tryParseLooseJson(content);
    if (!parsed) {
      throw new Error('Failed to parse JSON response from LLM');
    }

    // Create summary result object from parsed response
    const summaryRes = {
      summary: parsed.summary || content.substring(0, 1200),
      keyFindings: Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      urgency: parsed.urgency || 'ROUTINE'
    };
    const summaryPromptTemplate = profile?.summaryPrompt || '';
    const resolvedSummaryPromptPreview = summaryPromptTemplate
      ? summaryPromptTemplate
          .replace(/\{\{TEXT\}\}/g, (variables.TEXT || '').slice(0, 400))
          .replace(/\{\{PDF_URL\}\}/g, String(variables.PDF_URL || ''))
          .replace(/\{\{ADDITIONAL_CONTEXT\}\}/g, String(variables.ADDITIONAL_CONTEXT || '').slice(0, 400))
      : undefined;
    const final = {
      summary: summaryRes.summary,
      keyFindings: summaryRes.keyFindings,
      recommendations: summaryRes.recommendations,
      urgency: summaryRes.urgency,
      allValues,
      criticalValues,
    };
    await appendStageLog(input.runId, {
      name: 'generate-summary',
      request: {
        model: model,
        promptTemplate: summaryPromptTemplate || 'default-summary-prompt',
        variablesPreview: {
          TEXT: (variables.TEXT || '').slice(0, 400),
          PDF_URL: variables.PDF_URL,
          ADDITIONAL_CONTEXT: (variables.ADDITIONAL_CONTEXT || '').slice(0, 400),
        },
        variablesFull: {
          TEXT: variables.TEXT,
          PDF_URL: variables.PDF_URL,
          ADDITIONAL_CONTEXT: variables.ADDITIONAL_CONTEXT,
        },
        textLength: (variables.TEXT || '').length,
        resolvedPromptPreview: resolvedSummaryPromptPreview,
      },
      response: { 
        summary: summaryRes.summary,
        keyFindings: summaryRes.keyFindings,
        recommendations: summaryRes.recommendations,
        urgency: summaryRes.urgency,
        summaryPreview: summaryRes.summary.slice(0, 200)
      },
      error: null,
      latencyMs: Date.now() - summaryStart,
      startedAt: new Date(summaryStart).toISOString(),
      finishedAt: new Date().toISOString(),
    }, 'completed');
    await completeRun(input.runId, final, 'completed');
  } catch (e: any) {
    console.error('[PLAYGROUND][SUMMARY] Error:', e);
    await appendStageLog(input.runId, {
      name: 'generate-summary',
      request: { prompt: profile?.summaryPrompt || 'default-summary-prompt', model: profile?.model },
      response: null,
      error: String(e?.message || e),
      latencyMs: Date.now() - summaryStart,
      startedAt: new Date(summaryStart).toISOString(),
      finishedAt: new Date().toISOString(),
    }, 'failed');
    await completeRun(input.runId, { error: 'Summary generation failed', allValues, criticalValues }, 'failed');
  }
}


