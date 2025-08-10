import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ProcessingStatus } from '@prisma/client';
import { extractPdfText } from '@/lib/llm/processing';
import { PrescriptionProcessor } from '@/lib/prescription-processor';

export const runtime = 'nodejs';

const prisma = new PrismaClient();

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  const { patientId: patientIdParam } = await params;
  const patientId = Number(patientIdParam);
  if (!patientId || Number.isNaN(patientId)) {
    return NextResponse.json({ success: false, error: 'Invalid patientId' }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'No API key configured for LLM processing' }, { status: 500 });
  }

  try {
    // Load patient and their prescriptions with appointment links
    const [patient, prescriptions] = await Promise.all([
      prisma.user.findUnique({ where: { id: patientId }, select: { id: true, name: true } }),
      prisma.prescription.findMany({
        where: { patientId },
        select: {
          id: true,
          appointmentId: true,
          appointment: { select: { id: true, prescriptionLink: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    if (!patient) {
      return NextResponse.json({ success: false, error: 'Patient not found' }, { status: 404 });
    }

    const results: Array<{
      prescriptionId: number;
      appointmentId: number;
      status: ProcessingStatus | 'SKIPPED';
      error?: string;
    }> = [];

    for (const p of prescriptions) {
      const prescriptionId = p.id;
      const appointmentId = p.appointmentId;

      // Check existing text record
      const existing = await prisma.prescriptionText.findUnique({ where: { prescriptionId } });
      if (existing && existing.processingStatus === 'COMPLETED' && existing.extractedText?.length) {
        results.push({ prescriptionId, appointmentId, status: 'COMPLETED' });
        continue;
      }

      const pdfUrl = p.appointment?.prescriptionLink || '';
      if (!pdfUrl) {
        // Skip silently if no PDF link is available for this prescription
        results.push({ prescriptionId, appointmentId, status: 'SKIPPED' });
        continue;
      }

      // Try to extract text and store
      try {
        const text = await extractPdfText(pdfUrl);
        await prisma.prescriptionText.upsert({
          where: { prescriptionId },
          update: {
            extractedText: text,
            textLength: text.length,
            processingStatus: 'COMPLETED',
            processedAt: new Date(),
            processingError: null,
            updatedAt: new Date(),
          },
          create: {
            prescriptionId,
            appointmentId,
            patientId,
            extractedText: text,
            textLength: text.length,
            processingStatus: 'COMPLETED',
            processedAt: new Date(),
          },
        });
        results.push({ prescriptionId, appointmentId, status: 'COMPLETED' });
      } catch (e: any) {
        const errMsg = String(e?.message || e);
        await prisma.prescriptionText.upsert({
          where: { prescriptionId },
          update: {
            processingStatus: 'FAILED',
            processingError: errMsg,
            updatedAt: new Date(),
          },
          create: {
            prescriptionId,
            appointmentId,
            patientId,
            extractedText: '',
            textLength: 0,
            processingStatus: 'FAILED',
            processingError: errMsg,
          },
        });
        results.push({ prescriptionId, appointmentId, status: 'FAILED', error: errMsg });
      }
    }

    // Now aggregate all completed texts and regenerate patient summary
    const texts = await prisma.prescriptionText.findMany({
      where: { patientId, processingStatus: 'COMPLETED' },
      select: { extractedText: true },
      orderBy: { createdAt: 'asc' },
    });

    let summaryUpdate: {
      summary?: string;
      keyFindings?: string[];
      recommendations?: string[];
      urgency?: 'ROUTINE' | 'SOON' | 'URGENT';
      count?: number;
    } | null = null;

    if (texts.length > 0) {
      const combined = texts.map(t => t.extractedText).filter(Boolean) as string[];
      const summaryResult = await PrescriptionProcessor.generatePatientSummary(combined, apiKey, siteUrl);
      if (summaryResult.success) {
        await prisma.patientAISummary.upsert({
          where: { patientId },
          update: {
            summaryText: summaryResult.summary!,
            keyFindings: summaryResult.keyFindings || [],
            recommendations: summaryResult.recommendations || [],
            urgency: summaryResult.urgency || 'ROUTINE',
            lastUpdated: new Date(),
            prescriptionCount: combined.length,
            llmModel: 'groq-llama-3.3-70b',
            updatedAt: new Date(),
          },
          create: {
            patientId,
            summaryText: summaryResult.summary!,
            keyFindings: summaryResult.keyFindings || [],
            recommendations: summaryResult.recommendations || [],
            urgency: summaryResult.urgency || 'ROUTINE',
            prescriptionCount: combined.length,
            llmModel: 'groq-llama-3.3-70b',
          },
        });
        summaryUpdate = {
          summary: summaryResult.summary,
          keyFindings: summaryResult.keyFindings,
          recommendations: summaryResult.recommendations,
          urgency: summaryResult.urgency,
          count: combined.length,
        };
      }
    }

    const total = prescriptions.length;
    const completed = results.filter(r => r.status === 'COMPLETED').length;
    const failed = results.filter(r => r.status === 'FAILED').length;

    return NextResponse.json({
      success: true,
      patient: { id: patient.id, name: patient.name },
      totals: { total, completed, failed, alreadyProcessed: results.filter(r => r.status === 'COMPLETED').length - (texts.length || 0) },
      results,
      summary: summaryUpdate,
    });
  } catch (error: any) {
    console.error('[PRESCRIPTION][PROCESS-ALL] Error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}


