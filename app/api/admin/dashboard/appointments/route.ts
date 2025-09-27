import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current date and time for filtering truly upcoming appointments
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    today.setHours(0, 0, 0, 0);

    // Create clinic filter
    const userClinicFilter = createUserClinicFilter(clinicId);

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorAvailability: {
          date: {
            gte: today
          }
        },
        status: {
          notIn: ["Cancelled", "Completed"]
        },
        doctor: userClinicFilter.user
      },
      select: {
        id: true,
        status: true,
        isDietician: true,
        consultationType: true,
        patient: {
          select: {
            id: true,
            name: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
        doctorAvailability: {
          select: {
            date: true,
            startTime: true,
            endTime: true,
          }
        }
      },
      orderBy: [
        {
          doctorAvailability: {
            date: 'asc'
          }
        },
        {
          doctorAvailability: {
            startTime: 'asc'
          }
        }
      ],
      take: 10
    });

    // Additional filter to ensure we only show truly upcoming appointments
    const filteredAppointments = appointments.filter(apt => {
      if (!apt.doctorAvailability?.date) return false;
      
      const appointmentDate = new Date(apt.doctorAvailability.date);
      const appointmentTime = apt.doctorAvailability?.startTime || "00:00";
      
      // Parse the time
      const [hours, minutes] = appointmentTime.split(':').map(Number);
      appointmentDate.setHours(hours, minutes, 0, 0);
      
      // Only include if appointment is in the future (including today's future appointments)
      return appointmentDate >= now;
    });

    return NextResponse.json(filteredAppointments);
  } catch (error) {
    console.error("Failed to fetch appointments:", error);
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { appointmentId, link } = await request.json();
    if (!appointmentId || !link) {
      return NextResponse.json({ error: "Missing appointmentId or link" }, { status: 400 });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { prescriptionLink: link }
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Failed to update appointment link:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
