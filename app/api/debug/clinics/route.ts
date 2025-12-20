import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Simple endpoint to list all clinics in database
 * Access: /api/debug/clinics
 * No middleware interference - direct database query
 */
export async function GET() {
  try {
    const clinics = await prisma.clinic.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        subdomain: true,
        deletedAt: true,
        createdAt: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      total: clinics.length,
      clinics: clinics.map(c => ({
        id: c.id,
        name: c.name,
        subdomain: c.subdomain,
        subdomainLower: c.subdomain?.toLowerCase(),
        hasSubdomain: !!c.subdomain,
        createdAt: c.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug clinics error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
