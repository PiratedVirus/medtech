import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { tokenUserWhere } from "@/lib/clinic-auth";

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
      where: await tokenUserWhere(decoded),
    });
    if (!user || user.role !== "PATHOLOGY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all lab assignments
    const labAssignments = await prisma.labAssignment.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
            email: true,
          },
        },
        phlebotomist: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
              },
            },
          },
        },
        lab: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentFor: true,
            doctorAvailability: { select: { date: true } },
          },
        },
        labBooking: {
          select: {
            id: true,
            labPackageId: true,
            appointmentFor: true,
            fullName: true,
            mobile: true,
            email: true,
            address: true,
            paymentOption: true,
            status: true,
            labDate: true,
            labResult: true,
            labPackage: {
              select: {
                id: true,
                name: true,
                price: true,
              }
            }
          }
        },
        testResults: {
          include: {
            labTest: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      assignments: labAssignments,
    });
  } catch (error) {
    console.error("Error fetching lab assignments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 