import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withUnifiedCache, getCacheConfig } from "@/lib/cache-middleware-unified";

const getStatsHandler = async () => {
  try {
    // Get total clinics
    const totalClinics = await prisma.clinic.count({
      where: { deletedAt: null }
    });

    // Get active clinics (with at least one user)
    const activeClinics = await prisma.clinic.count({
      where: {
        deletedAt: null,
        users: {
          some: {
            deletedAt: null
          }
        }
      }
    });

    // Get total admins
    const totalAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
        deletedAt: null
      }
    });

    // Get total users (all roles except SUPER_ADMIN)
    const totalUsers = await prisma.user.count({
      where: {
        role: {
          not: "SUPER_ADMIN"
        },
        status: "ACTIVE",
        deletedAt: null
      }
    });

    // Get new clinics this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newClinicsThisMonth = await prisma.clinic.count({
      where: {
        createdAt: {
          gte: startOfMonth
        },
        deletedAt: null
      }
    });

    // Calculate total revenue (this would need to be implemented based on your payment system)
    const totalRevenue = 0; // Placeholder - implement based on your payment tracking

    return NextResponse.json({
      totalClinics,
      activeClinics,
      totalAdmins,
      totalUsers,
      newClinicsThisMonth,
      totalRevenue,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/superadmin/dashboard/stats'))(getStatsHandler);
