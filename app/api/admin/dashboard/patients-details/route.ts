import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeStatus, normalizeLabAssignmentStatus } from "@/lib/utils/status";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientIdParam = searchParams.get("patientId");
  const patientId = patientIdParam ? parseInt(patientIdParam, 10) : undefined;

  try {
    if (patientId) {
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
            select: {
              id: true,
              doctorAvailability: { 
                select: { 
                  date: true 
                } 
              },
              consultationType: true,
              status: true,
              isDietician: true,
              prescriptionLink: true,
              appointmentFor: true,
              doctor: { select: { id: true, name: true } },
              payment: {
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
          },
          labPatientBookings: {
            select: {
              id: true,
              labDate: true,
              status: true,
              labResult: true,
              labPackage: { select: { id: true, name: true } },
              payment: {
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
          },
          // subscriptionBookings: {
          //   select: {
          //     subscriptionId: true,
          //     planId: true,
          //     plan: { select: { id: true, name: true } },
          //     payment: {
          //       select: {
          //         amount: true,
          //         currency: true,
          //         paymentStatus: true,
          //         razorpayPaymentId: true,
          //         createdAt: true
          //       }
          //     }
          //   }
          // }
        }
      });
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
      // Split appointments by doctor vs dietician
      const doctorAppointments = patient.patientAppointments.filter(a => a.isDietician === false)
        .sort((a, b) => new Date(b.doctorAvailability?.date || 0).getTime() - new Date(a.doctorAvailability?.date || 0).getTime());
      const dieticianAppointments = patient.patientAppointments.filter(a => a.isDietician)
        .sort((a, b) => new Date(b.doctorAvailability?.date || 0).getTime() - new Date(a.doctorAvailability?.date || 0).getTime());
      const sortedLabBookings = patient.labPatientBookings
        .sort((a, b) => new Date(b.labDate).getTime() - new Date(a.labDate).getTime());
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
        doctorAppointments: doctorAppointments.map(a => ({
          id: a.id,
          date: a.doctorAvailability?.date,
          type: a.consultationType,
          status: a.status,
          prescriptionLink: a.prescriptionLink,
          doctorName: a.doctor.name,
          payment: a.payment
        })),
        dieticianAppointments: dieticianAppointments.map(a => ({
          id: a.id,
          date: a.doctorAvailability?.date,
          type: a.consultationType,
          status: a.status,
          dietPlanLink: a.prescriptionLink,
          doctorName: a.doctor.name,
          payment: a.payment
        })),
        labBookings: sortedLabBookings.map(lb => ({
          id: lb.id,
          date: lb.labDate,
          status: lb.status,
          reportLink: Array.isArray(lb.labResult) ? lb.labResult : lb.labResult ? [lb.labResult] : [],
          labResult: lb.labResult,
          labPackageName: lb.labPackage.name,
          payment: lb.payment
        }))
      };
      return NextResponse.json(formatted);
    } else {
      const users = await prisma.user.findMany({
        where: { role: 'PATIENT' },
        select: { 
          id: true,
          name: true, 
          email: true, 
          phoneNumber: true,
          patientProfile: {
            select: {
              planTrackers: {
                select: {
                  endDate: true,
                  isActive: true,
                  plan: { select: { name: true } }
                }
              }
            }
          },
        
        },
      });
      return NextResponse.json(users);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch patient data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("PUT /api/admin/dashboard/patients-details called with body:", body);
    const { labBookingId, links, status, paymentId } = body;

    // Handle manual payment collection
    if (paymentId) {
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { paymentStatus: "PAID" },
      });
      return NextResponse.json({ success: true, data: updatedPayment });
    }

    if (!labBookingId || !Array.isArray(links)) {
      return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
    }

    const existing = await prisma.labBooking.findUnique({
      where: { id: labBookingId },
      select: { labResult: true },
    });

    const updated = await prisma.labBooking.update({
      where: { id: labBookingId },
      data: {
        labResult: {
          set: [...(existing?.labResult || []), ...links],
        },
        ...(status ? { status: normalizeLabAssignmentStatus(status) } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Lab report upload error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
