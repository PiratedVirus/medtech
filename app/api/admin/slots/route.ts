import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeStatus } from "@/lib/utils/status";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const doctorId = parseInt(searchParams.get("doctorId") || "0");

    let where: any = {};
    
      if (doctorId) {
    where.userId = doctorId;
  }

    const [slots, total] = await prisma.$transaction([
      prisma.doctorAvailability.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        include: {
          doctor: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }),
      prisma.doctorAvailability.count({ where })
    ]);

    const transformedSlots = slots.map(slot => ({
      ...slot,
      doctorName: slot.doctor.user.name,
      doctor: undefined
    }));

    return NextResponse.json({
      data: transformedSlots,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch doctor availability slots" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log("Daata for slot booking is ", data);
    const to24h = (t: string) => {
      if (!t) return t;
      const m12 = t.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
      if (m12) {
        let h = parseInt(m12[1], 10);
        const mm = m12[2];
        const ap = m12[3].toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2,'0')}:${mm}`;
      }
      return t;
    };
    const doctorId = Number(data.doctorId);
    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return NextResponse.json({ error: "Invalid or missing doctorId" }, { status: 400 });
    }

    const newSlot = await prisma.doctorAvailability.create({
      data: {
        userId: Number(data.doctorId),
        date: new Date(data.date),
        startTime: to24h(data.startTime),
        endTime: to24h(data.endTime),
        status: normalizeStatus(data.status)
      }
    });

    return NextResponse.json(
      { data: newSlot, message: "Availability slot created successfully" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create availability slot " + error },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    const data = await request.json();

    const dateInUTC = new Date(data.date).toISOString();
    const to24h = (t: string) => {
      if (!t) return t;
      const m12 = t.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
      if (m12) {
        let h = parseInt(m12[1], 10);
        const mm = m12[2];
        const ap = m12[3].toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2,'0')}:${mm}`;
      }
      return t;
    };

    const updatedSlot = await prisma.doctorAvailability.update({
      where: { id },
      data: {
        userId: data.doctorId,
        date: new Date(data.date),
        startTime: to24h(data.startTime),
        endTime: to24h(data.endTime),
        status: normalizeStatus(data.status)
      }
    });

    return NextResponse.json(
      { data: updatedSlot, message: "Availability slot updated successfully" }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update availability slot" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    await prisma.doctorAvailability.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Availability slot deleted successfully" }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete availability slot" },
      { status: 500 }
    );
  }
}