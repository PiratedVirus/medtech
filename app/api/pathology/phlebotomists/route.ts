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

    // Fetch all phlebotomists
    const phlebotomists = await prisma.phlebotomist.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      phlebotomists,
    });
  } catch (error) {
    console.error("Error fetching phlebotomists:", error);
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
    const { userId, employeeId, specialization, currentLocation } = body;

    // Validate required fields
    if (!userId || !employeeId) {
      return NextResponse.json(
        { error: "User ID and Employee ID are required" },
        { status: 400 }
      );
    }

    // Check if employee ID already exists
    const existingPhlebotomist = await prisma.phlebotomist.findUnique({
      where: { employeeId },
    });

    if (existingPhlebotomist) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 400 }
      );
    }

    // Create new phlebotomist
    const phlebotomist = await prisma.phlebotomist.create({
      data: {
        userId,
        employeeId,
        specialization,
        currentLocation,
        isAvailable: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      phlebotomist,
    });
  } catch (error) {
    console.error("Error creating phlebotomist:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 