import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AdminTokenData {
  userId: number;
  email: string;
  role: string;
  clinicId: number;
}

export function getAdminClinicId(request: NextRequest): number | null {
  try {
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AdminTokenData;
    
    if (decoded.role !== 'ADMIN') {
      return null;
    }

    if (!decoded.clinicId) {
      // This indicates an old token without clinicId - admin needs to re-login
      console.log('Admin token missing clinicId - admin needs to re-login:', decoded.userId);
      return null;
    }

    return decoded.clinicId;
  } catch (error) {
    console.error('Error extracting admin clinic ID:', error);
    return null;
  }
}

export function createClinicFilter(clinicId: number) {
  return {
    clinicId: clinicId
  };
}

export function createUserClinicFilter(clinicId: number) {
  return {
    user: {
      clinicId: clinicId
    }
  };
}
