import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { addDays, startOfDay, endOfDay } from "date-fns";

const prisma = new PrismaClient();

// We'll show 3 days per "page" of results
const DAYS_PER_PAGE = 3;

export async function GET(request: Request, context: { params: { doctorId: string } }) {
  try {
    // 1) Get doctorId
    const doctorIdNum = parseInt(context.params.doctorId, 10);
    if (isNaN(doctorIdNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid doctor ID" },
        { status: 400 }
      );
    }

    // 2) Get current page from query string, defaulting to 1
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    // e.g. page=1 → first chunk, page=2 → second chunk, etc.
    const dayOffset = (page - 1) * DAYS_PER_PAGE;
    const today = startOfDay(new Date());

    // Build an array of day ranges for these 3 days
    const dayRanges = Array.from({ length: DAYS_PER_PAGE }, (_, i) => {
      const d = addDays(today, dayOffset + i);
      return {
        dateObj: d,          // store the actual Date object
        start: startOfDay(d),
        end: endOfDay(d),
      };
    });

    // 3) Fetch all availability that falls in these day ranges
    const availability = await prisma.doctorAvailability.findMany({
      where: {
        doctorId: doctorIdNum,
        OR: dayRanges.map(({ start, end }) => ({
          date: {
            gte: start,   // >= startOfDay
            lte: end,     // <= endOfDay
          },
        })),
      },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    });

    // 4) For each day in our chunk, count how many slots exist
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
          date: dateObj.toISOString().split("T")[0], // e.g. "2025-02-25"
          count,
        };
      })
    );

    // 5) Fetch the doctor details, including the doctor's profile
    const doctorDetails = await prisma.user.findUnique({
      where: { id: doctorIdNum },
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
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}