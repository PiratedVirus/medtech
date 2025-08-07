import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
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

    // Fetch lab tests with their parameters
    const labTests = await prisma.labTest.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        testResults: {
          where: {
            deletedAt: null,
          },
          include: {
            labAssignment: {
              include: {
                patient: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match frontend expectations
    const transformedTests = labTests.map((test) => {
      // Mock parameters for demonstration
      const parameters = [
        {
          id: 1,
          name: "Fasting Blood Sugar (FBS)",
          result: "75",
          unit: "mg/dL",
          normalRange: "70 - 99 mg/dL",
          isAbnormal: false,
        },
        {
          id: 2,
          name: "HbA1c",
          result: "5.8",
          unit: "%",
          normalRange: "4.0 - 5.6%",
          isAbnormal: true,
        },
      ];

      return {
        id: test.id,
        name: test.name,
        code: test.code,
        parameters,
      };
    });

    return NextResponse.json({
      success: true,
      tests: transformedTests,
    });
  } catch (error) {
    console.error("Error fetching lab tests:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const { name, code, description, parameters, normalRange, unit } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: "Test name and code are required" },
        { status: 400 }
      );
    }

    // Check if test code already exists
    const existingTest = await prisma.labTest.findUnique({
      where: { code },
    });

    if (existingTest) {
      return NextResponse.json(
        { error: "Test code already exists" },
        { status: 400 }
      );
    }

    // Create new lab test
    const labTest = await prisma.labTest.create({
      data: {
        name,
        code,
        description,
        parameters: parameters || [],
        normalRange: normalRange || {},
        unit,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      labTest,
    });
  } catch (error) {
    console.error("Error creating lab test:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 