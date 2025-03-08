import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Enhanced GET endpoint with filtering and role counts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [doctors, total, groupData] = await prisma.$transaction([
      prisma.doctorProfile.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.doctorProfile.count(),
      prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
      }),
    ]);

    // Transform the group data into an object: { DOCTOR: X, LAB_TECH: Y, PATIENT: Z, ... }
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
      roleCounts, // Added role counts here
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const doctor = await prisma.doctorProfile.create({ data });
    return NextResponse.json(doctor);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const doctor = await prisma.doctorProfile.update({
      where: { id },
      data,
    });
    return NextResponse.json(doctor);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (body.ids && Array.isArray(body.ids)) {
      // Use deleteMany for bulk deletion
      await prisma.doctorProfile.deleteMany({
        where: { id: { in: body.ids } },
      });
      return NextResponse.json({ message: "Doctors deleted successfully" });
    } else if (body.id) {
      await prisma.doctorProfile.delete({
        where: { id: body.id },
      });
      return NextResponse.json({ message: "Doctor deleted successfully" });
    } else {
      return NextResponse.json({ error: "No valid identifier provided" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete doctor(s)" }, { status: 500 });
  }
}
