import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const { name, age, gender, phoneNumber, doctorCode } = await request.json();
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { 
        phoneNumber,
        deletedAt: null 
      },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User already exists' });
    }

    // If doctor code is provided, validate it
    if (doctorCode) {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { doctorCode },
        include: { user: true }
      });

      if (!doctor) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid doctor code' 
        });
      }

      if (doctor.user.status !== 'ACTIVE') {
        return NextResponse.json({ 
          success: false, 
          error: 'The doctor associated with this code is not active' 
        });
      }
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        role: 'PATIENT',
        status: 'ACTIVE',
        clinicId: doctorCode ? undefined : 1, // Use doctor's clinic if code provided
        doctorCode: doctorCode || null, // Store the doctor code
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
      include: {
        patientProfile: true,
      },
    });

    // If doctor code was provided, update the user's clinic to match the doctor's clinic
    if (doctorCode) {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { doctorCode },
        include: { user: true }
      });

      if (doctor?.user.clinicId) {
        await prisma.user.update({
          where: { id: newUser.id },
          data: { clinicId: doctor.user.clinicId }
        });
      }
    }

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to register user'
    }, { status: 500 });
  }
}