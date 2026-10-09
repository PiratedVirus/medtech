import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";
import { tokenUserWhere } from "@/lib/clinic-auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
    if (!phoneNumber) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const user = await prisma.user.findFirst({
      where: await tokenUserWhere(decoded),
    });
    if (!user || user.role !== "PATHOLOGY") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentTime = new Date();
    // Use Date object for Prisma filters (assignedDate is a Date in schema)
    const startOfToday = new Date(currentTime);
    startOfToday.setHours(0, 0, 0, 0);
    const currentTimeString = currentTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Find assignments that should be moved from upcoming to ongoing
    // Criteria: ASSIGNED status + assigned date/time has passed
    const assignmentsToMove = await prisma.labAssignment.findMany({
      where: {
        status: "ASSIGNED", // Ready to start but not started yet
        assignedDate: { lte: startOfToday }, // Date has passed or is today
        deletedAt: null,
      },
    });

    let movedCount = 0;

    for (const assignment of assignmentsToMove) {
      // Check if the assigned time has passed
      const assignedTime = assignment.assignedTime;
      const currentTimeMinutes = parseInt(currentTimeString.split(':')[0]) * 60 + parseInt(currentTimeString.split(':')[1]);
      const assignedTimeMinutes = parseInt(assignedTime.split(':')[0]) * 60 + parseInt(assignedTime.split(':')[1]);

      // If assigned time has passed, move to ongoing
      if (assignedTimeMinutes <= currentTimeMinutes) {
        await prisma.labAssignment.update({
          where: { id: assignment.id },
          data: {
            status: "PHLEBOTOMIST_LEFT", // Move to ongoing
          },
        });

        // Also update the linked lab booking
        if (assignment.labBookingId) {
          await prisma.labBooking.update({
            where: { id: assignment.labBookingId },
            data: {
              status: "PHLEBOTOMIST_LEFT",
            },
          });
        }

        movedCount++;
        console.log(`✅ Moved assignment ${assignment.id} from upcoming to ongoing (time-based)`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Moved ${movedCount} assignments from upcoming to ongoing`,
      movedCount,
    });
  } catch (error) {
    console.error("Error checking time-based movement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 