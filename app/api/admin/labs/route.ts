import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId } from "@/lib/admin-clinic-middleware";

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

    const [labs, total] = await prisma.$transaction([
      prisma.labPackage.findMany({
        where: {
          clinicId: clinicId,
          deletedAt: null,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.labPackage.count({
        where: {
          clinicId: clinicId,
          deletedAt: null,
        },
      }),
    ]);

    return NextResponse.json({
      data: labs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch labs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const data = await request.json();
    const labPackage = await prisma.labPackage.create({
      data: {
        ...data,
        clinicId: clinicId, // Ensure lab package is created for the admin's clinic
        isLabPackage: data.isLabPackage ?? false,
      },
    });
    return NextResponse.json({ data: labPackage, message: "Lab created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create labPackage" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const { id, ...data } = await request.json();
    console.log("Updating Lab ID:", id);
    console.log("Update Payload:", data);

    // Verify lab package belongs to admin's clinic
    const existingLab = await prisma.labPackage.findFirst({
      where: {
        id,
        clinicId: clinicId,
        deletedAt: null,
      },
    });

    if (!existingLab) {
      return NextResponse.json({ error: "Lab package not found or unauthorized" }, { status: 404 });
    }

    const labPackage = await prisma.labPackage.update({
      where: { id },
      data: {
        ...data,
        // Ensure clinicId is not changed
        clinicId: clinicId,
        isLabPackage: data.isLabPackage ?? false,
      },
    });
    return NextResponse.json({ data: labPackage, message: "Lab updated successfully" });
  } catch (error) {
    console.error("Update Error:", error instanceof Error ? error.message : JSON.stringify(error));
    return NextResponse.json({ error: "Failed to update labPackage" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const { id } = await request.json();

    // Verify lab package belongs to admin's clinic
    const existingLab = await prisma.labPackage.findFirst({
      where: {
        id,
        clinicId: clinicId,
        deletedAt: null,
      },
    });

    if (!existingLab) {
      return NextResponse.json({ error: "Lab package not found or unauthorized" }, { status: 404 });
    }

    // Soft delete
    await prisma.labPackage.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ message: "Lab deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete labPackage" }, { status: 500 });
  }
}
