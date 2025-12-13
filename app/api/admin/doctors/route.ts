import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";
import { invalidateAllDoctorCaches } from "@/lib/cache-invalidation";
import { SmartCacheInvalidation } from "@/lib/cache-dependencies";
import { CacheEvents } from "@/lib/cache-events";

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

    const [doctors, total, groupData] = await prisma.$transaction([
      prisma.doctorProfile.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            include: { clinic: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.doctorProfile.count({ where }),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
    ]);

    const roleCounts = groupData.reduce((acc, cur) => {
      acc[cur.role] = cur._count.role;
      return acc;
    }, {} as { [key: string]: number });

    return NextResponse.json({
      data: doctors,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      roleCounts,
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const data = await request.json();
    // Validate that userId is provided and fetch the user with clinic info
    const user = await prisma.user.findUnique({
      where: { id: Number(data.userId) },
      include: { clinic: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 400 });
    }
    // Validate that the user belongs to the selected clinic
    if (data.clinicId && user.clinic?.id !== Number(data.clinicId)) {
      return NextResponse.json(
        { error: "Selected user does not belong to the chosen clinic" },
        { status: 400 }
      );
    }

    // Validate doctor code format
    if (data.doctorCode) {
      if (!/^[A-Z0-9]{6}$/.test(data.doctorCode)) {
        return NextResponse.json(
          { error: "Doctor code must be 6 characters long and contain only uppercase letters and numbers" },
          { status: 400 }
        );
      }

      // Check if doctor code is already in use
      const existingDoctor = await prisma.doctorProfile.findUnique({
        where: { doctorCode: data.doctorCode }
      });

      if (existingDoctor) {
        return NextResponse.json(
          { error: "Doctor code is already in use" },
          { status: 400 }
        );
      }
    }

    const roomName = `doctor-${user.id}-${Date.now()}`;
    const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: roomName,
        privacy: "private",
        properties: {
          enable_knocking: true,
          exp: null,
        },
      }),
    });
    if (!dailyRes.ok) {
      const errData = await dailyRes.json();
      console.error("Failed to create Daily.co room:", errData);
      return NextResponse.json({ error: "Failed to create video room" }, { status: 500 });
    }
    const dailyRoom = await dailyRes.json();
    if (!dailyRoom || typeof dailyRoom !== 'object' || !dailyRoom.url) {
      console.error("Daily API returned invalid payload:", dailyRoom);
      return NextResponse.json({ error: "Invalid response from video room API" }, { status: 500 });
    }

    const ownerTokens: string[] = [];

    for (let i = 0; i < 2; i++) {
      const tokenRes = await fetch("https://api.daily.co/v1/meeting-tokens", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            is_owner: true,
            room_name: roomName,
          },
        }),
      });

      if (!tokenRes.ok) {
        const tokenError = await tokenRes.json();
        console.error(`Failed to create owner token ${i + 1}:`, tokenError);
        return NextResponse.json({ error: "Failed to create owner token" }, { status: 500 });
      }

      const tokenData = await tokenRes.json();
      ownerTokens.push(tokenData.token);
    }

    const doctor = await prisma.doctorProfile.create({
      data: {
        specialty: data.specialty,
        yearsOfExperience: data.yearsOfExperience,
        consultationFee: data.consultationFee,
        meetingRoomLink: dailyRoom.url,
        ownerToken1: ownerTokens[0],
        ownerToken2: ownerTokens[1],
        isDietician: data.isDietician || false,
        supportsVideo: typeof data.supportsVideo === 'boolean' ? data.supportsVideo : true,
        supportsClinic: typeof data.supportsClinic === 'boolean' ? data.supportsClinic : true,
        doctorCode: data.doctorCode?.toUpperCase() || null,
        user: { connect: { id: Number(data.userId) } },
      },
    });

    // ✅ HIGH PRIORITY: Invalidate doctor list cache after creating new doctor
    try {
      await invalidateAllDoctorCaches(Number(doctor.id), data.clinicId ? Number(data.clinicId) : undefined);
      console.log(`[DOCTOR-CREATE] Cache invalidated for new doctor ${doctor.id}`);
    } catch (cacheError) {
      console.error('[DOCTOR-CREATE] Error invalidating doctor cache:', cacheError);
      // Don't fail the request if cache invalidation fails
    }

    return NextResponse.json(doctor);
  } catch (error: any) {
    console.error("Error creating doctor:", error);
    return NextResponse.json(
      { error: "Failed to create doctor", details: error?.toString() || "Unknown error" },
      { status: 500 }
    );
  }
}
export async function PUT(request: Request) {
  try {
    const { id, userId, status, isDietician, clinicId, doctorCode, ...data } = await request.json();

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: Number(userId) },
        include: { clinic: true },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }
      if (clinicId && user.clinic?.id !== Number(clinicId)) {
        return NextResponse.json(
          { error: "Selected user does not belong to the chosen clinic" },
          { status: 400 }
        );
      }
    }

    // Validate doctor code format if provided
    if (doctorCode) {
      if (!/^[A-Z0-9]{6}$/.test(doctorCode)) {
        return NextResponse.json(
          { error: "Doctor code must be 6 characters long and contain only uppercase letters and numbers" },
          { status: 400 }
        );
      }

      // Check if doctor code is already in use by another doctor
      const existingDoctor = await prisma.doctorProfile.findFirst({
        where: {
          doctorCode: doctorCode,
          id: { not: id } // Exclude current doctor
        }
      });

      if (existingDoctor) {
        return NextResponse.json(
          { error: "Doctor code is already in use" },
          { status: 400 }
        );
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (userId && status) {
        await tx.user.update({
          where: { id: Number(userId) },
          data: { status },
        });
      }

      return await tx.doctorProfile.update({
        where: { id },
        data: {
          specialty: data.specialty,
          yearsOfExperience: data.yearsOfExperience,
          consultationFee: data.consultationFee,
          isDietician: isDietician || false,
          supportsVideo: typeof data.supportsVideo === 'boolean' ? data.supportsVideo : undefined,
          supportsClinic: typeof data.supportsClinic === 'boolean' ? data.supportsClinic : undefined,
          doctorCode: doctorCode?.toUpperCase() || null
        },
      });
    });

    // ✅ EVENT-DRIVEN: Emit doctor update event
    try {
      await CacheEvents.doctorUpdated(
        Number(id), 
        { 
          consultationFee: data.consultationFee,
          specialty: data.specialty,
          isDietician: isDietician,
          status: status
        }, 
        clinicId ? Number(clinicId) : undefined
      );
      console.log(`[DOCTOR-UPDATE] Event-driven cache invalidation completed for doctor ${id}`);
    } catch (cacheError) {
      console.error('[DOCTOR-UPDATE] Error in event-driven cache invalidation:', cacheError);
      // Fallback to smart cache invalidation
      try {
        await SmartCacheInvalidation.onDoctorUpdate(
          Number(id), 
          { 
            consultationFee: data.consultationFee,
            specialty: data.specialty,
            isDietician: isDietician,
            status: status
          }, 
          clinicId ? Number(clinicId) : undefined
        );
        console.log(`[DOCTOR-UPDATE] Fallback smart cache invalidation completed for doctor ${id}`);
      } catch (fallbackError) {
        console.error('[DOCTOR-UPDATE] Fallback cache invalidation also failed:', fallbackError);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (body.ids && Array.isArray(body.ids)) {
      const ids = body.ids.map((i: any) => Number(i));
      // fetch affected userIds
      const profiles = await prisma.doctorProfile.findMany({
        where: { id: { in: ids } },
        select: { userId: true },
      });
      const userIds = profiles.map((p) => p.userId);

      // soft-delete profiles & reset user statuses in one transaction
      await prisma.$transaction(async (tx) => {
        await tx.doctorProfile.deleteMany({ where: { id: { in: ids } } });
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { role: 'NOT_SET' },
        });
      });

      // ✅ HIGH PRIORITY: Invalidate doctor caches after bulk deletion
      try {
        for (const doctorId of ids) {
          await invalidateAllDoctorCaches(Number(doctorId));
        }
        console.log(`[DOCTOR-DELETE] Cache invalidated for deleted doctors: ${ids.join(', ')}`);
      } catch (cacheError) {
        console.error('[DOCTOR-DELETE] Error invalidating doctor cache:', cacheError);
      }

      return NextResponse.json({ message: "Doctors deleted successfully" });
    } else if (body.id) {
      const id = Number(body.id);
      // soft-delete the profile and reset the user's status
      await prisma.$transaction(async (tx) => {
        const deleted = await tx.doctorProfile.delete({ where: { id } });
        await tx.user.update({
          where: { id: deleted.userId },
          data: { role: 'NOT_SET' },
        });
      });

      // ✅ HIGH PRIORITY: Invalidate doctor cache after single deletion
      try {
        await invalidateAllDoctorCaches(Number(id));
        console.log(`[DOCTOR-DELETE] Cache invalidated for deleted doctor ${id}`);
      } catch (cacheError) {
        console.error('[DOCTOR-DELETE] Error invalidating doctor cache:', cacheError);
      }

      return NextResponse.json({ message: "Doctor deleted successfully" });
    } else {
      return NextResponse.json({ error: "No valid identifier provided" }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete doctor(s)" }, { status: 500 });
  }
}