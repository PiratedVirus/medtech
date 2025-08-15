import 'server-only';
import { appendStageLog, completeRun, getProfileById } from './profile-service';
import { extractPdfText } from './processing';
import { ocrExtractPdfTextFromUrl } from '../ocr/google-vision';
import { llmGenerateSummaryFromText, llmGenerateValuesFromText } from './processing';

type RunInput = {
  runId: number;
  profileId: number;
  inputType: 'pdf' | 'text' | 'json' | 'prescriptionDraft';
  rawInput?: string | null;
  sourceFileUrl?: string | null;
};

export async function executePlaygroundRun(input: RunInput) {
  const profile = await getProfileById(input.profileId);
  const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || '';
  if (!apiKey) {
    await appendStageLog(input.runId, { name: 'init', error: 'Missing GROQ_API_KEY or OPENROUTER_API_KEY', startedAt: new Date().toISOString(), finishedAt: new Date().toISOString() }, 'failed');
    await completeRun(input.runId, { error: 'Missing API key' }, 'failed');
    return;
  }

  // Stage 1: parse-text (PDF -> Text)
  let extractedText = input.rawInput || '';
  if (input.inputType === 'pdf' && input.sourceFileUrl) {
    const startedAt = Date.now();
    try {
      // Try pdf-parse first, then OCR fallback
      try {
        extractedText = await extractPdfText(input.sourceFileUrl);
      } catch {}
      if (!extractedText || extractedText.trim().length < 50) {
        extractedText = await ocrExtractPdfTextFromUrl(input.sourceFileUrl);
      }
      const preview = (extractedText || '').slice(0, 1000);
      await appendStageLog(input.runId, { name: 'parse-text', request: { pdfUrl: input.sourceFileUrl }, response: { textPreview: preview, textLength: (extractedText || '').length }, error: null, latencyMs: Date.now() - startedAt, startedAt: new Date(startedAt).toISOString(), finishedAt: new Date().toISOString() }, 'running');
    } catch (e: any) {
      await appendStageLog(input.runId, {
        name: 'parse-text',
        request: { pdfUrl: input.sourceFileUrl },
        response: { textPreview: '', textLength: 0 },
        error: null,
        latencyMs: Date.now() - startedAt,
        startedAt: new Date(startedAt).toISOString(),
        finishedAt: new Date().toISOString(),
      }, 'running');
      extractedText = '';
    }
  }

  // Prepare combined text and variable map
  let combinedText = extractedText;
  if (input.inputType === 'pdf' && input.rawInput && input.rawInput.trim()) {
    combinedText = `${extractedText}\n\n[Additional Context]\n${input.rawInput}`;
  }
  const variables = {
    TEXT: combinedText,
    PDF_URL: input.sourceFileUrl || null,
    ADDITIONAL_CONTEXT: input.rawInput || null,
  } as const;

  // Stage 2: extract-values
  const valuesStart = Date.now();
  let allValues: any[] = [];
  let criticalValues: any[] = [];
  try {
    const values = await llmGenerateValuesFromText(combinedText, apiKey, '');
    allValues = values.allValues || [];
    criticalValues = values.criticalValues || [];
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
        model: profile?.model,
        promptTemplate: valuesPromptTemplate || 'default-values-prompt',
        variablesPreview: {
          TEXT: (variables.TEXT || '').slice(0, 400),
          PDF_URL: variables.PDF_URL,
          ADDITIONAL_CONTEXT: (variables.ADDITIONAL_CONTEXT || '').slice(0, 400),
        },
        resolvedPromptPreview: resolvedValuesPromptPreview,
      },
      response: { 
        allValuesCount: allValues.length, 
        criticalValuesCount: criticalValues.length,
        allValues: allValues,
        criticalValues: criticalValues,
        summary: `Extracted ${allValues.length} total values with ${criticalValues.length} critical values`
      },
      error: null,
      latencyMs: Date.now() - valuesStart,
      startedAt: new Date(valuesStart).toISOString(),
      finishedAt: new Date().toISOString(),
    }, 'running');
  } catch (e: any) {
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

  // Stage 3: generate-summary
  const summaryStart = Date.now();
  try {
    const summaryRes = await llmGenerateSummaryFromText(combinedText, apiKey, '');
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
        model: profile?.model,
        promptTemplate: summaryPromptTemplate || 'default-summary-prompt',
        variablesPreview: {
          TEXT: (variables.TEXT || '').slice(0, 400),
          PDF_URL: variables.PDF_URL,
          ADDITIONAL_CONTEXT: (variables.ADDITIONAL_CONTEXT || '').slice(0, 400),
        },
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


