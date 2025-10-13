import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminClinicId, createClinicFilter } from '@/lib/admin-clinic-middleware';

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

    // Create clinic filter
    const clinicFilter = createClinicFilter(clinicId);

    const patients = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
        deletedAt: null,
        ...clinicFilter
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
      },
      take: 20, // Limit to 20 patients for testing
    });
    console.log("Patients for clinicId, ", clinicId, ", fetched:", patients);

    return NextResponse.json({
      success: true,
      data: patients,
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}
