import 'server-only';
import { groqLimiter } from './limiter';

// Configuration constants
const GROQ_SUMMARY_MODEL = process.env.GROQ_SUMMARY_MODEL || 'llama-3.3-70b-versatile';
const GROQ_VALUES_MODEL = process.env.GROQ_VALUES_MODEL || 'llama-3.3-70b-versatile';
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const MAX_PDF_MB = Number(process.env.OPENROUTER_MAX_PDF_MB ?? 10);
const MAX_TEXT_TOKENS = 8000;

// Utility functions that are still needed
function estimateTokensFromText(text: string): number {
  if (!text) return 0;
  // Rough heuristic: 1 token ≈ 4 chars (varies by model). Clamp to non-negative.
  return Math.max(0, Math.ceil(text.length / 4));
}

function assertValidGroqKey(apiKey: string) {
  // OpenRouter keys commonly start with "sk-or-"; Groq keys start with "gsk_"
  const isOpenRouterKey = apiKey.startsWith('sk-or-') || apiKey.toLowerCase().includes('openrouter');
  if (isOpenRouterKey) {
    throw new Error('Configured API key looks like an OpenRouter key. Set GROQ_API_KEY to a valid Groq key (starts with "gsk_") for this endpoint.');
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

// Export the utility functions that might still be needed elsewhere
export { estimateTokensFromText, assertValidGroqKey, preprocessText, chunkText };
export { GROQ_SUMMARY_MODEL, GROQ_VALUES_MODEL, GROQ_ENDPOINT, MAX_PDF_MB, MAX_TEXT_TOKENS };
