import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    let where = {};
    if (searchParams.get("doctorId")) {
      where = { userId: JSON.parse(searchParams.get("doctorId") as string) };
    }

    if (searchParams.get("clinicId")) {
      where = { ...where, user: { clinicId: JSON.parse(searchParams.get("clinicId") as string) } };
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
      prisma.doctorProfile.count(),
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

    const doctor = await prisma.doctorProfile.create({
      data: {
        specialty: data.specialty,
        yearsOfExperience: data.yearsOfExperience,
        consultationFee: data.consultationFee,
        user: { connect: { id: Number(data.userId) } },
      },
    });
    return NextResponse.json(doctor);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    if (data.userId) {
      const user = await prisma.user.findUnique({
        where: { id: Number(data.userId) },
        include: { clinic: true },
      });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 400 });
      }
      if (data.clinicId && user.clinic?.id !== Number(data.clinicId)) {
        return NextResponse.json(
          { error: "Selected user does not belong to the chosen clinic" },
          { status: 400 }
        );
      }
    }
    const doctor = await prisma.doctorProfile.update({
      where: { id },
      data: {
        specialty: data.specialty,
        yearsOfExperience: data.yearsOfExperience,
        status: data.status,
        ...(data.userId && { user: { connect: { id: Number(data.userId) } } }),
      },
    });
    return NextResponse.json(doctor);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (body.ids && Array.isArray(body.ids)) {
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
    console.error(error);
    return NextResponse.json({ error: "Failed to delete doctor(s)" }, { status: 500 });
  }
}