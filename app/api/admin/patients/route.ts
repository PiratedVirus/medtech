import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const patients = await prisma.user.findMany({
      where: {
        role: 'PATIENT',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
      },
      take: 20, // Limit to 20 patients for testing
    });

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
