import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
    if (!phoneNumber) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const user = await prisma.user.findFirst({
      where: { phoneNumber },
    });
    if (!user || user.role !== "PATHOLOGY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { patientId, phlebotomistId, labId, assignedDate, assignedTime, appointmentId } = body;

    // Validate required fields
    if (!patientId || !phlebotomistId) {
      return NextResponse.json(
        { error: "Patient ID and Phlebotomist ID are required" },
        { status: 400 }
      );
    }

    // Check if patient exists
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Check if phlebotomist exists
    const phlebotomist = await prisma.phlebotomist.findUnique({
      where: { id: phlebotomistId },
    });

    if (!phlebotomist) {
      return NextResponse.json(
        { error: "Phlebotomist not found" },
        { status: 404 }
      );
    }

    // Check if there's already an active assignment for this patient
    const existingAssignment = await prisma.labAssignment.findFirst({
      where: {
        patientId,
        status: {
          in: ["PENDING", "ASSIGNED", "PHLEBOTOMIST_LEFT", "SAMPLE_COLLECTED", "IN_LAB", "ANALYZING"],
        },
        deletedAt: null,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Patient already has an active lab assignment" },
        { status: 400 }
      );
    }

    // Create lab assignment
    const labAssignment = await prisma.labAssignment.create({
      data: {
        patientId,
        phlebotomistId,
        labId: labId || 1, // Default lab ID, should be configurable
        appointmentId,
        assignedDate: assignedDate ? new Date(assignedDate) : new Date(),
        assignedTime: assignedTime || "09:00",
        status: "ASSIGNED",
        sampleCollected: false,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        phlebotomist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Update phlebotomist availability
    await prisma.phlebotomist.update({
      where: { id: phlebotomistId },
      data: { isAvailable: false },
    });

    return NextResponse.json({
      success: true,
      labAssignment,
    });
  } catch (error) {
    console.error("Error assigning phlebotomist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 