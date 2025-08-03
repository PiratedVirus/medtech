import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { patientId: string } }
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

    const patientId = parseInt(params.patientId);

    if (isNaN(patientId)) {
      return NextResponse.json(
        { error: "Invalid patient ID" },
        { status: 400 }
      );
    }

    // Fetch patient details with lab assignments
    const patient = await prisma.user.findUnique({
      where: {
        id: patientId,
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
            dateOfBirth: true,
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
                    id: true,
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
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Transform patient data
    const transformedPatient = {
      id: patient.id,
      name: patient.name,
      patientId: `ABC${patient.id.toString().padStart(5, '0')}`,
      gender: patient.patientProfile?.gender || "Not specified",
      mobile: patient.phoneNumber,
      address: patient.patientProfile?.address || "Patient Address, Display here.",
      lastVisit: patient.patientProfile?.dateOfBirth 
        ? new Date(patient.patientProfile.dateOfBirth).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric"
          })
        : "20th Oct 2024",
      plan: "BASIC", // This would come from the actual subscription/plan
    };

    // Transform lab assignment data
    const labAssignment = patient.labAssignments[0] ? {
      id: patient.labAssignments[0].id,
      status: patient.labAssignments[0].status,
      assignedDate: patient.labAssignments[0].assignedDate.toISOString().split('T')[0],
      assignedTime: patient.labAssignments[0].assignedTime,
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 4 days from now
      phlebotomist: {
        user: {
          name: patient.labAssignments[0].phlebotomist.user.name,
        },
      },
    } : null;

    return NextResponse.json({
      success: true,
      patient: transformedPatient,
      labAssignment,
    });
  } catch (error) {
    console.error("Error fetching patient details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 