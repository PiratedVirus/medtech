import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Step 1: Await cookies() and extract token
    const cookieStore = await cookies(); //  Await cookies()
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Step 2: Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      phoneNumber: string;
    };
    if (!decoded.phoneNumber) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 403 },
      );
    }

    // Step 3: Fetch user details from the database using phoneNumber
    const onlyUser = await prisma.user.findUnique({
      where: { phoneNumber: decoded.phoneNumber },
      include: { patientProfile: true },
    });

    const subscriptionDetails = await prisma.subscriptionTracker.findFirst({
      where: {
        patientId: onlyUser?.patientProfile?.id,
        isActive: true,
        endDate: {
          gt: new Date(),
        },
      },
    });

    const user = { ...onlyUser, subscriptionDetails };

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Token verification failed" },
      { status: 403 },
    );
  }
}
