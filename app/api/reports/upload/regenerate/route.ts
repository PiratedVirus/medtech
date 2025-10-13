import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { triggerLLMProcessing } from '../llm-processing';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportId, analysisType } = body;

    if (!reportId || !analysisType) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing reportId or analysisType' 
      }, { status: 400 });
    }

    const reportIdNum = parseInt(reportId);
    if (isNaN(reportIdNum)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid reportId' 
      }, { status: 400 });
    }

    // Get the report
    const report = await prisma.standaloneReport.findUnique({
      where: { id: reportIdNum }
    });

    if (!report) {
      return NextResponse.json({ 
        success: false, 
        error: 'Report not found' 
      }, { status: 404 });
    }

    // Find existing analysis or create new one
    let analysis = await prisma.standaloneReportAnalysis.findFirst({
      where: { 
        reportId: reportIdNum,
        analysisType,
        deletedAt: null
      }
    });

    if (analysis) {
      // Update existing analysis
      analysis = await prisma.standaloneReportAnalysis.update({
        where: { id: analysis.id },
        data: {
          processingStatus: 'PENDING',
          processingError: null,
          processedAt: null
        }
      });
    } else {
      // Create new analysis
      analysis = await prisma.standaloneReportAnalysis.create({
        data: {
          reportId: reportIdNum,
          analysisType,
          processingStatus: 'PENDING'
        }
      });
    }

    // Trigger actual LLM processing
    try {
      // Start processing in background (don't await to avoid blocking the response)
      triggerLLMProcessing(reportIdNum, analysisType, true).catch((error: any) => {
        console.error(`[REGENERATE] Background processing failed for report ${reportIdNum}:`, error);
      });
      
      console.log(`[REGENERATE] Started LLM processing for report ${reportIdNum}, type: ${analysisType}`);
    } catch (processingError) {
      console.error('[REGENERATE] Failed to start processing:', processingError);
      // Fallback: just update status
      await prisma.standaloneReportAnalysis.update({
        where: { id: analysis.id },
        data: { 
          processingStatus: 'PENDING',
          processingError: 'Failed to start processing. Please try again.'
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Analysis regeneration initiated',
      analysisId: analysis.id
    });

  } catch (error: any) {
    console.error('Error regenerating standalone report analysis:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Internal server error' 
    }, { status: 500 });
  }
}
