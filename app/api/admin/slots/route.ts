import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const doctorId = parseInt(searchParams.get("doctorId") || "0");
    const checkAvailability = searchParams.get("checkAvailability") === "true";
    let where = {};
    if (checkAvailability) {
      where = {
        status: "available",
      };
    }
    if (doctorId) {
      where = {
        ...where,
        doctorId,
      };
    }

    const [slots, total] = await prisma.$transaction([
      prisma.doctorAvailability.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        include: {
          doctor: {
            select: {
                user: { select: { name: true } },
            },
          },
        },
      }),
      prisma.doctorAvailability.count(),
    ]);

    const transformedAppointments = slots.map((appt) => ({
        ...appt,
        doctorName: appt.doctor?.user?.name,
        // Optionally remove the nested doctor field if not needed
        doctor: undefined,
      }));

    return NextResponse.json({
      data: transformedAppointments,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch doctorAvailability" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const clinic = await prisma.clinic.create({ data });
    return NextResponse.json({ data: clinic, message: "Clinic created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create clinic" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const clinic = await prisma.clinic.update({
      where: { id },
      data,
    });
    return NextResponse.json({ data: clinic, message: "Clinic updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update clinic" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.clinic.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Clinic deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete clinic" }, { status: 500 });
  }
}
