import { NextRequest, NextResponse } from "next/server";
import { msg91Service } from "@/lib/msg91-service";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, templateName, templateVariables } = body;

    // Validate required fields
    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "appointmentId is required" },
        { status: 400 }
      );
    }

    // Get template name from environment variable (required)
    const whatsappTemplateName = templateName || process.env.MSG91_WHATSAPP_TEMPLATE_NAME;
    
    if (!whatsappTemplateName) {
      return NextResponse.json(
        { success: false, error: "WhatsApp template name not configured. Please set MSG91_WHATSAPP_TEMPLATE_NAME environment variable." },
        { status: 500 }
      );
    }
    
    // Validate template variables (should have 2 variables)
    if (!templateVariables || !Array.isArray(templateVariables) || templateVariables.length < 2) {
      return NextResponse.json(
        { success: false, error: "templateVariables array with at least 2 variables is required" },
        { status: 400 }
      );
    }

    // Get appointment details to fetch patient phone number and prescription link
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (!appointment.patient?.phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Patient phone number not found" },
        { status: 400 }
      );
    }

    // Use existing prescription link if available (from when appointment was marked as completed)
    if (!appointment.prescriptionLink) {
      return NextResponse.json(
        { success: false, error: "Prescription PDF not available. Please complete the appointment first to generate the PDF." },
        { status: 400 }
      );
    }

    const pdfUrl = appointment.prescriptionLink;

    // Send WhatsApp message via MSG91
    const phoneNumber = appointment.patient.phoneNumber;
    const result = await msg91Service.sendWhatsAppMessage(
      phoneNumber,
      whatsappTemplateName,
      templateVariables,
      pdfUrl
    );

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Failed to send WhatsApp message",
          details: result.data 
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Prescription shared via WhatsApp successfully",
      data: {
        requestId: result.data?.request_id,
        phoneNumber: phoneNumber,
        pdfUrl: pdfUrl,
      },
    });
  } catch (error) {
    console.error("WhatsApp sharing error:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to share prescription via WhatsApp" 
      },
      { status: 500 }
    );
  }
}

