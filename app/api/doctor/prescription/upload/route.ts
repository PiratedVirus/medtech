import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Upload request body:", { appointmentId: body.appointmentId, pdfLength: body.pdf?.length });
    
    const { appointmentId, pdf } = body;

    if (!appointmentId || !pdf) {
      return NextResponse.json(
        { success: false, error: "appointmentId and pdf are required" },
        { status: 400 }
      );
    }

    if (typeof pdf !== 'string') {
      return NextResponse.json(
        { success: false, error: "PDF data must be a string" },
        { status: 400 }
      );
    }

    if (pdf.length === 0) {
      return NextResponse.json(
        { success: false, error: "PDF data is empty" },
        { status: 400 }
      );
    }

    console.log("Creating buffer from base64...");
    let pdfBuffer;
    try {
      pdfBuffer = Buffer.from(pdf, "base64");
      console.log("Buffer created, length:", pdfBuffer.length);
    } catch (bufferError) {
      console.error("Buffer creation error:", bufferError);
      return NextResponse.json(
        { success: false, error: "Invalid PDF data format" },
        { status: 400 }
      );
    }
    
    if (pdfBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid PDF data" },
        { status: 400 }
      );
    }

    console.log("Uploading to Vercel Blob...");
    console.log("Buffer details:", { length: pdfBuffer.length, type: typeof pdfBuffer });
    
    // Generate unique filename
    const fileName = `prescription-${appointmentId}-${Date.now()}.pdf`;
    
    let blob;
    try {
      blob = await put(
        `prescriptions/${fileName}`,
        pdfBuffer,
        { 
          access: "public", 
          contentType: "application/pdf",
          allowOverwrite: true
        }
      );
      console.log("Blob uploaded successfully:", blob.url);
    } catch (putError) {
      console.error("Vercel Blob put error:", putError);
      return NextResponse.json(
        { success: false, error: "Failed to upload to blob storage" },
        { status: 500 }
      );
    }

    try {
      await prisma.appointment.update({
        where: { id: parseInt(appointmentId) },
        data: { prescriptionLink: blob.url },
      });
      console.log("Prescription link updated successfully");
    } catch (updateError) {
      console.error("Failed to update appointment:", updateError?.message || 'Unknown error');
      return NextResponse.json(
        { success: false, error: "Failed to update prescription link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("PDF upload error:", error?.message || error?.toString() || 'Unknown error');
    return NextResponse.json(
      { success: false, error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
