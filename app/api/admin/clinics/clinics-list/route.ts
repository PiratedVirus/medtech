import { NextResponse } from "next/server";
import prisma  from "@/lib/prisma";

export async function GET() {
    try {
      const clinics = await prisma.clinic.findMany({
        where: {
          deletedAt: null
        },
        select: {
          id: true,
          name: true,
          address: true,
          contactInfo: true,
          subdomain: true,
          domain: true,
          logo: true,
          timings: true,
          subtitle: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      return NextResponse.json({
        success: true,
        clinics: clinics
      });
    } catch (error) {
      console.error("Error fetching clinics:", error);
      return NextResponse.json({ 
        success: false, 
        error: "Failed to fetch clinics" 
      }, { status: 500 });
    }
  }