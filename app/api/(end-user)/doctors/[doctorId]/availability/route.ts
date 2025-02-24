// app/api/doctors/[doctorId]/availability/route.ts

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

    // 3) Calculate which days to show
    //    If page=1 → offset=0
    //    If page=2 → offset=3
    //    If page=3 → offset=6
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

    // 4) Fetch all availability that falls in these day ranges
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

    // 5) For each day in our chunk, count how many slots exist
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

    // You might also want to return how many total pages exist in the future,
    // but that depends on your business logic (e.g., 60 days out, 100 days out, etc.)

    return NextResponse.json({
      success: true,
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