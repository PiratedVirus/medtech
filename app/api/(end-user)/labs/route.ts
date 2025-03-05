import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    console.log("POST /api/lab-bookings called");
    const body = await request.json();
    console.log("Request body:", body);

    const {
      appointmentFor,
      fullName,
      mobile,
      email,
      date,
      address,
      packageId,
      patientId,
      paymentOption,
      razorpayResponse,
    } = body;

    if (!patientId || !packageId) {
      console.error("Missing required fields", { patientId, packageId });
      return NextResponse.json(
        { success: false, error: "Missing required fields: patientId, packageId" },
        { status: 400 }
      );
    }

    // Create the lab booking
    const newLabBooking = await prisma.labBooking.create({
      data: {
        patientId,
        labTechId: 1,
        labPackageId: 1,
        labDate: new Date(date),
        status: "Scheduled",
      },
    });

    console.log("Lab booking created successfully with ID:", newLabBooking.id);

    return NextResponse.json({ success: true, labBooking: newLabBooking });
  } catch (error) {
    console.error("Error creating lab booking:", error);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}