import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";
import React from "react";
import { pdf } from "@react-pdf/renderer";
import PrescriptionPDF from "@/components/prescription/PrescriptionPDF";


export async function POST(request: NextRequest) {
  try {
    const { appointmentId, prescriptionData, patientInfo, doctorInfo, clinicInfo, visibleSections } = await request.json();

    if (!appointmentId || !prescriptionData || !patientInfo || !doctorInfo || !clinicInfo) {
      return NextResponse.json(
        { success: false, error: "All required data is needed" },
        { status: 400 }
      );
    }

    // Render PDF using react-pdf
    const docElement = React.createElement(PrescriptionPDF, {
      prescriptionData,
      patientInfo,
      doctorInfo,
      clinicInfo,
      visibleSections,
    });

    const pdfBlob = await pdf(docElement).toBlob();
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // Generate unique filename
    const fileName = `prescription-${appointmentId}-${Date.now()}.pdf`;

    // Upload to Vercel Blob
    const blob = await put(
      `prescriptions/${fileName}`,
      pdfBuffer,
      { 
        access: "public", 
        contentType: "application/pdf",
        allowOverwrite: true
      }
    );

    // Update appointment with the PDF link
    const updatedAppointment = await prisma.appointment.update({
      where: { id: parseInt(appointmentId) },
      data: { prescriptionLink: blob.url },
    });

    return NextResponse.json({ 
      success: true, 
      data: { 
        appointment: updatedAppointment,
        pdfUrl: blob.url 
      } 
    });
  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
