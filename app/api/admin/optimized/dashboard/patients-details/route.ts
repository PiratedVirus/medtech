import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeStatus, normalizeLabAssignmentStatus } from "@/lib/utils/status";

// Optimized patients details API 
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientIdParam = searchParams.get("patientId");
  const patientId = patientIdParam ? parseInt(patientIdParam) : null;

  try {
    if (patientId) {
      // Single patient details with optimized includes
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
          }
        }
      });

      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      // Split appointments by doctor vs dietician
      const doctorAppointments = patient.patientAppointments.filter(a => a.isDietician === false);
      const dieticianAppointments = patient.patientAppointments.filter(a => a.isDietician === true);

      const transformedPatient = {
        ...patient,
        doctorAppointments,
        dieticianAppointments,
        subscriptions: patient.patientProfile?.planTrackers || []
      };

      return NextResponse.json(transformedPatient);
    } else {
      // All patients list with optimized query
      const patients = await prisma.user.findMany({
        where: {
          role: 'PATIENT',
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          createdAt: true,
          patientProfile: {
            select: {
              planTrackers: {
                where: {
                  isActive: true,
                  deletedAt: null
                },
                select: {
                  plan: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                },
                take: 1
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
      });

      return NextResponse.json(patients);
    }
  } catch (error) {
    console.error("Patient details query error:", error);
    return NextResponse.json({ error: "Failed to fetch patient details" }, { status: 500 });
  }
}

// Optimized PUT endpoint for updating lab results and payments
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("PUT /api/admin/optimized/dashboard/patients-details called with body:", body);
    const { labBookingId, links, status, paymentId } = body;

    if (labBookingId && links) {
      // Update lab booking with new links
      const updatedLabBooking = await prisma.labBooking.update({
        where: { id: labBookingId },
        data: { labResult: { set: links } },
        select: {
          id: true,
          labResult: true,
          patient: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: "Lab results updated successfully",
        data: updatedLabBooking
      });
    }

    if (labBookingId && status) {
      // Update lab booking status
      const updatedLabBooking = await prisma.labBooking.update({
        where: { id: labBookingId },
        data: { status: normalizeLabAssignmentStatus(status) },
        select: {
          id: true,
          status: true
        }
      });

      return NextResponse.json({
        success: true,
        message: "Lab booking status updated successfully",
        data: updatedLabBooking
      });
    }

    if (paymentId) {
      // Update payment status to PAID
      const updatedPayment = await prisma.payment.update({
        where: { id: paymentId },
        data: { paymentStatus: "PAID" },
        select: {
          id: true,
          paymentStatus: true
        }
      });

      return NextResponse.json({
        success: true,
        message: "Payment marked as paid successfully",
        data: updatedPayment
      });
    }

    return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
  } catch (error) {
    console.error("Patient details update error:", error);
    return NextResponse.json({ error: "Failed to update patient details" }, { status: 500 });
  }
}
