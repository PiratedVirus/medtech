import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { decryptData } from '@/lib/encryption';
import jwt from 'jsonwebtoken';
import { getSubdomainClinicFromRequest } from '@/lib/clinic-auth';

export async function POST(request: NextRequest) {
  const { name, age, gender, phoneNumber, doctorCode: rawDoctorCode } = await request.json();
  
  try {
    // Get clinic ID from subdomain for multi-tenancy
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);
    
    // Determine clinic ID for new patient FIRST (before checking existence)
    let finalClinicId: number | null = null;

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
    }

    // If doctor code is provided, validate it and get clinic
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

      // Priority 1: Use doctor's clinic if provided
      if (doctor.user.clinicId) {
        finalClinicId = doctor.user.clinicId;
        
        // Validate doctor belongs to this clinic (if subdomain is set)
        if (subdomainClinicId && doctor.user.clinicId !== subdomainClinicId) {
          return NextResponse.json({ 
            success: false, 
            error: 'This doctor code is not valid for this clinic' 
          });
        }
      }
    }
    
    // Priority 2: Use subdomain clinic
    if (!finalClinicId && subdomainClinicId) {
      finalClinicId = subdomainClinicId;
    }

    // Priority 3: Fallback to clinic ID 1
    if (!finalClinicId) {
      console.warn('No clinic ID determined for new patient, using default clinic 1');
      finalClinicId = 1;
    }

    // ===== MULTI-TENANCY: Check if user exists in THIS specific clinic =====
    // A patient can register with same phone number in multiple clinics
    const existingUserInThisClinic = await prisma.user.findFirst({
      where: { 
        phoneNumber,
        clinicId: finalClinicId,
        deletedAt: null 
      },
    });

    if (existingUserInThisClinic) {
      return NextResponse.json({ 
        success: false, 
        error: 'You are already registered with this clinic' 
      });
    }

    // Check if user exists as staff in any clinic (staff cannot register as patient)
    const existingStaffUser = await prisma.user.findFirst({
      where: { 
        phoneNumber,
        role: { in: ['DOCTOR', 'DIETICIAN', 'LAB_TECH', 'PATHOLOGY', 'PHLEBOTOMIST', 'ADMIN', 'SUPER_ADMIN'] },
        deletedAt: null 
      },
    });

    if (existingStaffUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'This phone number is registered as a staff member. Staff accounts cannot be used for patient registration.' 
      });
    }

    console.log(`[REGISTER] Creating new patient in clinic ${finalClinicId} for phone ${phoneNumber}`);

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

    // Create JWT token for newly registered user with clinicId for multi-tenancy
    const TOKEN_LIFETIME_DAYS = 15;
    const TOKEN_LIFETIME_SECONDS = TOKEN_LIFETIME_DAYS * 24 * 60 * 60;
    
    const token = jwt.sign(
      { 
        plusAddedPhoneNumber: phoneNumber, 
        userExists: true,
        userRole: 'PATIENT',
        userId: newUser.id,  // Include userId for direct lookup
        clinicId: finalClinicId  // Include clinicId for multi-tenancy verification
      },
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