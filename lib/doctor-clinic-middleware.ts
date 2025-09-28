import { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function getDoctorClinicId(request: NextRequest): Promise<number | null> {
  try {
    // Get the doctor's clinic ID from the request
    // This could be from cookies, headers, or JWT token
    const cookieStore = await cookies();
    const doctorToken = cookieStore.get('doctor-token')?.value;
    
    if (!doctorToken) {
      return null;
    }

    // For now, we'll extract clinic ID from the token
    // In a real implementation, you'd decode the JWT and get the clinic ID
    // This is a simplified version - you might need to implement proper JWT decoding
    try {
      const tokenData = JSON.parse(atob(doctorToken.split('.')[1]));
      return tokenData.clinicId || null;
    } catch (error) {
      console.error('Error decoding doctor token:', error);
      return null;
    }
  } catch (error) {
    console.error('Error getting doctor clinic ID:', error);
    return null;
  }
}
