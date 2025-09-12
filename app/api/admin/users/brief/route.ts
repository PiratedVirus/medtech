import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        role: true,
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Failed to load brief users:', error);
    return NextResponse.json({ success: false, error: 'Failed to load users' }, { status: 500 });
  }
}


