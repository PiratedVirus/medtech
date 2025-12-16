import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { 
  requireDoctorAuth, 
  handleAuthError,
  createClinicFilter 
} from "@/lib/clinic-auth";

export async function GET() {
  try {
    // Authenticate doctor and validate clinic access
    const auth = await requireDoctorAuth();
    if (!auth.success) {
      return handleAuthError(auth);
    }

    const doctorId = auth.userId!;
    const clinicId = auth.clinicId;
    console.log("Doctor patients API called with doctorId:", doctorId, "clinicId:", clinicId);

    // First get the doctor's appointments to find their patients
    // Filter by clinicId to ensure multi-tenancy isolation
    const doctorAppointments = await prisma.appointment.findMany({
      where: {
        userId: doctorId,
        deletedAt: null,
        // Multi-tenancy: Only get patients from the same clinic
        patient: clinicId ? { clinicId } : undefined
      },
      select: {
        patientId: true,
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true,
            createdAt: true,
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
            }
          }
        }
      },
      distinct: ['patientId']
    });

    // Extract unique patients from the appointments
    const patients = doctorAppointments.map(apt => apt.patient);

    console.log("Found patients:", patients.length);
    console.log("Patients data:", patients);

    return NextResponse.json(patients);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch patients data' }, { status: 500 });
  }
} 