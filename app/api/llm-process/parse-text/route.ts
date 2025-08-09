import { NextRequest, NextResponse } from 'next/server';
import { extractPdfText } from '@/lib/llm/processing';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfUrl } = body || {};
    if (!pdfUrl || typeof pdfUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing pdfUrl' }, { status: 400 });
    }
    try { new URL(pdfUrl); } catch { return NextResponse.json({ success: false, error: 'Invalid pdfUrl' }, { status: 400 }); }

    const text = await extractPdfText(pdfUrl);
    console.log('[LLM-PROC][PARSED_TEXT]', text);
    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error('[PARSE-TEXT][ERROR]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
