import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const resolvedParams = await params;
    const clinicId = parseInt(resolvedParams.clinicId);
    
    if (isNaN(clinicId)) {
      return NextResponse.json({ error: "Invalid clinic ID" }, { status: 400 });
    }

    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    if (!clinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    return NextResponse.json(clinic);
  } catch (error) {
    console.error("Error fetching clinic:", error);
    return NextResponse.json({ error: "Failed to fetch clinic" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const resolvedParams = await params;
    const clinicId = parseInt(resolvedParams.clinicId);
    
    if (isNaN(clinicId)) {
      return NextResponse.json({ error: "Invalid clinic ID" }, { status: 400 });
    }

    const body = await request.json();
    const { name, domain, address, contactInfo, timings, subtitle, logo } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: "Clinic name is required" }, { status: 400 });
    }

    // Check if clinic exists
    const existingClinic = await prisma.clinic.findUnique({
      where: { id: clinicId }
    });

    if (!existingClinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Check for domain uniqueness if domain is provided
    if (domain && domain.trim() !== '') {
      const domainExists = await prisma.clinic.findFirst({
        where: {
          domain: domain.trim(),
          id: { not: clinicId }
        }
      });

      if (domainExists) {
        return NextResponse.json({ error: "Domain already exists" }, { status: 400 });
      }
    }

    // Update clinic
    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        name: name.trim(),
        domain: domain?.trim() || null,
        address: address?.trim() || null,
        contactInfo: contactInfo?.trim() || null,
        timings: timings?.trim() || null,
        subtitle: subtitle?.trim() || null,
        logo: logo?.trim() || null,
        updatedAt: new Date()
      },
      include: {
        _count: {
          select: {
            users: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      clinic: updatedClinic
    });
  } catch (error) {
    console.error("Error updating clinic:", error);
    return NextResponse.json({ error: "Failed to update clinic" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> }
) {
  try {
    const resolvedParams = await params;
    const clinicId = parseInt(resolvedParams.clinicId);
    
    if (isNaN(clinicId)) {
      return NextResponse.json({ error: "Invalid clinic ID" }, { status: 400 });
    }

    // Check if clinic exists
    const existingClinic = await prisma.clinic.findUnique({
      where: { id: clinicId }
    });

    if (!existingClinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Soft delete the clinic
    await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        deletedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: "Clinic deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting clinic:", error);
    return NextResponse.json({ error: "Failed to delete clinic" }, { status: 500 });
  }
}
