import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();

  try {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        patientProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message });
  }
}