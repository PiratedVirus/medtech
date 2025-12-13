import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SmartCacheInvalidation } from "@/lib/cache-dependencies";

// GET: Retrieve the user info based on the logged-in user's ID
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    
    // Validate userId is provided and not "undefined" string
    if (!userId || userId === "undefined" || userId === "null") {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate userId is a valid number
    const userIdNum = Number(userId);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      return NextResponse.json(
        { error: "Invalid User ID" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      include: {
        patientProfile: true,  // include patient profile details if available
        doctorProfile: true,   // include doctor profile details if available
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error: any) {
    console.error("Error fetching user info:", error);
    return NextResponse.json(
      { error: "Failed to fetch user info" },
      { status: 500 }
    );
  }
}

// PUT: Update the user info along with nested patient profile (if provided)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      phoneNumber,
      email,
      name,
      role,
      status,
      patientProfile,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: {
        phoneNumber,
        email,
        name,
        role,
        status,
        patientProfile: patientProfile
          ? {
              upsert: {
                update: {
                  weight: patientProfile.weight,
                  height: patientProfile.height,
                  gender: patientProfile.gender,
                  bloodGroup: patientProfile.bloodGroup,
                  allergies: patientProfile.allergies,
                  personalHistory: patientProfile.personalHistory,
                  pastMedicalHistory: patientProfile.pastMedicalHistory,
                  familyHistory: patientProfile.familyHistory,
                  medicalHistory: patientProfile.medicalHistory,
                  emergencyContact: patientProfile.emergencyContact,
                  address: patientProfile.address,
                  dateOfBirth: patientProfile.dateOfBirth
                    ? new Date(patientProfile.dateOfBirth)
                    : undefined,
                },
                create: {
                  age: patientProfile.age ?? 0,
                  weight: patientProfile.weight,
                  height: patientProfile.height,
                  gender: patientProfile.gender || 'Other',
                  bloodGroup: patientProfile.bloodGroup,
                  allergies: patientProfile.allergies,
                  personalHistory: patientProfile.personalHistory,
                  pastMedicalHistory: patientProfile.pastMedicalHistory,
                  familyHistory: patientProfile.familyHistory,
                  medicalHistory: patientProfile.medicalHistory,
                  emergencyContact: patientProfile.emergencyContact,
                  address: patientProfile.address,
                  dateOfBirth: patientProfile.dateOfBirth
                    ? new Date(patientProfile.dateOfBirth)
                    : undefined,
                }
              }
            }
          : undefined,
      },
      include: {
        patientProfile: true,
        doctorProfile: true,
      },
    });

    // ✅ HIGH PRIORITY: Smart cache invalidation with dependencies
    try {
      await SmartCacheInvalidation.onUserUpdate(Number(userId), {
        patientProfile: patientProfile,
        // Add other relevant changes here
      });
      console.log(`[PROFILE] Smart cache invalidation completed for user ${userId}`);
    } catch (cacheError) {
      console.error('[PROFILE] Error in smart cache invalidation:', cacheError);
      // Fallback to basic cache invalidation
      try {
        const { invalidateAllUserCaches, getUserPhoneNumber } = await import('@/lib/cache-invalidation');
        const phoneNumber = await getUserPhoneNumber(Number(userId));
        await invalidateAllUserCaches(Number(userId), phoneNumber || undefined);
        console.log(`[PROFILE] Fallback cache invalidation completed for user ${userId}`);
      } catch (fallbackError) {
        console.error('[PROFILE] Fallback cache invalidation also failed:', fallbackError);
      }
    }

    return NextResponse.json({
      data: updatedUser,
      message: "User info updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating user info:", error);
    return NextResponse.json(
      { error: "Failed to update user info" },
      { status: 500 }
    );
  }
}