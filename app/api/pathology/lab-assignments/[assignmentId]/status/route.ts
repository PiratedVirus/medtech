import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: { assignmentId: string } }
) {
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

    const assignmentId = parseInt(params.assignmentId);
    if (isNaN(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, remarks } = body;

    // Validate status
    const validStatuses = [
      "PENDING",
      "ASSIGNED",
      "PHLEBOTOMIST_LEFT",
      "SAMPLE_COLLECTED",
      "IN_LAB",
      "ANALYZING",
      "COMPLETED",
      "CANCELLED"
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Check if assignment exists
    const existingAssignment = await prisma.labAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { error: "Lab assignment not found" },
        { status: 404 }
      );
    }

    // Update assignment status
    const updatedAssignment = await prisma.labAssignment.update({
      where: { id: assignmentId },
      data: {
        status,
        ...(status === "SAMPLE_COLLECTED" && { 
          sampleCollected: true,
          sampleCollectedAt: new Date()
        }),
        ...(remarks && { remarks }),
      },
      include: {
        patient: {
          select: { name: true }
        },
        phlebotomist: {
          select: {
            user: { select: { name: true } }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Assignment status updated successfully",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Error updating assignment status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 