import { NextRequest, NextResponse } from 'next/server';
import { generatePrescriptionSummary } from '@/lib/llm/unified-service';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientId, force = false } = body;
    
    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Missing patient ID" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "No API key configured for LLM processing" },
        { status: 500 }
      );
    }

    // Get patient with all prescriptions
    const patient = await prisma.user.findUnique({
      where: { id: parseInt(patientId) },
      include: {
        patientPrescriptions: {
          include: {
            appointment: {
              select: {
                id: true,
                prescriptionLink: true
              }
            },
            prescriptionText: {
              select: {
                extractedText: true,
                processingStatus: true
              }
            }
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: "Patient not found" },
        { status: 404 }
      );
    }

    // Get all prescriptions with PDFs
    const prescriptionsWithPdfs = patient.patientPrescriptions.filter(
      p => p.appointment?.prescriptionLink
    );

    if (prescriptionsWithPdfs.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No prescriptions with PDFs found for this patient"
      }, { status: 404 });
    }

    // Process all prescriptions and collect their texts
    const prescriptionTexts: string[] = [];
    const processedPrescriptions: any[] = [];
    const totalPrescriptions = prescriptionsWithPdfs.length;

    console.log(`[PRESCRIPTION-REGENERATE] Starting processing of ${totalPrescriptions} prescriptions for patient ${patientId}`);

    for (let i = 0; i < prescriptionsWithPdfs.length; i++) {
      const prescription = prescriptionsWithPdfs[i];
      const fileName = prescription.appointment?.prescriptionLink?.split('/').pop() || `Prescription ${i + 1}`;
      
      console.log(`[PRESCRIPTION-REGENERATE] Processing prescription ${i + 1}/${totalPrescriptions}: ${fileName}`);
      
      // Set status to PROCESSING
      await prisma.prescriptionText.upsert({
        where: { prescriptionId: prescription.id },
        update: {
          processingStatus: 'PROCESSING',
          processedAt: null,
          processingError: null
        },
        create: {
          prescriptionId: prescription.id,
          patientId: parseInt(patientId),
          appointmentId: prescription.appointment?.id || 0,
          extractedText: '',
          textLength: 0,
          processingStatus: 'PROCESSING',
          processedAt: null
        }
      });

      // Check if we already have extracted text for this prescription
      const existingPrescriptionText = await prisma.prescriptionText.findUnique({
        where: { prescriptionId: prescription.id }
      });
      
      let extractedText = existingPrescriptionText?.extractedText;
      
      // Extract text from PDF if not already done
      if (!extractedText && prescription.appointment?.prescriptionLink) {
        try {
          const extractResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/llm-process/parse-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfUrl: prescription.appointment.prescriptionLink })
          });

          if (extractResponse.ok) {
            const extractData = await extractResponse.json();
            extractedText = extractData.text;
          }
        } catch (error) {
          console.error(`Failed to extract text from prescription ${prescription.id}:`, error);
          
          // Set status to FAILED
          await prisma.prescriptionText.update({
            where: { prescriptionId: prescription.id },
            data: {
              processingStatus: 'FAILED',
              processingError: error instanceof Error ? error.message : 'Unknown error',
              processedAt: new Date()
            }
          });
          continue;
        }
      }

      if (extractedText) {
        prescriptionTexts.push(extractedText);
        processedPrescriptions.push(prescription);
        
        console.log(`[PRESCRIPTION-REGENERATE] Successfully processed prescription ${i + 1}/${totalPrescriptions}: ${fileName}`);
        
        // Store the extracted text and set status to COMPLETED
        await prisma.prescriptionText.upsert({
          where: { prescriptionId: prescription.id },
          update: {
            extractedText: extractedText,
            processingStatus: 'COMPLETED',
            processedAt: new Date(),
            processingError: null
          },
          create: {
            prescriptionId: prescription.id,
            patientId: parseInt(patientId),
            appointmentId: prescription.appointment?.id || 0,
            extractedText: extractedText,
            textLength: extractedText.length,
            processingStatus: 'COMPLETED',
            processedAt: new Date()
          }
        });
      }
    }

    if (prescriptionTexts.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No text content available for analysis"
      }, { status: 400 });
    }

    // Generate comprehensive patient summary from all prescription texts
    const summaryResult = await generatePrescriptionSummary(prescriptionTexts, apiKey);
    
    if (!summaryResult) {
      return NextResponse.json(
        { success: false, error: "Failed to generate prescription summary" },
        { status: 500 }
      );
    }

    // Store the AI summary
    await prisma.patientAISummary.upsert({
      where: { 
        patientId: parseInt(patientId)
      },
      update: {
        summaryText: summaryResult.summary,
        urgency: summaryResult.urgency,
        lastUpdated: new Date(),
        prescriptionCount: prescriptionTexts.length,
        llmModel: 'groq-llama-3.3-70b-versatile'
      },
      create: {
        patientId: parseInt(patientId),
        summaryText: summaryResult.summary,
        urgency: summaryResult.urgency,
        lastUpdated: new Date(),
        prescriptionCount: prescriptionTexts.length,
        llmModel: 'groq-llama-3.3-70b-versatile'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: summaryResult.summary,
        keyFindings: summaryResult.keyFindings,
        recommendations: summaryResult.recommendations,
        urgency: summaryResult.urgency,
        processedPrescriptions: processedPrescriptions.length,
        totalPrescriptions: prescriptionsWithPdfs.length
      }
    });

  } catch (error) {
    console.error('[PRESCRIPTION-REGENERATE] Error:', error);
    return NextResponse.json(
      { success: false, error: `Failed to regenerate prescription analysis: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
