import { NextRequest, NextResponse } from 'next/server';
import { llmGenerateSummaryFromText } from '@/lib/llm/processing';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body || {};
    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json({ success: false, error: 'Missing or too-short text' }, { status: 400 });
    }
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'GROQ_API_KEY not configured' }, { status: 500 });

    const summary = await llmGenerateSummaryFromText(text, apiKey, '');
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('[GENERATE-SUMMARY][ERROR]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
