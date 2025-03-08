import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
          doctor: { select: { name: true } },
          doctorAvailability: { select: { date: true, startTime: true, endTime: true } }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.appointment.count(),
    ]);

    return NextResponse.json({
      data: appointments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Ensure doctorAvailabilityId exists and is available
    const availability = await prisma.doctorAvailability.findUnique({
      where: { id: data.doctorAvailabilityId, status: "available" }
    });

    if (!availability) {
      return NextResponse.json({ error: "Invalid or unavailable appointment slot" }, { status: 400 });
    }

    const appointment = await prisma.appointment.create({
      data
    });

    return NextResponse.json({ data: appointment, message: "Appointment created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();

    // Ensure doctorAvailabilityId exists and is available
    const availability = await prisma.doctorAvailability.findUnique({
      where: { id: data.doctorAvailabilityId, status: "available" }
    });

    if (!availability) {
      return NextResponse.json({ error: "Invalid or unavailable appointment slot" }, { status: 400 });
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data
    });

    return NextResponse.json({ data: appointment, message: "Appointment updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.appointment.delete({ where: { id } });
    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}