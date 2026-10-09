import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { normalizeStatus } from "@/lib/utils/status";
import { tokenUserWhere } from "@/lib/clinic-auth";

// Helper to get userId from JWT - supports both DOCTOR and PATHOLOGY roles
async function getUserIdFromRequest() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      console.error("[DOCTOR-SLOTS] No token found in cookies");
      return null;
    }
    
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      console.error("[DOCTOR-SLOTS] Token verification failed:", err);
      return null;
    }
    
    const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
    if (!phoneNumber) {
      console.error("[DOCTOR-SLOTS] No plusAddedPhoneNumber in token. Token payload:", Object.keys(decoded));
      return null;
    }
    
    const user = await prisma.user.findFirst({
      where: await tokenUserWhere(decoded),
      include: { doctorProfile: true },
    });
    
    if (!user) {
      console.error("[DOCTOR-SLOTS] User not found for phoneNumber:", phoneNumber);
      return null;
    }
    
    // Allow both DOCTOR and PATHOLOGY roles to manage slots
    // Doctors have doctorProfile, but pathology users might not
    if (user.role === 'DOCTOR' && !user.doctorProfile?.id) {
      console.error("[DOCTOR-SLOTS] Doctor user found but no doctorProfile. User ID:", user.id);
      return null;
    }
    
    if (user.role !== 'DOCTOR' && user.role !== 'PATHOLOGY') {
      console.error("[DOCTOR-SLOTS] User role not authorized. User ID:", user.id, "Role:", user.role);
      return null;
    }
    
    console.log("[DOCTOR-SLOTS] Successfully authenticated user:", user.id, "Role:", user.role);
    return user.id;
  } catch (error) {
    console.error("[DOCTOR-SLOTS] Error in getUserIdFromRequest:", error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      console.error("[DOCTOR-SLOTS] GET request failed: Unauthorized - userId is null");
      return NextResponse.json(
        { error: "Unauthorized", message: "Please log in as a doctor or pathology staff to access this resource" },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");
    if (!date) return NextResponse.json({ slots: [] });
    const slots = await prisma.doctorAvailability.findMany({
      where: {
        userId: userId,
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

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest();
    if (!userId) {
      console.error("[DOCTOR-SLOTS] POST request failed: Unauthorized - userId is null");
      return NextResponse.json(
        { error: "Unauthorized", message: "Please log in as a doctor or pathology staff to access this resource" },
        { status: 401 }
      );
    }
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
    // Remove all slots for this user/date (soft delete)
    await prisma.doctorAvailability.updateMany({
      where: { userId: userId, date: new Date(date) },
      data: { deletedAt: new Date() },
    });
    // Create new slots
    const created = await prisma.$transaction(
      slots.map((slot: any) =>
        prisma.doctorAvailability.create({
          data: {
            userId: userId,
            date: new Date(date),
            startTime: to24h(slot.startTime),
            endTime: to24h(slot.endTime),
            status: normalizeStatus(slot.status),
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
