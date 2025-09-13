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
          role,
          deletedAt: null,
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phoneNumber: { contains: search, mode: 'insensitive' } }
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
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phoneNumber: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Use transaction for consistency, but optimize role counts query
    const [users, total, roleCounts] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
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
