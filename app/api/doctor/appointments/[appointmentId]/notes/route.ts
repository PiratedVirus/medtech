import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const id = Number(appointmentId);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointmentId" }, { status: 400 });
    }

    const body = await request.json().catch(() => null) as { notes?: string } | null;
    const notes = body?.notes ?? "";

    const updated = await prisma.appointment.update({
      where: { id },
      data: { doctorNotes: notes },
      select: { id: true, doctorNotes: true, updatedAt: true }
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[APPT][NOTES][PATCH] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update notes' }, { status: 500 });
  }
}


