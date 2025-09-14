import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Optimized appointments API with proper includes to avoid N+1 queries
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              doctorProfile: {
                select: { 
                  meetingRoomLink: true, 
                  ownerToken1: true 
                }
              }
            }
          },
          patient: {
            select: {
              id: true,
              name: true,
              phoneNumber: true
            }
          },
          doctorAvailability: { 
            select: { 
              date: true, 
              startTime: true, 
              endTime: true 
            } 
          }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.count(),
    ]);

    // Transform appointments with meeting links already included
    const transformedAppointments = appointments.map((appointment) => ({
      id: appointment.id,
      patient: appointment.patient,
      doctor: appointment.doctor,
      consultationType: appointment.consultationType,
      status: appointment.status,
      isDietician: appointment.isDietician,
      prescriptionLink: appointment.prescriptionLink,
      appointmentFor: appointment.appointmentFor,
      doctorAvailability: appointment.doctorAvailability,
      // Add the fields that the frontend expects
      fullName: appointment.patient?.name || '',
      doctorName: appointment.doctor?.name || '',
      userId: appointment.doctor?.id || null,
      doctorAvailabilityId: appointment.doctorAvailabilityId,
      startTime: appointment.doctorAvailability?.startTime || '',
      endTime: appointment.doctorAvailability?.endTime || '',
      // Meeting room info is now included in the initial query
      meetingRoomLink: appointment.consultationType === "Video" 
        ? appointment.doctor?.doctorProfile?.meetingRoomLink 
        : null,
      ownerToken1: appointment.consultationType === "Video" 
        ? appointment.doctor?.doctorProfile?.ownerToken1 
        : null,
      createdAt: appointment.createdAt,
    }));

    return NextResponse.json({
      data: transformedAppointments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Optimized appointments query error:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}
