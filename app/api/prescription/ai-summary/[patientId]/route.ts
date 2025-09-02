import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId: patientIdParam } = await params;
    const patientId = parseInt(patientIdParam);
    
    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    // Get the patient's AI summary
    const aiSummary = await prisma.patientAISummary.findUnique({
      where: { patientId },
      include: {
        patient: {
          select: {
            name: true,
            phoneNumber: true
          }
        }
      }
    });

    if (!aiSummary) {
      return NextResponse.json({
        success: false,
        error: "No AI summary found for this patient",
        data: null
      }, { status: 404 });
    }

    // Get prescription count and last prescription date
    const prescriptionCount = await prisma.prescriptionText.count({
      where: {
        patientId,
        processingStatus: 'COMPLETED'
      }
    });

    const lastPrescription = await prisma.prescriptionText.findFirst({
      where: {
        patientId,
        processingStatus: 'COMPLETED'
      },
      orderBy: { createdAt: 'desc' },
      select: { processedAt: true }
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: aiSummary.summaryText,
        keyFindings: aiSummary.keyFindings,
        recommendations: aiSummary.recommendations,
        urgency: aiSummary.urgency,
        lastUpdated: aiSummary.lastUpdated,
        prescriptionCount: aiSummary.prescriptionCount,
        llmModel: aiSummary.llmModel,
        patientName: aiSummary.patient.name,
        patientPhone: aiSummary.patient.phoneNumber,
        totalPrescriptions: prescriptionCount,
        lastPrescriptionDate: lastPrescription?.processedAt
      }
    });

  } catch (error) {
    console.error("[AI-SUMMARY-API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId: patientIdParam } = await params;
    const patientId = parseInt(patientIdParam);
    const body = await request.json();
    const { force = false } = body;
    
    if (isNaN(patientId)) {
      return NextResponse.json(
        { success: false, error: "Invalid patient ID" },
        { status: 400 }
      );
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
      return NextResponse.json({
        success: false,
        error: "No prescription texts available for summary generation"
      }, { status: 404 });
    }

    // Filter out any null extractedText values
    const validPrescriptionTexts = prescriptionTexts.filter(pt => pt.extractedText !== null);

    if (validPrescriptionTexts.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No valid prescription texts available for summary generation"
      }, { status: 404 });
    }

    // Import the unified LLM service
    const { generatePrescriptionSummary } = await import('@/lib/llm/unified-service');
    
    const texts = validPrescriptionTexts.map(pt => pt.extractedText!);
    
    // Generate comprehensive patient summary
    const summaryResult = await generatePrescriptionSummary(texts, apiKey);

    // summaryResult is of type SummaryResult; errors will throw and be caught below

    // Store or update patient AI summary
    const updatedSummary = await prisma.patientAISummary.upsert({
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

    return NextResponse.json({
      success: true,
      message: "AI summary generated successfully",
      data: {
        summary: updatedSummary.summaryText,
        keyFindings: updatedSummary.keyFindings,
        recommendations: updatedSummary.recommendations,
        urgency: updatedSummary.urgency,
        lastUpdated: updatedSummary.lastUpdated,
        prescriptionCount: updatedSummary.prescriptionCount
      }
    });

  } catch (error) {
    console.error("[AI-SUMMARY-API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
