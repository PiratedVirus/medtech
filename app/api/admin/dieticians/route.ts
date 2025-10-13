import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

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

    // Create clinic filter
    const userClinicFilter = createUserClinicFilter(clinicId);

    const [dieticians, total] = await prisma.$transaction([
      prisma.dieticianProfile.findMany({
        where: userClinicFilter,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            include: { clinic: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.dieticianProfile.count({
        where: userClinicFilter
      }),
    ]);

    return NextResponse.json({
      data: dieticians,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dieticians" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const dietician = await prisma.dieticianProfile.create({ data });
    return NextResponse.json({ data: dietician, message: "Dietician created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create dietician" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const dietician = await prisma.dieticianProfile.update({
      where: { id },
      data,
    });
    return NextResponse.json({ data: dietician, message: "Dietician updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update dietician" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.dieticianProfile.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Dietician deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete dietician" }, { status: 500 });
  }
}
