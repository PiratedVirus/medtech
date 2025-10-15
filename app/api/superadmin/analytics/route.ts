import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withUnifiedCache, getCacheConfig } from "@/lib/cache-middleware-unified";

const getAnalyticsHandler = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '6months';

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '1month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '1year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    }

    // Get basic stats
    const totalClinics = await prisma.clinic.count({
      where: { deletedAt: null }
    });

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

    const totalUsers = await prisma.user.count({
      where: {
        role: {
          not: "SUPER_ADMIN"
        },
        status: "ACTIVE",
        deletedAt: null
      }
    });

    const totalAdmins = await prisma.user.count({
      where: {
        role: "ADMIN",
        status: "ACTIVE",
        deletedAt: null
      }
    });

    const newClinicsThisMonth = await prisma.clinic.count({
      where: {
        createdAt: {
          gte: new Date(now.getFullYear(), now.getMonth(), 1)
        },
        deletedAt: null
      }
    });

    // Get user growth data
    const userGrowth = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        role: {
          not: "SUPER_ADMIN"
        },
        createdAt: {
          gte: startDate
        },
        deletedAt: null
      },
      _count: {
        id: true
      }
    });

    // Get clinic growth data
    const clinicGrowth = await prisma.clinic.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        },
        deletedAt: null
      },
      _count: {
        id: true
      }
    });

    // Process growth data for charts
    const processGrowthData = (data: any[], type: 'user' | 'clinic') => {
      const monthlyData: { [key: string]: number } = {};
      
      data.forEach(item => {
        const month = new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM
        monthlyData[month] = (monthlyData[month] || 0) + item._count.id;
      });

      return Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count: count as number
      })).sort((a, b) => a.month.localeCompare(b.month));
    };

    const userGrowthData = processGrowthData(userGrowth, 'user');
    const clinicGrowthData = processGrowthData(clinicGrowth, 'clinic');

    // Placeholder for revenue data (implement based on your payment system)
    const totalRevenue = 0;
    const revenueGrowth: Array<{ month: string; amount: number }> = [];

    return NextResponse.json({
      totalClinics,
      activeClinics,
      totalUsers,
      totalAdmins,
      totalRevenue,
      newClinicsThisMonth,
      userGrowth: userGrowthData,
      clinicGrowth: clinicGrowthData,
      revenueGrowth
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/superadmin/analytics'))(getAnalyticsHandler);
