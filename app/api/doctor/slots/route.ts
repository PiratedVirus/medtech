import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// Helper to get doctorId from JWT
async function getDoctorIdFromRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch (err) {
    return null;
  }
  const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
  if (!phoneNumber) return null;
  const user = await prisma.user.findFirst({
    where: { phoneNumber },
    include: { doctorProfile: true },
  });
  if (!user?.doctorProfile?.id) return null;
  return user.id;
}

export async function GET(request: Request) {
  try {
    const doctorId = await getDoctorIdFromRequest();
    if (!doctorId) return new NextResponse("Unauthorized", { status: 401 });
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ slots: [] });
    const slots = await prisma.doctorAvailability.findMany({
      where: {
        userId: doctorId,
        date: new Date(date),
        deletedAt: null,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        status: true,
      },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Error fetching doctor slots:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const doctorId = await getDoctorIdFromRequest();
    if (!doctorId) return new NextResponse("Unauthorized", { status: 401 });
    const body = await request.json();
    const { date, slots } = body;
    if (!date || !Array.isArray(slots)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
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
    // Remove all slots for this doctor/date (soft delete)
    await prisma.doctorAvailability.updateMany({
      where: { userId: doctorId, date: new Date(date) },
      data: { deletedAt: new Date() },
    });
    // Create new slots
    const created = await prisma.$transaction(
      slots.map((slot: any) =>
        prisma.doctorAvailability.create({
          data: {
            userId: doctorId,
            date: new Date(date),
            startTime: to24h(slot.startTime),
            endTime: to24h(slot.endTime),
            status: slot.status,
          },
        })
      )
    );
    return NextResponse.json({ slots: created, message: "Slots updated" });
  } catch (error) {
    console.error("Error updating doctor slots:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
