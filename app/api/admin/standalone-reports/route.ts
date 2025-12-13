import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAdminClinicId, createUserClinicFilter } from '@/lib/admin-clinic-middleware';
import { withUnifiedCache, getCacheConfig } from '@/lib/cache-middleware-unified';

export const runtime = 'nodejs';

const getStandaloneReportsHandler = async (request: NextRequest) => {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '100');
    const search = searchParams.get('search') || '';

    // Create clinic filter
    const userClinicFilter = createUserClinicFilter(clinicId);

    // Build where clause with clinic isolation
    const where: any = {
      deletedAt: null,
      patient: userClinicFilter.user
    };

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' as const } },
        { patient: { name: { contains: search, mode: 'insensitive' as const } } },
        { uploadedBy: { name: { contains: search, mode: 'insensitive' as const } } }
      ];
    }

    // Get standalone reports with patient and uploader info
    const reports = await prisma.standaloneReport.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        reportAnalyses: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    });

    // Get total count for pagination
    const total = await prisma.standaloneReport.count({ where });

    // Transform data for frontend
    const transformedReports = reports.map(report => {
      return {
        id: report.id,
        fileName: report.fileName,
        fileUrl: report.fileUrl,
        fileSize: report.fileSize,
        mimeType: report.mimeType,
        reportType: report.reportType,
        status: report.status,
        processingError: report.processingError,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        patient: {
          id: report.patient.id,
          name: report.patient.name,
          phone: report.patient.phoneNumber
        },
        uploadedBy: {
          id: report.uploadedBy.id,
          name: report.uploadedBy.name,
          role: report.uploadedBy.role
        },
        analyses: report.reportAnalyses.map(analysis => ({
          id: analysis.id,
          analysisType: analysis.analysisType,
          processingStatus: analysis.processingStatus,
          processingError: analysis.processingError,
          extractedText: analysis.extractedText,
          llmSummary: analysis.llmSummary,
          allValues: analysis.allValues,
          criticalValues: analysis.criticalValues,
          keyFindings: analysis.keyFindings,
          recommendations: analysis.recommendations,
          urgency: analysis.urgency,
          llmModel: analysis.llmModel,
          processedAt: analysis.processedAt?.toISOString(),
          createdAt: analysis.createdAt.toISOString()
        }))
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedReports,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });

  } catch (error: any) {
    console.error('Error fetching standalone reports:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Internal server error' 
    }, { status: 500 });
  }
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/admin/standalone-reports'))(getStandaloneReportsHandler);
