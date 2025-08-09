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
    const apiKey = process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    if (!apiKey) return NextResponse.json({ success: false, error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });

    const summary = await llmGenerateSummaryFromText(text, apiKey, siteUrl);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    console.error('[GENERATE-SUMMARY][ERROR]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
