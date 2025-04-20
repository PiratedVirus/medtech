import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
                  plan: { select: { id: true, name: true } }
                }
              }
            }
          },
          patientAppointments: {
            select: {
              id: true,
              appointmentDate: true,
              consultationType: true,
              status: true,
              isDietician: true,
              prescriptionLink: true,
              appointmentFor: true,
              doctor: { select: { id: true, name: true } },
              payment: {
                select: {
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
              labPackage: { select: { id: true, name: true } }
            }
          }
        }
      });
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
      // Split appointments by doctor vs dietician
      const doctorAppointments = patient.patientAppointments.filter(a => a.isDietician === false);
      const dieticianAppointments = patient.patientAppointments.filter(a => a.isDietician);
      const formatted = {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        joinedOn: patient.createdAt,
        profile: patient.patientProfile,
        plans: patient.patientProfile?.planTrackers?.map(pt => ({
          id: pt.subscriptionId,
          planName: pt.plan.name,
          startDate: pt.startDate,
          endDate: pt.endDate,
          isActive: pt.isActive
        })) || [],
        doctorAppointments: doctorAppointments.map(a => ({
          id: a.id,
          date: a.appointmentDate,
          type: a.consultationType,
          status: a.status,
          prescriptionLink: a.prescriptionLink,
          doctorName: a.doctor.name,
          payment: a.payment
        })),
        dieticianAppointments: dieticianAppointments.map(a => ({
          id: a.id,
          date: a.appointmentDate,
          type: a.consultationType,
          status: a.status,
          dietPlanLink: a.prescriptionLink,
          doctorName: a.doctor.name,
          payment: a.payment
        })),
        labBookings: patient.labPatientBookings.map(lb => ({
          id: lb.id,
          date: lb.labDate,
          status: lb.status,
          reportLink: lb.labResult,
          labPackageName: lb.labPackage.name
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
