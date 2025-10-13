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
      console.error("Failed to update appointment:", updateError instanceof Error ? updateError.message : 'Unknown error');
      return NextResponse.json(
        { success: false, error: "Failed to update prescription link" },
        { status: 500 }
      );
    }

    // Trigger background processing of the prescription PDF
    try {
      // Get appointment details for background processing
      const appointment = await prisma.appointment.findUnique({
        where: { id: parseInt(appointmentId) },
        include: {
          prescription: true
        }
      });

      if (appointment?.prescription?.id) {
        // Trigger background processing asynchronously
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/prescription/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: appointmentId,
            pdfUrl: blob.url,
            patientId: appointment.patientId,
            prescriptionId: appointment.prescription.id
          }),
        }).catch(error => {
          console.error("Background processing trigger failed:", error);
          // Don't fail the upload if background processing fails
        });
        
        console.log("Background processing triggered for prescription:", appointment.prescription.id);
      }
    } catch (processingError) {
      console.error("Failed to trigger background processing:", processingError);
      // Don't fail the upload if background processing setup fails
    }

    return NextResponse.json({ success: true, url: blob.url });
  } catch (error) {
    console.error("PDF upload error:", error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { success: false, error: "Failed to upload PDF" },
      { status: 500 }
    );
  }
}
