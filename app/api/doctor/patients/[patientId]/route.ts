import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
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

    const doctorId = user.id;
    const { patientId: patientIdParam } = await params;
    const patientId = parseInt(patientIdParam, 10);

    try {
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        createdAt: true,
        patientProfile: {
          select: {
            age: true,
            weight: true,
            height: true,
            gender: true,
            allergies: true,
            medicalHistory: true,
            emergencyContact: true,
            dateOfBirth: true,
            address: true,
            profilePicture: true,
            planTrackers: {
              select: {
                subscriptionId: true,
                startDate: true,
                endDate: true,
                isActive: true,
                plan: { select: { id: true, name: true } },
                payments: {
                  select: {
                    id: true,
                    amount: true,
                    currency: true,
                    paymentStatus: true,
                    razorpayPaymentId: true,
                    createdAt: true
                  }
                }
              }
            }
          }
        },
        patientAppointments: {
          where: {
            userId: doctorId,
            // isDietician: false,
            deletedAt: null
          },
          select: {
            id: true,
            appointmentDate: true,
            consultationType: true,
            status: true,
            prescriptionLink: true,
            appointmentFor: true,
            doctorNotes: true,
            doctor: { select: { id: true, name: true } },
            prescription: {
              select: {
                complaints: {
                  select: {
                    complaintText: true
                  }
                },
                medicines: {
                  select: {
                    medicineName: true,
                    frequency: true,
                    duration: true
                  }
                },
                testsRequested: true
              }
            }
          },
          orderBy: {
            appointmentDate: 'desc'
          }
        },
        labPatientBookings: {
          select: {
            id: true,
            labDate: true,
            status: true,
            labResult: true,
            labPackage: { select: { id: true, name: true } }
          },
          orderBy: {
            labDate: 'desc'
          }
        }
      }
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if this patient has any appointments with the requesting doctor
    if (patient.patientAppointments.length === 0) {
      return NextResponse.json({ error: "Patient not found or no appointments with this doctor" }, { status: 404 });
    }

    const formatted = {
      id: patient.id,
      name: patient.name,
      email: patient.email,
      joinedOn: patient.createdAt,
      profile: patient.patientProfile,
      subscriptions: patient.patientProfile?.planTrackers?.map(pt => ({
        id: pt.subscriptionId,
        planName: pt.plan.name,
        startDate: pt.startDate,
        endDate: pt.endDate,
        isActive: pt.isActive,
        payment: pt.payments ? {
          amount: pt.payments.amount,
          currency: pt.payments.currency,
          paymentStatus: pt.payments.paymentStatus,
          razorpayPaymentId: pt.payments.razorpayPaymentId,
          createdAt: pt.payments.createdAt
        } : undefined
      })) || [],
      doctorAppointments: patient.patientAppointments.map(a => ({
        id: a.id,
        date: a.appointmentDate,
        type: a.consultationType,
        status: a.status,
        prescriptionLink: a.prescriptionLink,
        doctorName: a.doctor.name,
        complaints: a.prescription?.complaints?.map(c => c.complaintText).join(", ") || "",
        medicines: a.prescription?.medicines?.map(m => `${m.medicineName} (${m.frequency || 'As prescribed'})`).join(", ") || "",
        tests: a.prescription?.testsRequested || "",
        doctorNotes: a.doctorNotes
      })),
      labBookings: patient.labPatientBookings.map(lb => ({
        id: lb.id,
        date: lb.labDate,
        status: lb.status,
        reportLink: Array.isArray(lb.labResult) ? lb.labResult : lb.labResult ? [lb.labResult] : [],
        labPackageName: lb.labPackage.name
      }))
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch patient data' }, { status: 500 });
  }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch patient data' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    const body = await request.json();
    const { appointmentId, doctorNotes } = body;
    const { patientId: patientIdParam } = await params;
    const patientId = parseInt(patientIdParam, 10);

    if (!appointmentId || doctorNotes === undefined) {
      return NextResponse.json({ error: "Appointment ID and doctor notes are required" }, { status: 400 });
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: { doctorNotes }
    });

    return NextResponse.json({ success: true, data: updatedAppointment });
  } catch (error) {
    console.error("Update doctor notes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 