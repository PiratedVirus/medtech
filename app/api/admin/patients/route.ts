import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminClinicIdAsync, createClinicFilter } from '@/lib/admin-clinic-middleware';
import { withUnifiedCache, getCacheConfig } from '@/lib/cache-middleware-unified';

const getPatientsHandler = async (request: NextRequest) => {
  try {
    // Get admin's clinic ID and validate subdomain matches
    const clinicId = await getAdminClinicIdAsync(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Session expired or you are accessing an incorrect clinic portal. Please log in again."
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
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/admin/patients'))(getPatientsHandler);
