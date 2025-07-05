import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.doctorProfile?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    const [totalSlots, bookedSlots] = await prisma.$transaction([
      prisma.doctorAvailability.count({ where: { userId, deletedAt: null } }),
      prisma.appointment.count({
        where: { userId, deletedAt: null },
      }),
    ]);

    return NextResponse.json({ totalSlots, bookedSlots });
  } catch (error) {
    console.error("Error fetching slot summary:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
