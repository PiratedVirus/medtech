import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { phoneNumber } = await request.json();

  try {
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    return NextResponse.json({ exists: !!existingUser });
  } catch (error) {
    return NextResponse.json({ exists: false, error: (error as any).message });
  }
}