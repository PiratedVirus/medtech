import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const {searchParams} = new URL(request.url);
    const doctorId = parseInt(searchParams.get("id") || "0") ;
    const checkAvailability = searchParams.get("checkAvailability") === "true";
    
    // Create clinic filter
    const userClinicFilter = createUserClinicFilter(clinicId);
    
    let where: any = {
      doctor: {
        user: userClinicFilter.user
      }
    };
    
    if (checkAvailability) {
      where.status = "AVAILABLE";
    }
    if (doctorId) {
      where.userId = doctorId;
    }

    const slots = await prisma.doctorAvailability.findMany({
      where
    });
    
    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching available slots:", error);
    return NextResponse.json({ error: "Failed to fetch available slots" }, { status: 500 });
  }
}