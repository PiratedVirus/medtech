import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
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

    const { appointmentId } = await params;
    const appointmentIdNum = parseInt(appointmentId, 10);

    // Verify the appointment belongs to this doctor
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentIdNum,
        userId: user.id,
        deletedAt: null
      }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    // Mark appointment as completed
    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentIdNum },
      data: { status: "COMPLETED" }
    });

    return NextResponse.json({ 
      success: true, 
      data: updatedAppointment,
      message: "Appointment marked as completed"
    });
  } catch (error) {
    console.error("Error marking appointment as completed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 