import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const labResultIndex = searchParams.get('labResultIndex') || '0';

    if (!reportId) {
      return NextResponse.json({ success: false, error: 'Missing reportId' }, { status: 400 });
    }

    const labBookingId = Number(reportId);
    const resultIndex = Number(labResultIndex);
    
    if (!labBookingId || Number.isNaN(labBookingId)) {
      return NextResponse.json({ success: false, error: 'Invalid reportId' }, { status: 400 });
    }

    // Check if analysis exists in database
    const existing = await prisma.labReportAnalysis.findFirst({ 
      where: { 
        labBookingId,
        labResultIndex: resultIndex,
        deletedAt: null
      } 
    });

    if (!existing) {
      return NextResponse.json({ 
        success: true, 
        exists: false,
        message: 'No analysis found in database'
      });
    }

    // Check if we have the required data
    const hasSummary = !!existing.llmSummary;
    const hasValues = !!(existing.allValues && existing.criticalValues);
    const summaryMeta = (existing.trendAnalysis as any)?.summaryMeta || null;

    // Debug logging
    console.log('[LAB-ANALYSIS-CHECK] Found existing analysis:', {
      id: existing.id,
      labBookingId: existing.labBookingId,
      labResultIndex: existing.labResultIndex,
      hasSummary,
      hasValues,
      allValuesLength: existing.allValues ? (Array.isArray(existing.allValues) ? existing.allValues.length : 'not-array') : 'null',
      criticalValuesLength: existing.criticalValues ? (Array.isArray(existing.criticalValues) ? existing.criticalValues.length : 'not-array') : 'null',
      extractedTextLength: existing.extractedText ? existing.extractedText.length : 'null'
    });

    return NextResponse.json({
      success: true,
      exists: true,
      hasSummary,
      hasValues,
      summary: existing.llmSummary || '',
      keyFindings: summaryMeta?.keyFindings || [],
      recommendations: summaryMeta?.recommendations || [],
      urgency: summaryMeta?.urgency || 'ROUTINE',
      criticalValues: existing.criticalValues || [],
      allValues: existing.allValues || [],
      extractedText: existing.extractedText || null,
      processingStatus: existing.processingStatus,
      processedAt: existing.processedAt,
      llmModel: existing.llmModel
    });

  } catch (error) {
    console.error('[LAB-ANALYSIS-CHECK][ERROR]', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
