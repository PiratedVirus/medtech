import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await params;
    const pid = Number(patientId);
    if (!pid || Number.isNaN(pid)) {
      return NextResponse.json({ success: false, error: "Invalid patientId" }, { status: 400 });
    }

    const body = await request.json().catch(() => null) as { notes?: string; appointmentId?: number } | null;
    const notes = (body?.notes ?? "").toString();
    const appointmentId = body?.appointmentId ? Number(body.appointmentId) : undefined;

    let targetId: number | null = null;
    if (appointmentId && !Number.isNaN(appointmentId)) {
      targetId = appointmentId;
    } else {
      const latest = await prisma.appointment.findFirst({
        where: { patientId: pid, status: { in: ["COMPLETED", "DONE", "FINISHED"] } },
        orderBy: [
          { doctorAvailability: { date: "desc" } },
          { updatedAt: "desc" },
          { createdAt: "desc" },
        ],
        select: { id: true }
      });
      targetId = latest?.id ?? null;
    }

    if (!targetId) {
      return NextResponse.json({ success: false, error: "No completed appointments found for patient" }, { status: 404 });
    }

    const updated = await prisma.appointment.update({
      where: { id: targetId },
      data: { doctorNotes: notes },
      select: { id: true, doctorNotes: true, updatedAt: true }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PATIENT][NOTES][POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save notes' }, { status: 500 });
  }
}


