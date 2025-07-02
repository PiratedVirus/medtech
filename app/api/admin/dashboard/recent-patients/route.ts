import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const users = await prisma.user.findMany({
      where: { 
        role: 'PATIENT',
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)), // Last 7 days
        }
      },
      take: 3, // Limit to 3 latest patients
      orderBy: { createdAt: "desc" }, // Most recent first
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
        },
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch recent patients' }, { status: 500 });
  }
} 