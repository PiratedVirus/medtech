import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const userId = parseInt(searchParams.get("userId") || "0");

    let where: any = {};
    
    if (userId) {
      where.userId = userId;
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
    
    const newSlot = await prisma.doctorAvailability.create({
      data: {
        userId: Number(data.userId),
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status
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

    const updatedSlot = await prisma.doctorAvailability.update({
      where: { id },
      data: {
        userId: data.userId,
        date: new Date(data.date),
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status
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