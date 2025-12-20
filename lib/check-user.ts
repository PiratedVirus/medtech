import prisma from "@/lib/prisma";

/**
 * Check if user exists by phone number
 * 
 * MULTI-TENANCY: If clinicId is provided, checks for user in that specific clinic.
 * Same phone number can exist in multiple clinics.
 * 
 * @param phoneNumber - The phone number to check
 * @param clinicId - Optional clinic ID to scope the search (for multi-tenancy)
 * @returns User if found, null otherwise
 */
export async function checkUserExists(
  phoneNumber: string, 
  clinicId?: number | null
): Promise<any> {
  // Build the where clause
  const whereClause: any = { 
    phoneNumber, 
    deletedAt: null 
  };
  
  // If clinicId is provided, filter by it (multi-tenancy)
  if (clinicId !== undefined && clinicId !== null) {
    whereClause.clinicId = clinicId;
  }
  
  const user = await prisma.user.findFirst({
    where: whereClause,
  });
  
  console.log(
    "[checkUserExists] Phone:", phoneNumber, 
    "ClinicId:", clinicId ?? "any", 
    "Found:", user ? `User ${user.id}` : "null"
  );

  return user;
}

/**
 * Check if user exists in ANY clinic (for checking if phone is registered anywhere)
 * Useful for displaying different messages to users
 */
export async function checkUserExistsInAnyClinic(phoneNumber: string): Promise<any> {
  const user = await prisma.user.findFirst({
    where: { 
      phoneNumber, 
      deletedAt: null 
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          subdomain: true
        }
      }
    }
  });

  return user;
}

/**
 * Get all clinics where a phone number is registered
 */
export async function getUserClinics(phoneNumber: string): Promise<any[]> {
  const users = await prisma.user.findMany({
    where: { 
      phoneNumber, 
      deletedAt: null 
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          subdomain: true
        }
      }
    }
  });
  
  return users;
}
