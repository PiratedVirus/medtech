import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const bookingId = formData.get("bookingId") as string;
    const patientName = formData.get("patientName") as string;

    if (!files || files.length === 0 || !bookingId) {
      return NextResponse.json(
        { error: "Files and booking ID are required" },
        { status: 400 }
      );
    }

    const uploadedUrls: string[] = [];

    // Upload each file to Vercel Blob
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const fileName = `${patientName?.replace(/\s+/g, "-")}-lab-${bookingId}-${file.name}`;

      const { url } = await put(fileName, arrayBuffer, {
        access: "public",
        token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
      });

      uploadedUrls.push(url);
    }

    // Update lab booking with the uploaded report URLs
    const labBooking = await prisma.labBooking.findUnique({
      where: { id: parseInt(bookingId) },
    });

    if (!labBooking) {
      return NextResponse.json(
        { error: "Lab booking not found" },
        { status: 404 }
      );
    }

    // Add new URLs to existing labResult array
    const currentResults = labBooking.labResult || [];
    const updatedResults = [...currentResults, ...uploadedUrls];

    await prisma.labBooking.update({
      where: { id: parseInt(bookingId) },
      data: {
        labResult: updatedResults,
        status: "COMPLETED", // Mark as completed when reports are uploaded
        pathologyStatus: "COMPLETED",
      },
    });

    return NextResponse.json({
      success: true,
      uploadedUrls,
      message: "Lab reports uploaded successfully",
    });
  } catch (error) {
    console.error("Error uploading lab reports:", error);
    return NextResponse.json(
      { error: "Failed to upload lab reports" },
      { status: 500 }
    );
  }
} 