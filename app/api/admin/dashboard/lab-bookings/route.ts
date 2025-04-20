import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const labBookings = await prisma.labBooking.findMany({
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
    });
    return NextResponse.json(labBookings);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lab bookings" }, { status: 500 });
  }
}
