import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminClinicId, createUserClinicFilter } from '@/lib/admin-clinic-middleware';

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

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    const take = Math.min(Number(searchParams.get('take') || 50), 200);
    const skip = Math.max(Number(searchParams.get('skip') || 0), 0);

    // Create clinic filter
    const userClinicFilter = createUserClinicFilter(clinicId);

    const whereUser = q
      ? { 
          name: { contains: q, mode: 'insensitive' as const },
          ...userClinicFilter.user
        }
      : userClinicFilter.user;

    // Only include patients who have prescriptions and belong to the admin's clinic
    const patients = await prisma.user.findMany({
      where: {
        ...whereUser,
        patientPrescriptions: { some: {} },
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        aiSummaries: { select: { summaryText: true, urgency: true, lastUpdated: true, prescriptionCount: true, llmModel: true } },
        prescriptionTexts: { select: { id: true, processingStatus: true, processingError: true, createdAt: true }, orderBy: { createdAt: 'asc' } },
        // Only count prescriptions that have a linked PDF via the appointment
        patientPrescriptions: { 
          select: { 
            id: true, 
            appointment: { 
              select: { 
                prescriptionLink: true,
                doctor: {
                  select: {
                    id: true,
                    name: true,
                    role: true
                  }
                }
              } 
            } 
          }, 
          orderBy: { createdAt: 'asc' } 
        },
      },
      take,
      skip,
      orderBy: { id: 'asc' },
    });

    const rows = patients.map(p => {
      const totalPrescriptions = p.patientPrescriptions.filter(x => !!x.appointment?.prescriptionLink).length;
      const processed = p.prescriptionTexts.filter(t => t.processingStatus === 'COMPLETED').length;
      const failed = p.prescriptionTexts.filter(t => t.processingStatus === 'FAILED').length;
      const pending = totalPrescriptions - processed - failed;
      const summary = p.aiSummaries || null;
      
      // Get prescription details for expandable rows
      const prescriptionDetails = p.patientPrescriptions
        .filter(x => !!x.appointment?.prescriptionLink)
        .map(prescription => {
          const prescriptionText = p.prescriptionTexts.find(pt => pt.id === prescription.id);
          return {
            id: prescription.id,
            fileName: prescription.appointment?.prescriptionLink?.split('/').pop() || 'Prescription',
            uploadedBy: {
              name: prescription.appointment?.doctor?.name || 'Unknown Doctor',
              role: prescription.appointment?.doctor?.role || 'Doctor'
            },
            status: prescriptionText?.processingStatus || 'PENDING',
            processedAt: prescriptionText?.createdAt,
            hasAnalysis: !!prescriptionText?.processingStatus
          };
        });

      // Determine overall status based on prescription processing
      let overallStatus = 'PENDING';
      if (totalPrescriptions === 0) {
        overallStatus = 'NO_PRESCRIPTIONS';
      } else if (processed === totalPrescriptions) {
        overallStatus = 'COMPLETED';
      } else if (failed > 0) {
        overallStatus = 'PARTIAL';
      } else if (pending > 0) {
        overallStatus = 'PENDING';
      }

      return {
        id: p.id,
        name: p.name,
        phone: p.phoneNumber,
        totalPrescriptions,
        processed,
        failed,
        pending: Math.max(pending, 0),
        urgency: summary?.urgency || null,
        lastUpdated: summary?.lastUpdated || null,
        prescriptionCountInSummary: summary?.prescriptionCount || 0,
        llmModel: summary?.llmModel || null,
        hasSummary: !!summary?.summaryText,
        overallStatus,
        prescriptionDetails
      };
    });

    return NextResponse.json({ success: true, rows });
  } catch (error: any) {
    console.error('[PRESCRIPTION][INDIVIDUAL] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
