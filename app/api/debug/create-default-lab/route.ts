import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    // Check if any labs exist
    const existingLabs = await prisma.pathologyLab.findMany();
    
    if (existingLabs.length === 0) {
      // Create a default lab
      const defaultLab = await prisma.pathologyLab.create({
        data: {
          name: "Default Pathology Lab",
          address: "123 Main Street",
          contactNumber: "+91-1234567890",
          email: "lab@example.com",
          licenseNumber: "LAB001",
          isActive: true,
        },
      });
      
      return NextResponse.json({
        success: true,
        message: "Default lab created",
        lab: defaultLab
      });
    } else {
      return NextResponse.json({
        success: true,
        message: "Labs already exist",
        labs: existingLabs
      });
    }
  } catch (error) {
    console.error("Create default lab error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 