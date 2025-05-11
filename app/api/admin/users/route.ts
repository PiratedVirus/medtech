import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

//TODO: ClinicId filter

// Enhanced GET endpoint with filtering and role counts
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const role = searchParams.get("role");

    // If a role is passed, return a simplified response (user id and name only)
    if (role) {
      const usersForRole = await prisma.user.findMany({
        // @ts-ignore
        where: { role }
      });
      return NextResponse.json({ data: usersForRole });
    }

    const [users, total, groupData] = await prisma.$transaction([
      prisma.user.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { clinic: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count(),
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
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      roleCounts, // Added role counts here
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const user = await prisma.user.create({ data });
    return NextResponse.json({ data: user, message: "User created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const user = await prisma.user.update({
      where: { id },
      data,
    });
    return NextResponse.json({ data: user, message: "User updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    if (body.ids && Array.isArray(body.ids)) {
      // Use deleteMany for bulk deletion
      await prisma.user.deleteMany({
        where: { id: { in: body.ids } },
      });
      return NextResponse.json({ message: "Users deleted successfully" });
    } else if (body.id) {
      await prisma.user.delete({
        where: { id: body.id },
      });
      return NextResponse.json({ message: "User deleted successfully" });
    } else {
      return NextResponse.json({ error: "No valid identifier provided" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete user(s)" }, { status: 500 });
  }
}
