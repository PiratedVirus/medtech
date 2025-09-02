import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/llm/unified-service';
import { ocrExtractPdfTextFromUrl } from '@/lib/ocr/google-vision';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfUrl } = body || {};
    if (!pdfUrl || typeof pdfUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing pdfUrl' }, { status: 400 });
    }
    try { new URL(pdfUrl); } catch { return NextResponse.json({ success: false, error: 'Invalid pdfUrl' }, { status: 400 }); }

    let text = '';
    let method: 'pdf-parse' | 'ocr' = 'ocr';
    try {
      console.log('[PARSE-TEXT] Using OCR (Google Vision) for PDF text extraction');
      text = await ocrExtractPdfTextFromUrl(pdfUrl);
    } catch (ocrErr) {
      console.error('[PARSE-TEXT] OCR failed:', ocrErr);
      return NextResponse.json({ success: true, text: '', warning: 'No extractable text found (OCR failed).', method });
    }
    // Log only a preview to avoid flooding logs
    try {
      const words = text.split(/\s+/);
      const preview = words.slice(0, 200).join(' ');
      console.log('[LLM-PROC][PARSED_TEXT_PREVIEW]', preview);
    } catch {}
    return NextResponse.json({ success: true, text, method });
  } catch (error) {
    console.error('[PARSE-TEXT][ERROR]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
