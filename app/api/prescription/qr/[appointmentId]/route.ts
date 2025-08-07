import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;

    if (!appointmentId) {
      return NextResponse.json(
        { success: false, error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    // Fetch the appointment with prescription link
    const appointment = await prisma.appointment.findUnique({
      where: { id: parseInt(appointmentId) },
      select: { 
        prescriptionLink: true,
        patient: {
          select: {
            name: true,
            phoneNumber: true
          }
        },
        doctor: {
          select: {
            name: true
          }
        }
      }
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    if (!appointment.prescriptionLink) {
      return NextResponse.json(
        { success: false, error: "Prescription not available yet" },
        { status: 404 }
      );
    }

    // Redirect directly to the PDF
    return NextResponse.redirect(appointment.prescriptionLink);

  } catch (error) {
    console.error("QR redirect error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process QR code request" },
      { status: 500 }
    );
  }
}