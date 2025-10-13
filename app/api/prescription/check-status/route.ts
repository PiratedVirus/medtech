import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: "Missing patient ID" },
        { status: 400 }
      );
    }

    // Get all prescriptions for this patient (only those with PDFs)
    const allPrescriptions = await prisma.prescription.findMany({
      where: {
        patientId: parseInt(patientId),
        appointment: {
          prescriptionLink: {
            not: null
          }
        }
      },
      include: {
        appointment: {
          select: {
            prescriptionLink: true
          }
        },
        prescriptionText: {
          select: {
            processingStatus: true,
            processedAt: true,
            processingError: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Map to the format expected by the frontend
    const prescriptionStatuses = allPrescriptions.map(prescription => {
      const prescriptionText = prescription.prescriptionText;
      return {
        id: prescription.id,
        fileName: prescription.appointment?.prescriptionLink?.split('/').pop() || `Prescription ${prescription.id}`,
        status: prescriptionText?.processingStatus || 'PENDING',
        processedAt: prescriptionText?.processedAt,
        processingError: prescriptionText?.processingError,
        hasAnalysis: prescriptionText?.processingStatus === 'COMPLETED'
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        prescriptionStatuses,
        totalPrescriptions: prescriptionStatuses.length,
        completed: prescriptionStatuses.filter(p => p.status === 'COMPLETED').length,
        processing: prescriptionStatuses.filter(p => p.status === 'PROCESSING').length,
        failed: prescriptionStatuses.filter(p => p.status === 'FAILED').length,
        pending: prescriptionStatuses.filter(p => p.status === 'PENDING').length
      }
    });

  } catch (error) {
    console.error("[PRESCRIPTION-CHECK-STATUS] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
