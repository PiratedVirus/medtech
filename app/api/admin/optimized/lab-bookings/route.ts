import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

// Optimized lab bookings API with better filtering and includes
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
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    // Create clinic filter
    const userClinicFilter = createUserClinicFilter(clinicId);

    // Build optimized where clause with clinic isolation
    const whereClause = {
      deletedAt: null,
      patient: userClinicFilter.user,
      ...(status && { status }),
      ...(search && {
        OR: [
          { 
            patient: { 
              name: { contains: search, mode: 'insensitive' } 
            } 
          },
          { 
            labPackage: { 
              name: { contains: search, mode: 'insensitive' } 
            } 
          },
          { fullName: { contains: search, mode: 'insensitive' } },
          { mobile: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [labBookings, total] = await prisma.$transaction([
      prisma.labBooking.findMany({
        where: whereClause as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          labDate: true,
          fullName: true,
          mobile: true,
          email: true,
          address: true,
          createdAt: true,
          labResult: true,
          patient: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          labPackage: {
            select: {
              id: true,
              name: true,
              price: true,
            },
          },
          payment: {
            select: {
              id: true,
              amount: true,
              paymentStatus: true,
              createdAt: true
            }
          },
          reportAnalyses: {
            where: { deletedAt: null },
            select: {
              id: true,
              processingStatus: true,
              processedAt: true,
              llmSummary: true
            },
            orderBy: { createdAt: 'desc' }
          }
        },
      }),
      prisma.labBooking.count({ where: whereClause as any }),
    ]);

    return NextResponse.json({
      data: labBookings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Optimized lab bookings query error:", error);
    return NextResponse.json({ error: "Failed to fetch lab bookings" }, { status: 500 });
  }
}

// Optimized PUT endpoint for status updates
export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updated = await prisma.labBooking.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
        patient: {
          select: {
            id: true,
            name: true
          }
        },
        labPackage: {
          select: {
            name: true
          }
        }
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Lab booking update error:", error);
    return NextResponse.json({ error: "Failed to update lab booking" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({ error: "Lab booking ID is required" }, { status: 400 });
    }

    await prisma.labBooking.update({
      where: { id },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ message: "Lab booking deleted successfully" });
  } catch (error) {
    console.error("Lab booking deletion error:", error);
    return NextResponse.json({ error: "Failed to delete lab booking" }, { status: 500 });
  }
}
