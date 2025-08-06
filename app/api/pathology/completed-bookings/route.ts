import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const completedBookings = await prisma.labBooking.findMany({
      where: {
        status: "COMPLETED", // Using single status
        deletedAt: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
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
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        labDate: "desc",
      },
    });

    const transformedBookings = completedBookings.map((booking) => ({
      id: booking.id,
      patient: {
        name: booking.patient.name,
      },
      labBooking: {
        id: booking.id,
        labPackageId: booking.labPackageId,
        appointmentFor: booking.appointmentFor,
        fullName: booking.fullName,
        mobile: booking.mobile,
        email: booking.email,
        address: booking.address,
        paymentOption: booking.paymentOption,
        status: booking.status, // Single status
        labDate: booking.labDate,
        labResult: booking.labResult || [],
        labPackage: {
          id: booking.labPackage.id,
          name: booking.labPackage.name,
          price: booking.labPackage.price,
        },
      },
      assignedDate: booking.labAssignments[0]?.assignedDate || booking.labDate,
      assignedTime: booking.labAssignments[0]?.assignedTime || "09:00",
      status: booking.status, // Single status
      sampleCollected: booking.labAssignments[0]?.sampleCollected || false,
      phlebotomist: booking.labAssignments[0]?.phlebotomist || null,
    }));

    return NextResponse.json({
      success: true,
      completedBookings: transformedBookings,
    });
  } catch (error) {
    console.error("Error fetching completed bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch completed bookings" },
      { status: 500 }
    );
  }
} 