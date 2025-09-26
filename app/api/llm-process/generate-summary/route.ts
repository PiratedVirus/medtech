import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generateSummary } from '@/lib/llm/unified-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, reportId, labResultIndex = 0, force = false } = body || {};
    if (!text || typeof text !== 'string' || text.trim().length < 20) {
      return NextResponse.json({ success: false, error: 'Missing or too-short text' }, { status: 400 });
    }

    // Check text length to prevent context length exceeded errors
    const maxTextLength = 32000; // Conservative limit for Groq API
    if (text.length > maxTextLength) {
      return NextResponse.json({ 
        success: false, 
        error: `Text too long (${text.length} chars). Maximum allowed: ${maxTextLength} characters.` 
      }, { status: 400 });
    }

    const labBookingId = Number(reportId);
    if (!labBookingId || Number.isNaN(labBookingId)) {
      return NextResponse.json({ success: false, error: 'Missing or invalid reportId' }, { status: 400 });
    }

    // Verify that the lab booking exists
    const labBooking = await prisma.labBooking.findFirst({
      where: { 
        id: labBookingId,
        deletedAt: null
      }
    });
    
    if (!labBooking) {
      return NextResponse.json({ success: false, error: 'Lab booking not found' }, { status: 404 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return NextResponse.json({ success: false, error: 'GROQ_API_KEY not configured' }, { status: 500 });

    // Try to serve from DB if available and not forced
    const existing = await prisma.labReportAnalysis.findFirst({ 
      where: { 
        labBookingId,
        labResultIndex,
        deletedAt: null
      } 
    });
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
    const { summary, keyFindings, recommendations, urgency } = await generateSummary(text, apiKey);

    // Upsert DB record with summary and summaryMeta
    const trendAnalysis = {
      ...(existing?.trendAnalysis as any || {}),
      summaryMeta: { keyFindings, recommendations, urgency }
    };

    await prisma.labReportAnalysis.upsert({
      where: { 
        labBookingId_labResultIndex: {
          labBookingId,
          labResultIndex
        }
      },
      create: {
        labBookingId,
        labResultIndex,
        reportUrl: null,
        extractedText: text, // Save the parsed text
        llmSummary: summary,
        criticalValues: existing?.criticalValues || [],
        allValues: existing?.allValues || [],
        trendAnalysis,
        llmModel: process.env.GROQ_SUMMARY_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
      },
      update: {
        extractedText: text, // Update with new parsed text
        llmSummary: summary,
        criticalValues: existing?.criticalValues || [],
        allValues: existing?.allValues || [],
        trendAnalysis,
        llmModel: process.env.GROQ_SUMMARY_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
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
