import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeStatus } from "@/lib/utils/status";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

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
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const doctorId = parseInt(searchParams.get("doctorId") || "0");

    // Create clinic filter - need to filter through the doctor relation to user
    let where: any = {
      doctor: {
        user: {
          clinicId: clinicId
        }
      }
    };
    
    if (doctorId) {
      // When filtering by specific doctor, we need to ensure the doctor belongs to the clinic
      where = {
        userId: doctorId,
        doctor: {
          user: {
            clinicId: clinicId
          }
        }
      };
    }

    const [slots, total] = await prisma.$transaction([
      prisma.doctorAvailability.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        include: {
          doctor: {
            include: {
              user: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: {
          date: 'desc'
        }
      }),
      prisma.doctorAvailability.count({ where })
    ]);

    const transformedSlots = slots.map(slot => ({
      ...slot,
      doctorName: slot.doctor.user.name,
      doctor: undefined
    }));

    return NextResponse.json({
      data: transformedSlots,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Error fetching doctor availability slots:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor availability slots", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Get admin's clinic ID for validation
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const data = await request.json();
    console.log("Data for slot booking is ", data);
    const to24h = (t: string) => {
      if (!t) return t;
      const m12 = t.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
      if (m12) {
        let h = parseInt(m12[1], 10);
        const mm = m12[2];
        const ap = m12[3].toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2,'0')}:${mm}`;
      }
      return t;
    };
    const doctorId = Number(data.doctorId);
    if (!Number.isInteger(doctorId) || doctorId <= 0) {
      return NextResponse.json({ error: "Invalid or missing doctorId" }, { status: 400 });
    }

    // Verify that the doctor belongs to the admin's clinic
    const doctor = await prisma.doctorProfile.findFirst({
      where: {
        userId: doctorId,
        user: {
          clinicId: clinicId
        }
      }
    });

    if (!doctor) {
      return NextResponse.json({ error: "Doctor not found or not authorized" }, { status: 403 });
    }

    const newSlot = await prisma.doctorAvailability.create({
      data: {
        userId: Number(data.doctorId),
        date: new Date(data.date),
        startTime: to24h(data.startTime),
        endTime: to24h(data.endTime),
        status: normalizeStatus(data.status)
      }
    });

    return NextResponse.json(
      { data: newSlot, message: "Availability slot created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating availability slot:", error);
    return NextResponse.json(
      { error: "Failed to create availability slot", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Get admin's clinic ID for validation
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");
    const data = await request.json();

    // Verify that the slot belongs to a doctor in the admin's clinic
    const existingSlot = await prisma.doctorAvailability.findFirst({
      where: {
        id: id,
        doctor: {
          user: {
            clinicId: clinicId
          }
        }
      }
    });

    if (!existingSlot) {
      return NextResponse.json({ error: "Slot not found or not authorized" }, { status: 403 });
    }

    const dateInUTC = new Date(data.date).toISOString();
    const to24h = (t: string) => {
      if (!t) return t;
      const m12 = t.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
      if (m12) {
        let h = parseInt(m12[1], 10);
        const mm = m12[2];
        const ap = m12[3].toUpperCase();
        if (ap === 'PM' && h !== 12) h += 12; if (ap === 'AM' && h === 12) h = 0;
        return `${String(h).padStart(2,'0')}:${mm}`;
      }
      return t;
    };

    const updatedSlot = await prisma.doctorAvailability.update({
      where: { id },
      data: {
        userId: data.doctorId,
        date: new Date(data.date),
        startTime: to24h(data.startTime),
        endTime: to24h(data.endTime),
        status: normalizeStatus(data.status)
      }
    });

    return NextResponse.json(
      { data: updatedSlot, message: "Availability slot updated successfully" }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update availability slot" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    // Get admin's clinic ID for validation
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0");

    // Verify that the slot belongs to a doctor in the admin's clinic
    const existingSlot = await prisma.doctorAvailability.findFirst({
      where: {
        id: id,
        doctor: {
          user: {
            clinicId: clinicId
          }
        }
      }
    });

    if (!existingSlot) {
      return NextResponse.json({ error: "Slot not found or not authorized" }, { status: 403 });
    }

    await prisma.doctorAvailability.delete({
      where: { id }
    });

    return NextResponse.json(
      { message: "Availability slot deleted successfully" }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete availability slot" },
      { status: 500 }
    );
  }
}