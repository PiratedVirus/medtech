import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Helper function to verify doctor token and get profile
async function verifyDoctorToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      plusAddedPhoneNumber: string;
      role: string;
    };

    if (!decoded.plusAddedPhoneNumber || decoded.role !== "DOCTOR") {
      return null;
    }

    const doctor = await prisma.user.findFirst({
      where: {
        phoneNumber: decoded.plusAddedPhoneNumber,
        role: "DOCTOR",
        status: "ACTIVE",
        deletedAt: null,
      },
      include: {
        doctorProfile: true,
      },
    });

    return doctor;
  } catch (error) {
    console.error("Error verifying doctor token:", error);
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token?.value) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctor = await verifyDoctorToken(token.value);
    if (!doctor?.doctorProfile) {
      return new NextResponse("Doctor profile not found", { status: 404 });
    }

    return NextResponse.json({
      id: doctor.id,
      name: doctor.name,
      email: doctor.email,
      phoneNumber: doctor.phoneNumber,
      doctorCode: doctor.doctorProfile.doctorCode,
      specialty: doctor.doctorProfile.specialty,
      yearsOfExperience: doctor.doctorProfile.yearsOfExperience,
      consultationFee: doctor.doctorProfile.consultationFee,
      isDietician: doctor.doctorProfile.isDietician,
    });
  } catch (error) {
    console.error("Error fetching doctor profile:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 