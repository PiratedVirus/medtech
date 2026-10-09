import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
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
    const { 
      name, 
      subdomain, 
      domain, 
      address, 
      contactInfo, 
      timings, 
      subtitle, 
      logo,           // Square logo for prescription headers
      footerLogo,     // Rectangular/wide logo for footer display
      // Branding & Footer fields
      email,
      phone,
      footerTagline,
      socialLinks,
      primaryColor,
      secondaryColor,
      websiteUrl,
      copyrightText,
    } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: "Clinic name is required" }, { status: 400 });
    }

    // Subdomain is required
    if (!subdomain || subdomain.trim() === '') {
      return NextResponse.json({ error: "Subdomain is required" }, { status: 400 });
    }

    // Validate subdomain format: alphanumeric and hyphens only, 3-63 characters
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    const normalizedSubdomain = subdomain.toLowerCase().trim();
    
    if (!subdomainRegex.test(normalizedSubdomain)) {
      return NextResponse.json(
        { error: "Subdomain must be 3-63 characters, alphanumeric with hyphens only, and start/end with alphanumeric" },
        { status: 400 }
      );
    }

    // Check if clinic exists
    const existingClinic = await prisma.clinic.findUnique({
      where: { id: clinicId }
    });

    if (!existingClinic) {
      return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
    }

    // Check for subdomain uniqueness (excluding current clinic)
    const subdomainExists = await prisma.clinic.findFirst({
      where: {
        subdomain: normalizedSubdomain,
        id: { not: clinicId },
        deletedAt: null
      }
    });

    if (subdomainExists) {
      return NextResponse.json({ error: "Subdomain already exists" }, { status: 400 });
    }

    // Check for domain uniqueness if domain is provided
    if (domain && domain.trim() !== '') {
      const domainExists = await prisma.clinic.findFirst({
        where: {
          domain: domain.trim(),
          id: { not: clinicId },
          deletedAt: null
        }
      });

      if (domainExists) {
        return NextResponse.json({ error: "Domain already exists" }, { status: 400 });
      }
    }

    // Update clinic with all branding fields
    const updatedClinic = await prisma.clinic.update({
      where: { id: clinicId },
      data: {
        name: name.trim(),
        subdomain: normalizedSubdomain,
        domain: domain?.trim() || null,
        address: address?.trim() || null,
        contactInfo: contactInfo?.trim() || null,
        timings: timings?.trim() || null,
        subtitle: subtitle?.trim() || null,
        logo: logo?.trim() || null,
        footerLogo: footerLogo?.trim() || null,
        // Branding & Footer fields
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        footerTagline: footerTagline?.trim() || null,
        socialLinks: socialLinks || null,
        primaryColor: primaryColor?.trim() || null,
        secondaryColor: secondaryColor?.trim() || null,
        websiteUrl: websiteUrl?.trim() || null,
        copyrightText: copyrightText?.trim() || null,
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
    const cookieStore = await cookies();
    const token = cookieStore.get("superadmin_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let decoded: { role?: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { role?: string };
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (decoded.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
