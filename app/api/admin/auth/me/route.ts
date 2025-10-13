import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getCachedAdminProfile } from "@/lib/auth-cache";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
      role: string;
      clinicId: number;
    };

    if (!decoded || decoded.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Try to get from cache first, but if clinic data is missing, fetch fresh
    let admin = await getCachedAdminProfile(decoded.userId);

    // If cached admin doesn't have clinic data, fetch fresh from database
    if (admin && !admin.clinic) {
      console.log('Cached admin missing clinic data, fetching fresh...');
      const freshAdmin = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          clinicId: true,
          clinic: {
            select: {
              id: true,
              name: true,
            }
          }
        },
      });
      
      if (freshAdmin) {
        admin = freshAdmin;
      }
    }

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Admin not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, user: admin });
  } catch (error) {
    console.error("Admin auth check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
} 