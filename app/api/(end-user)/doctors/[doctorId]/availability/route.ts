import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();
const DAYS_PER_PAGE = 3;
const TIMEZONE = "Asia/Kolkata";

export async function GET(request: Request, context: { params: { doctorId: string } }) {
  try {
    console.log("Received request for doctor availability");

    // 1) Get doctorId
    const doctorIdNum = parseInt(context.params?.doctorId, 10);
    if (isNaN(doctorIdNum)) {
      console.error("Invalid doctor ID:", context.params?.doctorId);
      return NextResponse.json(
        { success: false, error: "Invalid doctor ID" },
        { status: 400 }
      );
    }
    console.log("Doctor ID:", doctorIdNum);

    // 2) Get current page from query string
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    // console.log("Page number:", page);

    const dayOffset = (page - 1) * DAYS_PER_PAGE;
    // console.log("Day offset:", dayOffset);

    // ✅ Fix: Convert local time to IST and shift it to UTC manually
    const nowIST = toZonedTime(new Date(), TIMEZONE); // Convert to IST
    const todayIST = startOfDay(nowIST); // Get start of the day in IST

    // ✅ Convert todayIST to UTC manually by subtracting IST timezone offset
    const todayUTC = new Date(todayIST.getTime() - todayIST.getTimezoneOffset() * 60000);

    // console.log("Today's date in IST:", todayIST.toLocaleString("en-IN"));
    // console.log("Today's date in UTC:", todayUTC.toISOString());

    // ✅ Fix: Use todayUTC as base for addDays()
    const dayRanges = Array.from({ length: DAYS_PER_PAGE }, (_, i) => {
      const d = addDays(todayUTC, dayOffset + i);
      return {
        dateObj: d, // Corrected Date object
        start: startOfDay(d),
        end: endOfDay(d),
      };
    });

    // console.log("Day ranges:", dayRanges);

    // 3) Fetch availability
    const availability = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: doctorIdNum,
        OR: dayRanges.map(({ start, end }) => ({
          date: {
            gte: start,
            lte: end,
          },
        })),
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // 4) Count slot availability for each day
    const slotCounts = await Promise.all(
      dayRanges.map(async ({ start, end, dateObj }) => {
        const count = await prisma.doctorAvailability.count({
          where: {
            doctorId: doctorIdNum,
            date: {
              gte: start,
              lte: end,
            },
          },
        });
        return {
          date: dateObj.toISOString().split("T")[0],
          count,
        };
      })
    );

    // console.log("Slot counts:", slotCounts);

    // 5) Fetch doctor details
    const doctorDetails = await prisma.user.findUnique({
      where: { id: doctorIdNum },
      include: { doctorProfile: true },
    });

    // console.log("Doctor details:", doctorDetails);

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
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}