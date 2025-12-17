import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const resolvedParams = await params;
    const adminId = parseInt(resolvedParams.adminId);
    
    if (isNaN(adminId)) {
      return NextResponse.json({ error: "Invalid admin ID" }, { status: 400 });
    }

    const admin = await prisma.user.findUnique({
      where: { 
        id: adminId,
        role: 'ADMIN'
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

    if (!admin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Exclude password from response for security
    const { password, ...adminWithoutPassword } = admin;

    return NextResponse.json(adminWithoutPassword);
  } catch (error) {
    console.error("Error fetching admin:", error);
    return NextResponse.json({ error: "Failed to fetch admin" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const resolvedParams = await params;
    const adminId = parseInt(resolvedParams.adminId);
    
    if (isNaN(adminId)) {
      return NextResponse.json({ error: "Invalid admin ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, email, phoneNumber, clinicId, status, password } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: "Admin name is required" }, { status: 400 });
    }

    if (!email || email.trim() === '') {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!phoneNumber || phoneNumber.trim() === '') {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    if (!clinicId) {
      return NextResponse.json({ error: "Clinic is required" }, { status: 400 });
    }

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { 
        id: adminId,
        role: 'ADMIN'
      }
    });

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: parseInt(clinicId) }
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Check for email uniqueness
    const emailExists = await prisma.user.findFirst({
      where: {
        email: email.trim(),
        id: { not: adminId }
      }
    });

    if (emailExists) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // Check for phone number uniqueness
    const phoneExists = await prisma.user.findFirst({
      where: {
        phoneNumber: phoneNumber.trim(),
        id: { not: adminId }
      }
    });

    if (phoneExists) {
      return NextResponse.json({ error: "Phone number already exists" }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {
      name: name.trim(),
      email: email.trim(),
      phoneNumber: phoneNumber.trim(),
      clinicId: parseInt(clinicId),
      status: status as any,
      updatedAt: new Date()
    };

    // Hash and update password only if provided
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password.trim(), 12);
      updateData.password = hashedPassword;
    }

    // Update admin
    const updatedAdmin = await prisma.user.update({
      where: { id: adminId },
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

    // Exclude password from response for security
    const { password: _, ...adminWithoutPassword } = updatedAdmin;

    return NextResponse.json({
      success: true,
      admin: adminWithoutPassword
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    return NextResponse.json({ error: "Failed to update admin" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ adminId: string }> }
) {
  try {
    const resolvedParams = await params;
    const adminId = parseInt(resolvedParams.adminId);
    
    if (isNaN(adminId)) {
      return NextResponse.json({ error: "Invalid admin ID" }, { status: 400 });
    }

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({
      where: { 
        id: adminId,
        role: 'ADMIN'
      }
    });

    if (!existingAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 });
    }

    // Soft delete the admin
    await prisma.user.update({
      where: { id: adminId },
      data: {
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Admin deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 });
  }
}
