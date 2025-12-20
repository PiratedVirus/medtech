import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicIdAsync, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = await getAdminClinicIdAsync(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Create clinic filter for patients
    const userClinicFilter = createUserClinicFilter(clinicId);

    const [labBookings, total] = await prisma.$transaction([
      prisma.labBooking.findMany({
        where: {
          deletedAt: null,
          patient: userClinicFilter.user,
          // Also ensure lab package belongs to the clinic
          labPackage: {
            clinicId: clinicId,
            deletedAt: null,
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          patient: {
            select: {
              id: true,
              name: true,
            },
          },
          labPackage: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.labBooking.count({
        where: {
          deletedAt: null,
          patient: userClinicFilter.user,
          labPackage: {
            clinicId: clinicId,
            deletedAt: null,
          },
        },
      }),
    ]);

    return NextResponse.json({
      data: labBookings,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch lab bookings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const updated = await prisma.labBooking.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lab booking" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    await prisma.labBooking.delete({ where: { id } });

    return NextResponse.json({ message: "Lab booking deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete lab booking" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, links, remove } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const existing = await prisma.labBooking.findUnique({
      where: { id },
      select: { labResult: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    let updatedResults = existing.labResult || [];

    if (Array.isArray(links) && links.length > 0) {
      updatedResults = [...updatedResults, ...links];
    }

    if (remove) {
      updatedResults = updatedResults.filter((url) => url !== remove);
    }

    const updated = await prisma.labBooking.update({
      where: { id },
      data: { labResult: { set: updatedResults } },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lab results" }, { status: 500 });
  }
}
