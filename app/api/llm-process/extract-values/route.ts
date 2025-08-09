import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { llmGenerateValuesFromText } from '@/lib/llm/processing';

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

    // Serve from DB if present and not forced
    const existing = await prisma.labReportAnalysis.findUnique({ where: { labBookingId } });
    if (existing && !force && (existing.allValues || existing.criticalValues)) {
      return NextResponse.json({
        success: true,
        cached: true,
        allValues: existing.allValues || [],
        criticalValues: existing.criticalValues || []
      });
    }

    // Call Groq
    const { allValues, criticalValues } = await llmGenerateValuesFromText(text, apiKey, '');

    // Upsert values in DB
    await prisma.labReportAnalysis.upsert({
      where: { labBookingId },
      create: {
        labBookingId,
        reportUrl: null,
        extractedText: null,
        llmSummary: existing?.llmSummary || null,
        criticalValues: criticalValues || [],
        allValues: allValues || [],
        trendAnalysis: existing?.trendAnalysis || {},
        llmModel: process.env.GROQ_VALUES_MODEL || 'llama-3.1-8b-instant',
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
      },
      update: {
        criticalValues: criticalValues || [],
        allValues: allValues || [],
        llmModel: process.env.GROQ_VALUES_MODEL || 'llama-3.1-8b-instant',
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
      }
    });

    return NextResponse.json({ success: true, allValues, criticalValues });
  } catch (error) {
    console.error('[EXTRACT-VALUES][ERROR]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
