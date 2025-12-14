import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { SmartCacheInvalidation } from "@/lib/cache-dependencies";
import { cacheUtils } from "@/lib/redis";

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

    // Verify the appointment belongs to this doctor and get patientId
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentIdNum,
        userId: user.id,
        deletedAt: null
      },
      select: {
        id: true,
        patientId: true,
        userId: true
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

    // ✅ CACHE INVALIDATION: Invalidate doctor appointments cache and patient appointments cache
    try {
      // Invalidate doctor appointments cache using phoneNumber (as used in cache key)
      // Use pattern to catch all variations (all, upcoming, etc.)
      const doctorCacheKeyPattern = `doctor:appointments:${phoneNumber}*`;
      await cacheUtils.invalidate(doctorCacheKeyPattern);
      console.log(`[MARK-COMPLETED] Invalidated doctor appointments cache pattern: ${doctorCacheKeyPattern}`);

      // Also invalidate exact key for immediate effect
      const doctorCacheKey = `doctor:appointments:${phoneNumber}`;
      await cacheUtils.invalidate(doctorCacheKey);
      console.log(`[MARK-COMPLETED] Invalidated doctor appointments cache: ${doctorCacheKey}`);

      // Also invalidate using SmartCacheInvalidation for comprehensive invalidation
      if (appointment.patientId) {
        await SmartCacheInvalidation.onAppointmentUpdate(appointment.patientId, user.id);
        console.log(`[MARK-COMPLETED] Smart cache invalidation completed for patient ${appointment.patientId} and doctor ${user.id}`);
      }
    } catch (cacheError) {
      console.error('[MARK-COMPLETED] Error invalidating cache:', cacheError);
      // Don't fail the request if cache invalidation fails
    }

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