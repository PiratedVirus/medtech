import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { tokenUserWhere } from '@/lib/clinic-auth';

export async function getDoctorClinicId(request: NextRequest): Promise<number | null> {
  try {
    // Get the doctor's token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    
    if (!token) {
      return null;
    }

    // Decode the JWT token to get the phone number
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      console.error('Error verifying token:', err);
      return null;
    }

    const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
    if (!phoneNumber) {
      return null;
    }

    // Find the user and get their clinic ID
    const user = await prisma.user.findFirst({
      where: await tokenUserWhere(decoded),
      select: { 
        clinicId: true,
        role: true
      }
    });

    if (!user || user.role !== 'DOCTOR') {
      return null;
    }

    return user.clinicId;
  } catch (error) {
    console.error('Error getting doctor clinic ID:', error);
    return null;
  }
}
