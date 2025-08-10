import { NextRequest, NextResponse } from "next/server";
import { PrescriptionProcessor } from "@/lib/prescription-processor";
import { PrismaClient } from '@prisma/client';

export async function POST(request: NextRequest) {
  // Create a new Prisma client instance for this request
  const prisma = new PrismaClient();
  
  try {
    // Debug: Check if prisma is loaded
    console.log('[PRESCRIPTION-PROC-API] Prisma object:', typeof prisma, prisma ? 'loaded' : 'undefined');
    console.log('[PRESCRIPTION-PROC-API] Prisma keys:', prisma ? Object.keys(prisma) : 'undefined');
    
    const body = await request.json();
    const { appointmentId, pdfUrl, patientId, prescriptionId } = body;

    if (!appointmentId || !pdfUrl || !patientId || !prescriptionId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log(`[PRESCRIPTION-PROC-API] Processing prescription for appointment ${appointmentId}`);

    // Check if already processed
    const existingText = await prisma.prescriptionText.findUnique({
      where: { prescriptionId: parseInt(prescriptionId) }
    });

    if (existingText && existingText.processingStatus === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: "Prescription already processed",
        data: {
          extractedText: existingText.extractedText,
          textLength: existingText.textLength
        }
      });
    }

    // Get API key and site URL
    // Prefer GROQ key for this flow since the underlying LLM client uses Groq endpoint
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "No API key configured for LLM processing" },
        { status: 500 }
      );
    }

    // Process the prescription PDF
    const result = await PrescriptionProcessor.processPrescription(pdfUrl, apiKey, siteUrl);

    if (!result.success) {
      // Update processing status to failed
      await prisma.prescriptionText.upsert({
        where: { prescriptionId: parseInt(prescriptionId) },
        update: {
          processingStatus: 'FAILED',
          processingError: result.error,
          updatedAt: new Date()
        },
        create: {
          prescriptionId: parseInt(prescriptionId),
          appointmentId: parseInt(appointmentId),
          patientId: parseInt(patientId),
          extractedText: '',
          textLength: 0,
          processingStatus: 'FAILED',
          processingError: result.error
        }
      });

      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    // Store extracted text
    const prescriptionText = await prisma.prescriptionText.upsert({
      where: { prescriptionId: parseInt(prescriptionId) },
      update: {
        extractedText: result.extractedText!,
        textLength: result.extractedText!.length,
        processingStatus: 'COMPLETED',
        processedAt: new Date(),
        processingError: null,
        updatedAt: new Date()
      },
      create: {
        prescriptionId: parseInt(prescriptionId),
        appointmentId: parseInt(appointmentId),
        patientId: parseInt(patientId),
        extractedText: result.extractedText!,
        textLength: result.extractedText!.length,
        processingStatus: 'COMPLETED',
        processedAt: new Date()
      }
    });

    console.log(`[PRESCRIPTION-PROC-API] Text stored successfully for prescription ${prescriptionId}`);

    // Now generate/update patient AI summary
    await generateOrUpdatePatientSummary(parseInt(patientId), apiKey, siteUrl, prisma);

    return NextResponse.json({
      success: true,
      message: "Prescription processed successfully",
      data: {
        extractedText: result.extractedText,
        textLength: result.extractedText!.length,
        summary: result.summary
      }
    });

  } catch (error) {
    console.error("[PRESCRIPTION-PROC-API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    // Always disconnect the Prisma client
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

/**
 * Generate or update patient AI summary based on all available prescriptions
 */
async function generateOrUpdatePatientSummary(patientId: number, apiKey: string, siteUrl: string, prisma: PrismaClient) {
  try {
    console.log(`[PRESCRIPTION-PROC-API] Generating patient summary for patient ${patientId}`);

    // Get all prescription texts for this patient
    const prescriptionTexts = await prisma.prescriptionText.findMany({
      where: {
        patientId,
        processingStatus: 'COMPLETED'
      },
      select: { extractedText: true },
      orderBy: { createdAt: 'asc' }
    });

    if (prescriptionTexts.length === 0) {
      console.log(`[PRESCRIPTION-PROC-API] No prescription texts found for patient ${patientId}`);
      return;
    }

    // Filter out any null extractedText values
    const validPrescriptionTexts = prescriptionTexts.filter((pt: any) => pt.extractedText !== null);

    if (validPrescriptionTexts.length === 0) {
      console.log(`[PRESCRIPTION-PROC-API] No valid prescription texts found for patient ${patientId}`);
      return;
    }

    const texts = validPrescriptionTexts.map((pt: any) => pt.extractedText!);
    
    // Generate comprehensive patient summary
    const summaryResult = await PrescriptionProcessor.generatePatientSummary(texts, apiKey, siteUrl);

    if (!summaryResult.success) {
      console.error(`[PRESCRIPTION-PROC-API] Failed to generate patient summary:`, summaryResult.error);
      return;
    }

    // Store or update patient AI summary
    await prisma.patientAISummary.upsert({
      where: { patientId },
      update: {
        summaryText: summaryResult.summary!,
        keyFindings: summaryResult.keyFindings || [],
        recommendations: summaryResult.recommendations || [],
        urgency: summaryResult.urgency || 'ROUTINE',
        lastUpdated: new Date(),
        prescriptionCount: texts.length,
        llmModel: 'openrouter-llama-3.3-70b',
        updatedAt: new Date()
      },
      create: {
        patientId,
        summaryText: summaryResult.summary!,
        keyFindings: summaryResult.keyFindings || [],
        recommendations: summaryResult.recommendations || [],
        urgency: summaryResult.urgency || 'ROUTINE',
        prescriptionCount: texts.length,
        llmModel: 'openrouter-llama-3.3-70b'
      }
    });

    console.log(`[PRESCRIPTION-PROC-API] Patient summary updated successfully for patient ${patientId}`);

  } catch (error) {
    console.error(`[PRESCRIPTION-PROC-API] Error generating patient summary:`, error);
  }
}
