import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const completedAssignments = await prisma.labAssignment.findMany({
      where: {
        status: "COMPLETED", // Using LabAssignment status
        deletedAt: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        phlebotomist: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        labBooking: {
          include: {
            labPackage: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
            payment: {
              select: {
                id: true,
                amount: true,
                paymentStatus: true,
                paymentMethod: true,
                currency: true,
              },
            },
          },
        },
      },
      orderBy: {
        assignedDate: "desc",
      },
    });

    const transformedBookings = completedAssignments.map((assignment) => ({
      id: assignment.id,
      labBookingId: assignment.labBookingId,
      patient: {
        name: assignment.patient.name,
      },
      labBooking: assignment.labBooking ? {
        id: assignment.labBooking.id,
        labPackageId: assignment.labBooking.labPackageId,
        appointmentFor: assignment.labBooking.appointmentFor,
        fullName: assignment.labBooking.fullName,
        mobile: assignment.labBooking.mobile,
        email: assignment.labBooking.email,
        address: assignment.labBooking.address,
        paymentOption: assignment.labBooking.paymentOption,
        status: assignment.labBooking.status,
        labDate: assignment.labBooking.labDate,
        labResult: assignment.labBooking.labResult || [],
        labPackage: assignment.labBooking.labPackage ? {
          id: assignment.labBooking.labPackage.id,
          name: assignment.labBooking.labPackage.name,
          price: assignment.labBooking.labPackage.price,
        } : null,
        payment: assignment.labBooking.payment,
      } : null,
      assignedDate: assignment.assignedDate,
      assignedTime: assignment.assignedTime,
      status: assignment.status,
      sampleCollected: assignment.sampleCollected,
      phlebotomist: assignment.phlebotomist,
    }));

    return NextResponse.json({
      success: true,
      bookings: transformedBookings,
    });
  } catch (error) {
    console.error("Error fetching completed assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch completed assignments" },
      { status: 500 }
    );
  }
} 