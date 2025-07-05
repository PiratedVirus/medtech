import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
    if (!phoneNumber) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { phoneNumber },
      include: { doctorProfile: true },
    });

    if (!user?.doctorProfile?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = user.id;

    const [totalSlots, bookedSlots] = await prisma.$transaction([
      prisma.doctorAvailability.count({ where: { userId: doctorId, deletedAt: null } }),
      prisma.appointment.count({
        where: { userId: doctorId, deletedAt: null },
      }),
    ]);

    return NextResponse.json({ totalSlots, bookedSlots });
  } catch (error) {
    console.error("Error fetching slot summary:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
