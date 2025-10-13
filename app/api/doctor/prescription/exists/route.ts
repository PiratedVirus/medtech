import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Check if a prescription exists for an appointment (or by prescriptionId)
// Always returns 200 with { success: true, exists: boolean, id?: number }
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");
    const prescriptionId = searchParams.get("prescriptionId");

    if (!appointmentId && !prescriptionId) {
      return NextResponse.json({ success: true, exists: false });
    }

    const where: any = {};
    if (appointmentId) where.appointmentId = Number(appointmentId);
    if (prescriptionId) where.id = Number(prescriptionId);

    const existing = await prisma.prescription.findFirst({
      where,
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json({ success: true, exists: true, id: existing.id });
    }
    return NextResponse.json({ success: true, exists: false });
  } catch (error) {
    console.error("Prescription exists check error:", error);
    // Still avoid 404/500 for caller ergonomics; return exists: false on error by design
    return NextResponse.json({ success: true, exists: false });
  }
}


