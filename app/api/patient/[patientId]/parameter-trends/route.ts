import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireUserAuth, handleAuthError } from '@/lib/clinic-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patientId: string }> }
) {
  try {
    // Authenticate user and validate clinic access
    const auth = await requireUserAuth();
    if (!auth.success) {
      return handleAuthError(auth);
    }
    
    const clinicId = auth.clinicId;
    
    const { patientId } = await params;
    const patientIdNum = parseInt(patientId);

    if (!patientIdNum || isNaN(patientIdNum)) {
      return NextResponse.json({ error: 'Invalid patient ID' }, { status: 400 });
    }

    // Multi-tenancy: Verify patient belongs to the same clinic
    if (clinicId) {
      const patient = await prisma.user.findFirst({
        where: { id: patientIdNum, clinicId, deletedAt: null }
      });
      if (!patient) {
        return NextResponse.json({ error: 'Patient not found or access denied' }, { status: 403 });
      }
    }

    // Get all trend data for the patient from both lab reports and standalone reports
    const trendData = await prisma.reportTrendData.findMany({
      where: {
        patientId: patientIdNum,
        deletedAt: null
      },
      include: {
        labBooking: {
          select: {
            id: true,
            labDate: true,
            labPackage: {
              select: {
                name: true
              }
            }
          }
        },
        sourceReport: {
          select: {
            id: true,
            llmModel: true,
            processedAt: true
          }
        }
      },
      orderBy: [
        { parameter: 'asc' },
        { reportDate: 'asc' }
      ]
    });

    // Group by parameter
    const parameterGroups = new Map<string, typeof trendData>();
    
    for (const data of trendData) {
      if (!parameterGroups.has(data.parameter)) {
        parameterGroups.set(data.parameter, []);
      }
      parameterGroups.get(data.parameter)!.push(data);
    }

    // Calculate trends for each parameter
    const trends = Array.from(parameterGroups.entries()).map(([parameter, values]) => {
      if (values.length < 2) {
        return null; // Skip parameters with fewer than 2 readings — need at least 2 to show a trend
      }

      // Sort by date
      const sortedValues = values.sort((a, b) => 
        new Date(a.reportDate).getTime() - new Date(b.reportDate).getTime()
      );

      const latest = sortedValues[sortedValues.length - 1];
      const previous = sortedValues.length > 1 ? sortedValues[sortedValues.length - 2] : null;

      // Calculate trend
      const latestValue = parseFloat(latest.value) || 0;
      const previousValue = previous ? parseFloat(previous.value) || 0 : 0;
      
      let trend: 'IMPROVING' | 'STABLE' | 'WORSENING' = 'STABLE';
      let changePercent = 0;

      if (previous && previousValue !== 0) {
        changePercent = ((latestValue - previousValue) / previousValue) * 100;
        
        // For abnormal values, improvement means moving towards normal
        if (latest.isAbnormal && previous.isAbnormal) {
          // Both abnormal - check if severity improved
          const severityOrder = { 'LOW': 1, 'NORMAL': 2, 'HIGH': 3, 'CRITICAL': 4 };
          const latestSeverity = severityOrder[latest.severity as keyof typeof severityOrder] || 2;
          const previousSeverity = severityOrder[previous.severity as keyof typeof severityOrder] || 2;
          
          if (latestSeverity < previousSeverity) {
            trend = 'IMPROVING';
          } else if (latestSeverity > previousSeverity) {
            trend = 'WORSENING';
          }
        } else if (!latest.isAbnormal && previous.isAbnormal) {
          trend = 'IMPROVING';
        } else if (latest.isAbnormal && !previous.isAbnormal) {
          trend = 'WORSENING';
        } else {
          // Both normal - check if values are getting closer to optimal
          const normalRange = parseNormalRange(latest.normalRange || '');
          if (normalRange) {
            const latestDistance = Math.abs(latestValue - (normalRange.min + normalRange.max) / 2);
            const previousDistance = Math.abs(previousValue - (normalRange.min + normalRange.max) / 2);
            
            if (latestDistance < previousDistance) {
              trend = 'IMPROVING';
            } else if (latestDistance > previousDistance) {
              trend = 'WORSENING';
            }
          }
        }
      }

      return {
        parameter,
        values: sortedValues.map(v => ({
          id: v.id,
          parameter: v.parameter,
          value: v.value,
          unit: v.unit || '',
          normalRange: v.normalRange || '',
          isAbnormal: v.isAbnormal,
          severity: v.severity || 'NORMAL',
          reportDate: v.reportDate.toISOString(),
          labBookingId: v.labBookingId,
          sourceReportId: v.sourceReportId,
          reportSource: v.labBooking?.labPackage?.name || 'Standalone Report'
        })),
        trend,
        changePercent,
        latestValue: latest.value,
        latestDate: latest.reportDate.toISOString(),
        normalRange: latest.normalRange || '',
        unit: latest.unit || '',
        isAbnormal: latest.isAbnormal,
        severity: latest.severity || 'NORMAL'
      };
    }).filter(Boolean);

    return NextResponse.json({ 
      success: true, 
      trends,
      totalParameters: trends.length,
      totalDataPoints: trendData.length
    });

  } catch (error) {
    console.error('[PARAMETER-TRENDS][GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parameter trends' },
      { status: 500 }
    );
  }
}

function parseNormalRange(normalRange: string): { min: number; max: number } | null {
  if (!normalRange) return null;
  
  // Try different patterns for normal range
  const patterns = [
    /(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/,  // "10-20"
    /(\d+(?:\.\d+)?)\s*to\s*(\d+(?:\.\d+)?)/,  // "10 to 20"
    /(\d+(?:\.\d+)?)\s*–\s*(\d+(?:\.\d+)?)/,  // "10–20" (en dash)
    /(\d+(?:\.\d+)?)\s*–\s*(\d+(?:\.\d+)?)/,  // "10–20" (em dash)
  ];

  for (const pattern of patterns) {
    const match = normalRange.match(pattern);
    if (match) {
      return {
        min: parseFloat(match[1]),
        max: parseFloat(match[2])
      };
    }
  }

  return null;
}
