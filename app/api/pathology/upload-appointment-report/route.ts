import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const appointmentId = formData.get("appointmentId") as string;
    const patientName = formData.get("patientName") as string;

    if (!file || !appointmentId) {
      return NextResponse.json(
        { error: "File and appointment ID are required" },
        { status: 400 }
      );
    }

    // Upload file to Vercel Blob
    const arrayBuffer = await file.arrayBuffer();
    const fileName = `${patientName?.replace(/\s+/g, "-")}-appointment-${appointmentId}-${file.name}`;

    const { url } = await put(fileName, arrayBuffer, {
      access: "public",
      token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
    });

    // Save report record to database
    const report = await prisma.appointmentReport.create({
      data: {
        appointmentId: parseInt(appointmentId),
        fileName: file.name,
        fileUrl: url,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date(),
      },
    });

    // Update appointment status if needed
    await prisma.appointment.update({
      where: { id: parseInt(appointmentId) },
      data: { 
        status: "COMPLETED",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      reportId: report.id,
      fileUrl: url,
      message: "Report uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading appointment report:", error);
    return NextResponse.json(
      { error: "Failed to upload report" },
      { status: 500 }
    );
  }
}