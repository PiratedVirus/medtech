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

    // Fetch all patients with their lab assignments
    const patients = await prisma.user.findMany({
      where: {
        role: "PATIENT",
        deletedAt: null,
      },
      include: {
        patientProfile: {
          select: {
            id: true,
            age: true,
            gender: true,
            address: true,
            bloodGroup: true,
          },
        },
        labAssignments: {
          where: {
            deletedAt: null,
          },
          include: {
            phlebotomist: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1, // Get the latest assignment
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match the frontend expectations
    const transformedPatients = patients.map((patient) => {
      const latestAssignment = patient.labAssignments[0];
      const sampleStatus = latestAssignment?.sampleCollected ? "Collected" : "Not Collected";
      
      return {
        id: patient.id,
        name: patient.name,
        address: patient.patientProfile?.address || "Patient Address Displays Here..",
        mobileNumber: patient.phoneNumber,
        sampleStatus,
        status: latestAssignment ? "Phlebotomist Sent" : "Pending",
        testsOrdered: "PRO", // This would come from the actual lab booking/plan
        assignedPhlebotomist: latestAssignment?.phlebotomist?.employeeId,
      };
    });

    return NextResponse.json({
      success: true,
      patients: transformedPatients,
    });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 