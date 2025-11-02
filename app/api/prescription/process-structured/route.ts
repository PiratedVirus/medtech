import { NextRequest, NextResponse } from 'next/server';
import { PrescriptionProcessor } from '@/lib/prescription-processor';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prescriptionId } = body;

    if (!prescriptionId) {
      return NextResponse.json(
        { success: false, error: "Missing prescription ID" },
        { status: 400 }
      );
    }

    console.log(`[PRESCRIPTION-STRUCTURED-PROC] Processing structured prescription ${prescriptionId}`);

    // Get API key
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "No API key configured for LLM processing" },
        { status: 500 }
      );
    }

    // Fetch prescription with all related data
    const prescription = await prisma.prescription.findUnique({
      where: { id: parseInt(prescriptionId) },
      include: {
        complaints: true,
        vitals: true,
        history: true,
        systemicExamination: true,
        medicines: true,
        patient: {
          select: {
            name: true
          }
        },
        doctor: {
          select: {
            name: true
          }
        },
        appointment: {
          select: {
            id: true
          }
        }
      }
    });

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

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

    // Convert to structured data format
    const structuredData = {
      id: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      advice: prescription.advice,
      testsRequested: prescription.testsRequested,
      nextVisitDate: prescription.nextVisitDate,
      complaints: prescription.complaints.map(c => ({
        complaintText: c.complaintText,
        severity: c.severity,
        daysSince: c.daysSince,
        isFlagged: c.isFlagged
      })),
      vitals: prescription.vitals ? {
        bloodPressure: prescription.vitals.bloodPressure,
        pulse: prescription.vitals.pulse,
        height: prescription.vitals.height,
        weight: prescription.vitals.weight
      } : undefined,
      historyOfCurrentIllness: prescription.historyOfCurrentIllness,
      systemicExamination: prescription.systemicExamination ? {
        general: prescription.systemicExamination.general,
        cvs: prescription.systemicExamination.cvs,
        rs: prescription.systemicExamination.rs,
        cns: prescription.systemicExamination.cns
      } : undefined,
      medicines: prescription.medicines.map(m => ({
        medicineName: m.medicineName,
        frequency: m.frequency,
        medicineTime: m.medicineTime,
        duration: m.duration,
        quantity: m.quantity,
        instructions: m.instructions
      })),
      patient: prescription.patient,
      doctor: prescription.doctor,
      createdAt: prescription.createdAt
    } as any; // Type assertion to avoid complex type mismatch

    // Process structured prescription
    const result = await PrescriptionProcessor.processStructuredPrescription(structuredData, apiKey);

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
          appointmentId: prescription.appointment?.id || 0,
          patientId: prescription.patientId,
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
        appointmentId: prescription.appointment?.id || 0,
        patientId: prescription.patientId,
        extractedText: result.extractedText!,
        textLength: result.extractedText!.length,
        processingStatus: 'COMPLETED',
        processedAt: new Date()
      }
    });

    console.log(`[PRESCRIPTION-STRUCTURED-PROC] Text stored successfully for prescription ${prescriptionId}`);

    // Generate/update patient AI summary
    await generateOrUpdatePatientSummary(prescription.patientId, apiKey);

    return NextResponse.json({
      success: true,
      message: "Structured prescription processed successfully",
      data: {
        extractedText: result.extractedText,
        textLength: result.extractedText!.length,
        summary: result.summary
      }
    });

  } catch (error) {
    console.error("[PRESCRIPTION-STRUCTURED-PROC] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Generate or update patient AI summary based on all available prescriptions
 */
async function generateOrUpdatePatientSummary(patientId: number, apiKey: string) {
  try {
    console.log(`[PRESCRIPTION-STRUCTURED-PROC] Generating patient summary for patient ${patientId}`);

    // Get all prescription texts for this patient (both PDF and structured)
    const prescriptionTexts = await prisma.prescriptionText.findMany({
      where: {
        patientId,
        processingStatus: 'COMPLETED'
      },
      select: { extractedText: true },
      orderBy: { createdAt: 'asc' }
    });

    if (prescriptionTexts.length === 0) {
      console.log(`[PRESCRIPTION-STRUCTURED-PROC] No prescription texts found for patient ${patientId}`);
      return;
    }

    // Filter out any null extractedText values
    const validPrescriptionTexts = prescriptionTexts.filter((pt: any) => pt.extractedText !== null);

    if (validPrescriptionTexts.length === 0) {
      console.log(`[PRESCRIPTION-STRUCTURED-PROC] No valid prescription texts found for patient ${patientId}`);
      return;
    }

    const texts = validPrescriptionTexts.map((pt: any) => pt.extractedText!);
    
    // Generate comprehensive patient summary
    const summaryResult = await PrescriptionProcessor.generatePatientSummary(texts, apiKey, '');

    if (!summaryResult.success) {
      console.error(`[PRESCRIPTION-STRUCTURED-PROC] Failed to generate patient summary:`, summaryResult.error);
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
        llmModel: 'meta-llama/llama-4-scout-17b-16e-instruct',
        updatedAt: new Date()
      },
      create: {
        patientId,
        summaryText: summaryResult.summary!,
        keyFindings: summaryResult.keyFindings || [],
        recommendations: summaryResult.recommendations || [],
        urgency: summaryResult.urgency || 'ROUTINE',
        prescriptionCount: texts.length,
        llmModel: 'meta-llama/llama-4-scout-17b-16e-instruct'
      }
    });

    console.log(`[PRESCRIPTION-STRUCTURED-PROC] Patient summary updated successfully for patient ${patientId}`);

  } catch (error) {
    console.error(`[PRESCRIPTION-STRUCTURED-PROC] Error generating patient summary:`, error);
  }
}
