import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: { testId: string } }
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

    const testId = parseInt(params.testId);

    if (isNaN(testId)) {
      return NextResponse.json(
        { error: "Invalid test ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { parameters, labAssignmentId } = body;

    // Validate required fields
    if (!parameters || !Array.isArray(parameters)) {
      return NextResponse.json(
        { error: "Parameters array is required" },
        { status: 400 }
      );
    }

    // Check if lab test exists
    const labTest = await prisma.labTest.findUnique({
      where: { id: testId },
    });

    if (!labTest) {
      return NextResponse.json(
        { error: "Lab test not found" },
        { status: 404 }
      );
    }

    // Update or create test results for each parameter
    const updatedResults = [];
    for (const parameter of parameters) {
      const { name, result, unit, normalRange, isAbnormal, remarks } = parameter;

      // Find existing test result or create new one
      let testResult = await prisma.testResult.findFirst({
        where: {
          labAssignmentId: labAssignmentId || 1, // Default assignment ID
          labTestId: testId,
          deletedAt: null,
        },
      });

      if (testResult) {
        // Update existing result
        testResult = await prisma.testResult.update({
          where: { id: testResult.id },
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
      } else {
        // Create new result
        testResult = await prisma.testResult.create({
          data: {
            labAssignmentId: labAssignmentId || 1, // Default assignment ID
            labTestId: testId,
            result,
            unit,
            normalRange,
            isAbnormal,
            remarks,
            reportedAt: new Date(),
            reportedBy: user.id,
          },
        });
      }

      updatedResults.push(testResult);
    }

    // Update lab assignment status to completed if all tests are done
    if (labAssignmentId) {
      await prisma.labAssignment.update({
        where: { id: labAssignmentId },
        data: { status: "COMPLETED" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Test results updated successfully",
      results: updatedResults,
    });
  } catch (error) {
    console.error("Error updating test results:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 