import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getAdminClinicId, createClinicFilter } from "@/lib/admin-clinic-middleware";

export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const pageSize = 10;

    if (!patientId) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    // Create clinic filter
    const clinicFilter = createClinicFilter(clinicId);

    // First verify the patient belongs to the admin's clinic
    const patient = await prisma.user.findFirst({
      where: {
        id: parseInt(patientId),
        ...clinicFilter,
        deletedAt: null
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found or access denied" },
        { status: 404 }
      );
    }

    const where: Prisma.HealthMetricWhereInput = {
      userId: parseInt(patientId),
      metricName: search ? {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      } : undefined,
    };

    // Get total count for pagination
    const totalCount = await prisma.healthMetric.count({ where });

    // Get paginated metrics
    const metrics = await prisma.healthMetric.findMany({
      where,
      orderBy: {
        recordedAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        metricName: true,
        reading: true,
        recordedAt: true,
      },
    });

    return NextResponse.json({
      metrics,
      pagination: {
        total: totalCount,
        pageSize,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch health metrics" },
      { status: 500 }
    );
  }
} 