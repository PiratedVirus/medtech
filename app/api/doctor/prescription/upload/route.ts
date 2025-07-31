import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, pdf } = await request.json();

    if (!appointmentId || !pdf) {
      return NextResponse.json(
        { success: false, error: "appointmentId and pdf are required" },
        { status: 400 }
      );
    }

    const pdfBuffer = Buffer.from(pdf, "base64");
    const blob = await put(
      `prescriptions/${appointmentId}.pdf`,
      pdfBuffer,
      { access: "public", contentType: "application/pdf" }
    );

    const updatedPrescription = await prisma.prescription.update({
      where: { appointmentId: parseInt(appointmentId) },
      data: { prescriptionLink: blob.url },
    });

    return NextResponse.json({ success: true, data: updatedPrescription });
  } catch (error) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
