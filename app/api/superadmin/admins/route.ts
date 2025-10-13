import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: "ADMIN",
        deletedAt: null
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      admins
    });
  } catch (error) {
    console.error("Fetch admins error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phoneNumber, password, clinicId } = body;

    if (!name || !email || !phoneNumber || !password || !clinicId) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: email,
        deletedAt: null
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already exists" },
        { status: 400 }
      );
    }

    // Check if phone number already exists
    const existingPhone = await prisma.user.findFirst({
      where: {
        phoneNumber: phoneNumber,
        deletedAt: null
      }
    });

    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: "Phone number already exists" },
        { status: 400 }
      );
    }

    // Verify clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: parseInt(clinicId) }
    });

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: "Clinic not found" },
        { status: 404 }
      );
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        name,
        email,
        phoneNumber,
        password: hashedPassword,
        role: "ADMIN",
        status: "ACTIVE",
        clinicId: parseInt(clinicId)
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
      success: true,
      admin
    });
  } catch (error) {
    console.error("Create admin error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
