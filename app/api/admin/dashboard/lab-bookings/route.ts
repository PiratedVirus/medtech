import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [labBookings, total] = await prisma.$transaction([
      prisma.labBooking.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
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
            },
          },
        },
      }),
      prisma.labBooking.count(),
    ]);

    return NextResponse.json({
      data: labBookings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lab bookings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updated = await prisma.labBooking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lab booking" }, { status: 500 });
  }
}
