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
    const { name, subdomain, domain, address, contactInfo, timings, subtitle } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Clinic name is required" },
        { status: 400 }
      );
    }

    // Check if subdomain already exists
    if (subdomain) {
      const existingSubdomain = await prisma.clinic.findFirst({
        where: {
          subdomain: subdomain,
          deletedAt: null
        }
      });

      if (existingSubdomain) {
        return NextResponse.json(
          { success: false, error: "Subdomain already exists" },
          { status: 400 }
        );
      }
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
        subdomain: subdomain || null,
        domain: domain || null,
        address: address || null,
        contactInfo: contactInfo || null,
        timings: timings || null,
        subtitle: subtitle || null,
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
