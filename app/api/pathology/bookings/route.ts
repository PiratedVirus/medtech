import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { getSubdomainClinicFromRequest } from "@/lib/clinic-auth";
import { tokenUserWhere } from "@/lib/clinic-auth";

export async function GET(request: NextRequest) {
  try {
    // Get clinic ID from subdomain for multi-tenancy
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);
    
    if (!subdomainClinicId) {
      return NextResponse.json({ success: false, error: "Clinic not found" }, { status: 404 });
    }

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
    // Verify user belongs to current clinic
    if (!user || user.role !== "PATHOLOGY" || user.clinicId !== subdomainClinicId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch lab bookings for the current clinic only
    const labBookings = await prisma.labBooking.findMany({
      where: {
        deletedAt: null,
        // Filter by patient's clinic
        patient: {
          clinicId: subdomainClinicId,
          deletedAt: null,
        },
        // Also ensure lab package belongs to the clinic
        labPackage: {
          clinicId: subdomainClinicId,
          deletedAt: null,
        },
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
        labPackage: {
          select: {
            id: true,
            name: true,
            price: true,
          },
        },
        labAssignments: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Transform the data to match frontend expectations
    const transformedBookings = labBookings.map((booking) => {
      const latestAssignment = booking.labAssignments[0];
      
      return {
        id: booking.id,
        bookingId: booking.id,
        patientId: booking.patientId,
        patientName: booking.patient.name,
        fullName: booking.fullName,
        mobile: booking.mobile,
        email: booking.email,
        address: booking.address,
        labPackageName: booking.labPackage.name,
        labPackagePrice: booking.labPackage.price,
        paymentOption: booking.paymentOption,
        status: booking.status,
        labDate: booking.labDate,
        sampleStatus: latestAssignment?.sampleCollected ? "Collected" : "Not Collected",
        assignedPhlebotomist: latestAssignment?.phlebotomist?.user?.name || null,
        assignmentStatus: latestAssignment?.status || "Unassigned",
        createdAt: booking.createdAt,
        labResult: booking.labResult || [],
      };
    });

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
    });
  } catch (error) {
    console.error("Error fetching lab bookings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}