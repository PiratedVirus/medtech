import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createClinicFilter } from "@/lib/admin-clinic-middleware";

// Optimized recent patients API
export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Create clinic filter
    const clinicFilter = createClinicFilter(clinicId);

    // Get recent patients with optimized query
    const recentPatients = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
        deletedAt: null,
        ...clinicFilter
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
