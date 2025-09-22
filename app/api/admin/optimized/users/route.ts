import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Optimized users API with better filtering and role count optimization
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const role = searchParams.get("role");
    const search = searchParams.get("search") || "";

    // If a role is passed, return a simplified response
    if (role) {
      const usersForRole = await prisma.user.findMany({
        where: { 
          role: role as any,
          deletedAt: null,
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phoneNumber: { contains: search, mode: 'insensitive' as const } }
            ]
          })
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true
        }
      });
      return NextResponse.json({ data: usersForRole });
    }

    // Build where clause for main query
    const whereClause = {
      deletedAt: null,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phoneNumber: { contains: search, mode: 'insensitive' as const } }
        ]
      })
    };

    // Use transaction for consistency, but optimize role counts query
    const [users, total, roleCounts] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause as any,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { 
          clinic: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where: whereClause }),
      // Optimized role counts - only count non-deleted users
      prisma.user.groupBy({
        by: ["role"],
        where: { deletedAt: null },
        _count: { role: true },
      }),
    ]);

    // Transform role counts to object
    const roleCountsObj = roleCounts.reduce((acc, cur) => {
      acc[cur.role] = cur._count.role;
      return acc;
    }, {} as { [key: string]: number });

    return NextResponse.json({
      data: users,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      roleCounts: roleCountsObj,
    });
  } catch (error) {
    console.error("Optimized users query error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// Optimized POST endpoint
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      name,
      phoneNumber,
      email,
      role,
      clinicId,
      status = 'ACTIVE',
      password
    } = data;

    // Create user with optimized query
    const user = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        email,
        role,
        clinicId: clinicId || null,
        status,
        password
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ 
      data: user, 
      message: "User created successfully" 
    });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updateData } = data;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        clinic: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({ 
      data: updatedUser, 
      message: "User updated successfully" 
    });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id, ids } = data;

    if (ids && Array.isArray(ids)) {
      // Bulk delete
      await prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() }
      });
      return NextResponse.json({ message: `${ids.length} users deleted successfully` });
    } else if (id) {
      // Single delete
      await prisma.user.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
      return NextResponse.json({ message: "User deleted successfully" });
    } else {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
  } catch (error) {
    console.error("User deletion error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
