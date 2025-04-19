import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const newPatients = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        patientProfile: {
          select: {
            planTrackers: {
              select: {
                plan: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const formattedPatients = newPatients.map((patient) => ({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      joinedOn: patient.createdAt,
      plan: patient.patientProfile?.planTrackers[0]?.plan?.name || 'N/A',
    }));

    return NextResponse.json(formattedPatients);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch new patients' }, { status: 500 });
  }
}
