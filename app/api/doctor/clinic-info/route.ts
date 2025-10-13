import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getDoctorClinicId } from "@/lib/doctor-clinic-middleware";

export async function GET(request: NextRequest) {
  try {
    // Get doctor's clinic ID
    const clinicId = await getDoctorClinicId(request);
    console.log("Clinic ID from middleware:", clinicId);
    
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    // Fetch clinic details
    const clinic = await prisma.clinic.findUnique({
      where: { 
        id: clinicId,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        logo: true,
        address: true,
        contactInfo: true,
        timings: true,
        subtitle: true,
        domain: true
      }
    });

    console.log("Clinic data from database:", clinic);

    if (!clinic) {
      return NextResponse.json({ 
        error: "Clinic not found" 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      clinic: clinic
    });
  } catch (error) {
    console.error("Error fetching clinic info:", error);
    return NextResponse.json({ 
      error: "Failed to fetch clinic information" 
    }, { status: 500 });
  }
}
