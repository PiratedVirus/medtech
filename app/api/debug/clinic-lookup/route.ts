import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { extractSubdomain } from '@/lib/clinic-context-middleware';

/**
 * Debug endpoint to check clinic lookup
 * Usage: /api/debug/clinic-lookup?subdomain=manipal
 * Or it will extract from hostname if no query param
 * 
 * This endpoint is excluded from middleware, so it should always be accessible
 */
export async function GET(request: NextRequest) {
  console.log('[DEBUG] Clinic lookup endpoint called');
  console.log('[DEBUG] Hostname:', request.headers.get('host'));
  console.log('[DEBUG] URL:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const subdomainParam = searchParams.get('subdomain');
    
    // Get subdomain from query param or hostname
    let subdomain: string | null = null;
    if (subdomainParam) {
      subdomain = subdomainParam.toLowerCase().trim();
    } else {
      const hostname = request.headers.get('host') || '';
      subdomain = extractSubdomain(hostname);
    }

    if (!subdomain) {
      return NextResponse.json({
        error: 'No subdomain provided or found in hostname',
        hostname: request.headers.get('host'),
      }, { status: 400 });
    }

    // Get all clinics for debugging
    const allClinics = await prisma.clinic.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        deletedAt: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    // Try exact match (case-sensitive)
    const exactMatch = await prisma.clinic.findFirst({
      where: {
        subdomain: subdomain,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        subdomain: true
      }
    });

    // Try case-insensitive match
    const caseInsensitiveMatch = await prisma.$queryRaw<Array<{ id: number; name: string; subdomain: string }>>`
      SELECT id, name, subdomain FROM "Clinic" 
      WHERE LOWER(subdomain) = LOWER(${subdomain})
      AND "deletedAt" IS NULL
      LIMIT 1
    `;

    return NextResponse.json({
      searchedSubdomain: subdomain,
      hostname: request.headers.get('host'),
      exactMatch: exactMatch || null,
      caseInsensitiveMatch: caseInsensitiveMatch && caseInsensitiveMatch.length > 0 ? caseInsensitiveMatch[0] : null,
      allClinics: allClinics.map(c => ({
        id: c.id,
        name: c.name,
        subdomain: c.subdomain,
        subdomainLower: c.subdomain?.toLowerCase()
      })),
      totalClinics: allClinics.length
    });
  } catch (error) {
    console.error('Debug clinic lookup error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
