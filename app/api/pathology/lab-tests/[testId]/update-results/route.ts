import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { tokenUserWhere } from "@/lib/clinic-auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ testId: string }> }
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
      where: await tokenUserWhere(decoded),
    });
    if (!user || user.role !== "PATHOLOGY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resolvedParams = await params;
    const testId = parseInt(resolvedParams.testId);
    if (isNaN(testId)) {
      return NextResponse.json(
        { error: "Invalid test ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { result, unit, normalRange, isAbnormal, remarks, reportUrl } = body;

    // Check if test result exists
    const existingTestResult = await prisma.testResult.findUnique({
      where: { id: testId },
      include: {
        labAssignment: {
          include: {
            labBooking: true
          }
        }
      }
    });

    if (!existingTestResult) {
      return NextResponse.json(
        { error: "Test result not found" },
        { status: 404 }
      );
    }

    // Update test result
    const updatedTestResult = await prisma.testResult.update({
      where: { id: testId },
      data: {
        result,
        unit,
        normalRange,
        isAbnormal,
        remarks,
        reportedAt: new Date(),
        reportedBy: user.id,
      },
    });

    // Sync with LabBooking if it exists and reportUrl is provided
    if (existingTestResult.labAssignment?.labBooking && reportUrl) {
      const labBooking = existingTestResult.labAssignment.labBooking;
      const currentResults = labBooking.labResult || [];
      
      // Add new report URL if not already present
      if (!currentResults.includes(reportUrl)) {
        await prisma.labBooking.update({
          where: { id: labBooking.id },
          data: {
            labResult: [...currentResults, reportUrl]
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Test result updated successfully",
      testResult: updatedTestResult,
    });
  } catch (error) {
    console.error("Error updating test result:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 