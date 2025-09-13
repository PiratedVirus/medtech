import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Optimized recent patients API
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get recent patients with optimized query
    const recentPatients = await prisma.user.findMany({
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
      take: limit,
    });

    return NextResponse.json(recentPatients);
  } catch (error) {
    console.error("Recent patients query error:", error);
    return NextResponse.json({ error: "Failed to fetch recent patients" }, { status: 500 });
  }
}
