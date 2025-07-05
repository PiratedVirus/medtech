import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay,  addMilliseconds } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();
const DAYS_PER_PAGE = 3;
const TIMEZONE = "Asia/Kolkata";

export async function GET(request: Request, props: { params: Promise<{ doctorId: string }> }) {
  const params = await props.params;
  try {
    // console.log("Received request for doctor availability");

    // 1) Extract and validate doctorId from route params
    const userId = parseInt(params.doctorId, 10); // rename this param
    if (isNaN(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 });
    }
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId },
    });
    
    if (!doctorProfile) {
      return NextResponse.json({ success: false, error: "Doctor profile not found" }, { status: 404 });
    }
    
    
    // console.log("Doctor ID:", doctorIdNum);

    // 2) Determine current page and compute day offset
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const dayOffset = (page - 1) * DAYS_PER_PAGE;

    // Convert current date/time to IST and get today's start in UTC
    const nowIST = toZonedTime(new Date(), TIMEZONE);
    const todayIST = startOfDay(nowIST);
    const todayUTC = new Date(todayIST.getTime() - todayIST.getTimezoneOffset() * 60000);

    // 3) Generate day ranges for the days per page

const dayRanges = Array.from({ length: DAYS_PER_PAGE }, (_, i) => {
  const d = addDays(todayUTC, dayOffset + i);
  return {
    dateObj: d,
    start: d,
    end: addMilliseconds(addDays(d, 1), -1),
  };
});

    // 4) Fetch available slots for the doctor within the generated day ranges
    const availability = await prisma.doctorAvailability.findMany({
      where: {
        userId,
        status: "available",
        deletedAt: null,
        OR: dayRanges.map(({ start, end }) => ({
          date: { gte: start, lte: end },
        })),
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // 5) Count available slots per day
    const slotCounts = await Promise.all(
      dayRanges.map(async ({ start, end, dateObj }) => {
        // console.log("Counting slots for day:", dateObj.toISOString(), "start:", start, "end:", end);
        const count = await prisma.doctorAvailability.count({
          where: {
            userId,
            status: "available",
            deletedAt: null,
            date: { gte: start, lte: end },
          },
        });
        return {
          date: dateObj.toISOString().split("T")[0],
          count,
        };
      })
    );

    // 6) Fetch doctor details with associated profile
    const doctorDetails = await prisma.user.findUnique({
      where: { id: userId },
      include: { doctorProfile: true },
    });

    return NextResponse.json({
      success: true,
      doctor: doctorDetails,
      availability,
      slotCounts,
      pagination: {
        page,
        daysPerPage: DAYS_PER_PAGE,
      },
    });
  } catch (error) {
    console.error("Error fetching doctor availability:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}