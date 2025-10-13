import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

// Optimized doctors API with better filtering and clinic isolation
export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const showActiveOnly = searchParams.get("showActiveOnly") === "true";
    const search = searchParams.get("search") || "";

    // Create base filter with clinic isolation
    const baseClinicFilter = createUserClinicFilter(clinicId);

    let where: any = {
      ...baseClinicFilter
    };
    
    if (searchParams.get("doctorId")) {
      where = { 
        ...where,
        userId: JSON.parse(searchParams.get("doctorId") as string) 
      };
    }

    // Add filter for ACTIVE user status if showActiveOnly=true
    if (showActiveOnly) {
      where = { 
        ...where, 
        user: {
          ...where.user,
          status: "ACTIVE"
        }
      };
    }

    // Add search filter if provided
    if (search) {
      where = {
        ...where,
        user: {
          ...where.user,
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }
      };
    }

    const [doctors, total, roleCounts] = await prisma.$transaction([
      prisma.doctorProfile.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phoneNumber: true,
              status: true,
              clinic: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.doctorProfile.count({ where }),
      prisma.user.groupBy({
        by: ["role"],
        where: baseClinicFilter.user,
        _count: { role: true },
      }),
    ]);

    const roleCountsMap = roleCounts.reduce((acc, cur) => {
      acc[cur.role] = cur._count.role;
      return acc;
    }, {} as { [key: string]: number });

    return NextResponse.json({
      success: true,
      doctors: doctors,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      roleCounts: roleCountsMap,
    });
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to fetch doctors" 
    }, { status: 500 });
  }
}
