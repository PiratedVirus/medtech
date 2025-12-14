import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { decryptData } from '@/lib/encryption';
import jwt from 'jsonwebtoken';
import { getPatientClinicId } from '@/lib/patient-clinic-middleware';

export async function POST(request: NextRequest) {
  const { name, age, gender, phoneNumber, doctorCode: rawDoctorCode } = await request.json();
  
  try {
    // Get clinic ID from subdomain (set by middleware)
    const subdomainClinicId = getPatientClinicId(request);
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

    // Decrypt doctor code if it's encrypted
    let doctorCode = rawDoctorCode;
    try {
      if (rawDoctorCode && rawDoctorCode.length > 6) { // Encrypted codes are longer
        const decrypted = decryptData(rawDoctorCode);
        if (decrypted && decrypted.doctorCode) {
          doctorCode = decrypted.doctorCode;
        }
      }
    } catch (error) {
      console.error("Error decrypting doctor code:", error);
      // If decryption fails, use the raw code as is
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

    // Determine clinic ID for new patient
    let finalClinicId: number | null = null;

    // Priority 1: If doctor code provided, use doctor's clinic
    if (doctorCode) {
      const doctor = await prisma.doctorProfile.findUnique({
        where: { doctorCode },
        include: { user: true }
      });

      if (doctor?.user.clinicId) {
        finalClinicId = doctor.user.clinicId;
      }
    }
    
    // Priority 2: Use subdomain clinic (if no doctor code or doctor has no clinic)
    if (!finalClinicId && subdomainClinicId) {
      finalClinicId = subdomainClinicId;
    }

    // Priority 3: Fallback to clinic ID 1 (for backward compatibility)
    // This should rarely happen if subdomain is properly configured
    if (!finalClinicId) {
      console.warn('No clinic ID determined for new patient, using default clinic 1');
      finalClinicId = 1;
    }

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        role: 'PATIENT',
        status: 'ACTIVE',
        clinicId: finalClinicId,
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

    // Create JWT token for newly registered user
    const TOKEN_LIFETIME_DAYS = 15;
    const TOKEN_LIFETIME_SECONDS = TOKEN_LIFETIME_DAYS * 24 * 60 * 60;
    
    const token = jwt.sign(
      { plusAddedPhoneNumber: phoneNumber, userExists: true },
      process.env.JWT_SECRET!,
      { expiresIn: `${TOKEN_LIFETIME_DAYS}d` }
    );
    
    const response = NextResponse.json({ success: true, user: newUser });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: TOKEN_LIFETIME_SECONDS,
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error('Registration error:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to register user'
    }, { status: 500 });
  }
}