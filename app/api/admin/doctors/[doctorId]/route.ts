import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { AppointmentStatus } from "@/lib/constants/enums";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Appointment, DoctorProfile, Payment, User } from "@prisma/client";

interface DoctorWithRelations extends DoctorProfile {
  user: User & {
    clinic: {
      id: number;
      name: string;
    } | null;
    doctorAppointments: (Appointment & {
      patient: {
        id: number;
        name: string;
        phoneNumber: string;
      };
      payment: {
        amount: number;
        paymentStatus: string;
        createdAt: Date;
      } | null;
    })[];
  };
  availability: {
    id: number;
    date: Date;
    startTime: string;
    endTime: string;
    status: string;
  }[];
}

export async function GET(
  request: Request,
  { params }: any
) {
  try {
    const doctorId = parseInt(params.doctorId);

    if (isNaN(doctorId)) {
      return NextResponse.json(
        { error: "Invalid doctor ID" },
        { status: 400 }
      );
    }

    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      include: {
        user: {
          include: {
            clinic: true,
            doctorAppointments: {
              include: {
                patient: {
                  select: {
                    id: true,
                    name: true,
                    phoneNumber: true
                  }
                },
                payment: {
                  select: {
                    amount: true,
                    paymentStatus: true,
                    createdAt: true
                  }
                },
                doctorAvailability: {
                  select: {
                    date: true
                  }
                }
              },
              orderBy: {
                doctorAvailability: { date: 'desc' }
              }
            }
          }
        },
        availability: {
          orderBy: {
            date: 'desc'
          }
        }
      }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor not found" },
        { status: 404 }
      );
    }

    const doctorWithRelations = doctor as unknown as DoctorWithRelations;

    // Calculate earnings
    const now = new Date();
    const startOfCurrentMonth = startOfMonth(now);
    const endOfCurrentMonth = endOfMonth(now);
    const startOfLastMonth = startOfMonth(subMonths(now, 1));
    const endOfLastMonth = endOfMonth(subMonths(now, 1));

    const appointments = doctorWithRelations.user.doctorAppointments;
    const completedAppointments = appointments.filter((a) => a.status === AppointmentStatus.COMPLETED);
    const upcomingAppointments = appointments.filter((a) => a.status === AppointmentStatus.SCHEDULED);
    
    const totalEarnings = completedAppointments.reduce((sum: number, app) => 
      sum + (app.payment?.amount || 0), 0
    );

    const thisMonthEarnings = completedAppointments
      .filter((app: any) => {
        if (!app.doctorAvailability?.date) return false;
        const appDate = new Date(app.doctorAvailability.date);
        return appDate >= startOfCurrentMonth && appDate <= endOfCurrentMonth;
      })
      .reduce((sum: number, app) => sum + (app.payment?.amount || 0), 0);

    const lastMonthEarnings = completedAppointments
      .filter((app: any) => {
        if (!app.doctorAvailability?.date) return false;
        const appDate = new Date(app.doctorAvailability.date);
        return appDate >= startOfLastMonth && appDate <= endOfLastMonth;
      })
      .reduce((sum: number, app) => sum + (app.payment?.amount || 0), 0);

    // Get unique patients
    const uniquePatients = new Set(appointments.map(a => a.patient.id));

    const formattedDoctor = {
      id: doctorWithRelations.id,
      user: {
        id: doctorWithRelations.user.id,
        name: doctorWithRelations.user.name,
        email: doctorWithRelations.user.email,
        phoneNumber: doctorWithRelations.user.phoneNumber,
        status: doctorWithRelations.user.status,
        clinic: doctorWithRelations.user.clinic
      },
      specialty: doctorWithRelations.specialty,
      yearsOfExperience: doctorWithRelations.yearsOfExperience,
      consultationFee: doctorWithRelations.consultationFee,
      doctorCode: doctorWithRelations.doctorCode,
      isDietician: doctorWithRelations.isDietician,
      createdAt: doctorWithRelations.createdAt,
      appointments: appointments.map((appointment: any) => ({
        id: appointment.id,
        date: appointment.doctorAvailability.date,
        status: appointment.status,
        consultationType: appointment.consultationType,
        patient: appointment.patient,
        payment: appointment.payment
      })),
      availability: doctorWithRelations.availability.map(availability => ({
        id: availability.id,
        date: availability.date,
        startTime: availability.startTime,
        endTime: availability.endTime,
        status: availability.status
      })),
      earnings: {
        total: totalEarnings,
        thisMonth: thisMonthEarnings,
        lastMonth: lastMonthEarnings
      },
      stats: {
        totalPatients: uniquePatients.size,
        totalAppointments: appointments.length,
        completedAppointments: completedAppointments.length,
        upcomingAppointments: upcomingAppointments.length
      }
    };

    return NextResponse.json(formattedDoctor);
  } catch (error) {
    console.error("Error fetching doctor details:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor details" },
      { status: 500 }
    );
  }
} 