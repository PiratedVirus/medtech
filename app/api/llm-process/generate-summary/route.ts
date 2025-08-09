import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { llmGenerateSummaryFromText } from '@/lib/llm/processing';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, reportId, force = false } = body || {};
    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json({ success: false, error: 'Missing or too-short text' }, { status: 400 });
    }

    const labBookingId = Number(reportId);
    if (!labBookingId || Number.isNaN(labBookingId)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid reportId' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'GROQ_API_KEY not configured' }, { status: 500 });

    // Try to serve from DB if available and not forced
    const existing = await prisma.labReportAnalysis.findUnique({ where: { labBookingId } });
    if (existing && !force) {
      const summaryMeta = (existing.trendAnalysis as any)?.summaryMeta || null;
      if (existing.llmSummary || summaryMeta) {
        return NextResponse.json({
          success: true,
          cached: true,
          summary: existing.llmSummary || '',
          keyFindings: summaryMeta?.keyFindings || [],
          recommendations: summaryMeta?.recommendations || [],
          urgency: summaryMeta?.urgency || 'ROUTINE'
        });
      }
    }

    // Generate via Groq
    const { summary, keyFindings, recommendations, urgency } = await llmGenerateSummaryFromText(text, apiKey, '');

    // Upsert DB record with summary and summaryMeta
    const trendAnalysis = {
      ...(existing?.trendAnalysis as any || {}),
      summaryMeta: { keyFindings, recommendations, urgency }
    };

    await prisma.labReportAnalysis.upsert({
      where: { labBookingId },
      create: {
        labBookingId,
        reportUrl: null,
        extractedText: null,
        llmSummary: summary,
        criticalValues: existing?.criticalValues || [],
        allValues: existing?.allValues || [],
        trendAnalysis,
        llmModel: process.env.GROQ_SUMMARY_MODEL || 'llama-3.3-70b-versatile',
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
      },
      update: {
        llmSummary: summary,
        trendAnalysis,
        llmModel: process.env.GROQ_SUMMARY_MODEL || 'llama-3.3-70b-versatile',
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, summary, keyFindings, recommendations, urgency });
  } catch (error) {
    console.error('[GENERATE-SUMMARY][ERROR]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
