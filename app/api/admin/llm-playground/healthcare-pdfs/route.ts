import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    console.log('Starting to fetch healthcare PDFs...');
    
    // Fetch all PDFs from appointments (prescriptionLink)
    const appointmentPdfs = await prisma.appointment.findMany({
      where: {
        prescriptionLink: {
          not: null
        }
      },
      select: {
        id: true,
        prescriptionLink: true,
        fullName: true,
        mobile: true,
        createdAt: true,
        doctor: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${appointmentPdfs.length} appointment PDFs`);

    // Fetch all PDFs from lab bookings (reportLink via labResult)
    const labBookingPdfs = await prisma.labBooking.findMany({
      where: {
        labResult: {
          isEmpty: false
        }
      },
      select: {
        id: true,
        labResult: true,
        fullName: true,
        mobile: true,
        createdAt: true,
        labPackage: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${labBookingPdfs.length} lab booking PDFs`);

    // Fetch all PDFs from appointment reports
    const appointmentReportPdfs = await prisma.appointmentReport.findMany({
      select: {
        id: true,
        fileUrl: true,
        fileName: true,
        uploadedAt: true,
        appointmentId: true,
        appointment: {
          select: {
            fullName: true,
            mobile: true,
            doctor: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        uploadedAt: 'desc'
      }
    });
    
    console.log(`Found ${appointmentReportPdfs.length} appointment report PDFs`);

    // Fetch all PDFs from standalone reports
    const standaloneReportPdfs = await prisma.standaloneReport.findMany({
      where: {
        reportType: {
          in: ['lab_report', 'prescription', 'medical_document']
        }
      },
      select: {
        id: true,
        fileUrl: true,
        fileName: true,
        reportType: true,
        createdAt: true,
        patient: {
          select: {
            name: true,
            phoneNumber: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${standaloneReportPdfs.length} standalone report PDFs`);

    // Transform appointment PDFs
    const transformedAppointmentPdfs = appointmentPdfs.map(apt => ({
      id: `apt-${apt.id}`,
      fileUrl: apt.prescriptionLink!,
      fileName: `Prescription - ${apt.fullName || 'Unknown'} (${apt.id})`,
      uploadedAt: apt.createdAt,
      type: 'prescription',
      patientName: apt.fullName,
      patientPhone: apt.mobile,
      doctorName: apt.doctor?.name,
      source: 'appointment'
    }));

    // Transform lab booking PDFs (flatten labResult array)
    const transformedLabPdfs = labBookingPdfs.flatMap(booking => 
      booking.labResult.map((result, index) => ({
        id: `lab-${booking.id}-${index}`,
        fileUrl: result,
        fileName: `Lab Report - ${booking.fullName || 'Unknown'} (${booking.labPackage?.name || 'Unknown Package'}) - ${index + 1}`,
        uploadedAt: booking.createdAt,
        type: 'lab_report',
        patientName: booking.fullName,
        patientPhone: booking.mobile,
        packageName: booking.labPackage?.name,
        source: 'lab_booking'
      }))
    );

    // Transform appointment report PDFs
    const transformedAppointmentReportPdfs = appointmentReportPdfs.map(report => ({
      id: `report-${report.id}`,
      fileUrl: report.fileUrl,
      fileName: report.fileName,
      uploadedAt: report.uploadedAt,
      type: 'appointment_report',
      patientName: report.appointment?.fullName,
      patientPhone: report.appointment?.mobile,
      doctorName: report.appointment?.doctor?.name,
      source: 'appointment_report'
    }));

    // Transform standalone report PDFs
    const transformedStandalonePdfs = standaloneReportPdfs.map(report => ({
      id: `standalone-${report.id}`,
      fileUrl: report.fileUrl,
      fileName: report.fileName,
      uploadedAt: report.createdAt,
      type: report.reportType,
      patientName: report.patient?.name,
      patientPhone: report.patient?.phoneNumber,
      source: 'standalone_report'
    }));

    // Combine all PDFs and sort by upload date
    const allPdfs = [
      ...transformedAppointmentPdfs,
      ...transformedLabPdfs,
      ...transformedAppointmentReportPdfs,
      ...transformedStandalonePdfs
    ].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    console.log(`Total PDFs found: ${allPdfs.length}`);

    return NextResponse.json({ 
      success: true, 
      data: allPdfs,
      summary: {
        total: allPdfs.length,
        prescriptions: transformedAppointmentPdfs.length,
        labReports: transformedLabPdfs.length,
        appointmentReports: transformedAppointmentReportPdfs.length,
        standaloneReports: transformedStandalonePdfs.length
      }
    });
  } catch (error) {
    console.error('Error fetching healthcare PDFs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch PDFs' },
      { status: 500 }
    );
  }
}
