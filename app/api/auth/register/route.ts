import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const { name, age, gender, phoneNumber } = await request.json();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User already exists' });
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        role: 'PATIENT',
        status: 'ACTIVE',
        clinicId: 2, // Hardcoded for now
        patientProfile: {
          create: {
            age: parseInt(age, 10),
            gender,
            weight: null,
            height: null,
            bloodGroup: null,
            allergies: null,
            medicalHistory: null,
            emergencyContact: null,
          },
        },
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as any).message });
  }
}