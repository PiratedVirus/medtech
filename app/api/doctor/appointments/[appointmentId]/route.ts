import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { withUnifiedCache, getCacheConfig } from "@/lib/cache-middleware-unified";

const getAppointmentHandler = async (
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) => {
  try {
    const { appointmentId } = await params;
    const appointmentIdNum = parseInt(appointmentId);
    
    if (isNaN(appointmentIdNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid appointment ID" },
        { status: 400 }
      );
    }

    // Verify doctor authentication
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
    if (!phoneNumber) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { phoneNumber },
      include: { doctorProfile: true },
    });

    if (!user?.doctorProfile?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const doctorId = user.id;

    // Fetch the specific appointment
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentIdNum,
        userId: doctorId, // Ensure doctor owns this appointment
        deletedAt: null,
      },
      include: {
        patient: { 
          select: { 
            name: true, 
            id: true,
            phoneNumber: true 
          } 
        },
        payment: { 
          select: { 
            paymentMethod: true,
            paymentStatus: true,
            amount: true
          } 
        },
        doctorAvailability: { 
          select: { 
            date: true, 
            startTime: true, 
            endTime: true 
          } 
        },
        prescription: { 
          select: { 
            id: true,
            prescriptionNumber: true
          } 
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { success: false, error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Check if this is the patient's first appointment with this doctor
    const appointmentCount = await prisma.appointment.count({
      where: {
        userId: doctorId,
        patientId: appointment.patientId,
        deletedAt: null,
      },
    });

    const isFirst = appointmentCount === 1;

    // Transform to match expected format
    const transformedAppointment = {
      id: appointment.id,
      patientName: appointment.patient.name,
      patientId: appointment.patient.id,
      doctorName: user?.name || "Unknown Doctor",
      doctorId: user?.id || 0,
      date: appointment.doctorAvailability?.date,
      startTime: appointment.doctorAvailability?.startTime,
      endTime: appointment.doctorAvailability?.endTime,
      status: appointment.status,
      paymentType: appointment.payment?.paymentMethod || null,
      paymentStatus: appointment.payment?.paymentStatus || null,
      paymentAmount: appointment.payment?.amount || null,
      consultationType: appointment.consultationType,
      isFirst: isFirst,
      prescriptionLink: appointment.prescriptionLink || undefined,
      prescriptionId: appointment.prescription?.id || null,
      prescriptionNumber: appointment.prescription?.prescriptionNumber || null,
      meetingRoomLink: user?.doctorProfile?.meetingRoomLink || null,
      ownerToken1: user?.doctorProfile?.ownerToken1 || null,
    };

    return NextResponse.json({
      success: true,
      data: transformedAppointment,
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(
  getCacheConfig('/api/doctor/appointments/[appointmentId]')
)(getAppointmentHandler);





