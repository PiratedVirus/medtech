import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const clinics = await prisma.clinic.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            users: {
              where: { deletedAt: null }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      clinics
    });
  } catch (error) {
    console.error("Fetch clinics error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Clinic name is required" },
        { status: 400 }
      );
    }

    // Subdomain is now required for clinic-specific patient portals
    if (!subdomain || subdomain.trim() === '') {
      return NextResponse.json(
        { success: false, error: "Subdomain is required for clinic creation" },
        { status: 400 }
      );
    }

    // Validate subdomain format: alphanumeric and hyphens only, 3-63 characters
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
    const normalizedSubdomain = subdomain.toLowerCase().trim();
    
    if (!subdomainRegex.test(normalizedSubdomain)) {
      return NextResponse.json(
        { success: false, error: "Subdomain must be 3-63 characters, alphanumeric with hyphens only, and start/end with alphanumeric" },
        { status: 400 }
      );
    }

    // Check if subdomain already exists
    const existingSubdomain = await prisma.clinic.findFirst({
      where: {
        subdomain: normalizedSubdomain,
        deletedAt: null
      }
    });

    if (existingSubdomain) {
      return NextResponse.json(
        { success: false, error: "Subdomain already exists" },
        { status: 400 }
      );
    }

    // Check if domain already exists
    if (domain) {
      const existingDomain = await prisma.clinic.findFirst({
        where: {
          domain: domain,
          deletedAt: null
        }
      });

      if (existingDomain) {
        return NextResponse.json(
          { success: false, error: "Domain already exists" },
          { status: 400 }
        );
      }
    }

    const clinic = await prisma.clinic.create({
      data: {
        name,
        subdomain: normalizedSubdomain,
        domain: domain || null,
        address: address || null,
        contactInfo: contactInfo || null,
        timings: timings || null,
        subtitle: subtitle || null,
        logo: logo || null,
        footerLogo: footerLogo || null,
        // Branding & Footer fields
        email: email || null,
        phone: phone || null,
        footerTagline: footerTagline || null,
        socialLinks: socialLinks || null,
        primaryColor: primaryColor || null,
        secondaryColor: secondaryColor || null,
        websiteUrl: websiteUrl || null,
        copyrightText: copyrightText || null,
      },
      include: {
        _count: {
          select: {
            users: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      clinic
    });
  } catch (error) {
    console.error("Create clinic error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
