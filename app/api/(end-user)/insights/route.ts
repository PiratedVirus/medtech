import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getMonthString(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}-${String(month).padStart(2, "0")}`;
}

/** The fixed order you want in the final JSON */
const METRIC_ORDER = [
  "Blood Pressure",
  "Blood Glucose",
  "Body Fat",
  "Muscle Mass",
  "BMI",
  "Visceral Fat",
];

// GET: fetch & group data by month, store item.id, and sort
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    if (!userIdParam) {
      return NextResponse.json(
        { success: false, error: "Missing userId in query params" },
        { status: 400 }
      );
    }

    const userId = Number(userIdParam);
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Invalid userId" },
        { status: 400 }
      );
    }

    // 1) Fetch all HealthMetric rows for this user
    const metrics = await prisma.healthMetric.findMany({
      where: { userId },
      orderBy: { recordedAt: "asc" },
    });

    // 2) Group by metricName
    const groupedByMetric: Record<string, typeof metrics> = {};
    metrics.forEach((item) => {
      if (!groupedByMetric[item.metricName]) {
        groupedByMetric[item.metricName] = [];
      }
      groupedByMetric[item.metricName].push(item);
    });

    // 3) For each metricName, group by month, compute averages, and store an ID for editing
    const result = Object.entries(groupedByMetric).map(([metricName, arr]) => {
      const monthlyMap: Record<string, { reading: number; id: number }[]> = {};

      arr.forEach((item) => {
        const monthKey = getMonthString(item.recordedAt);
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = [];
        }
        monthlyMap[monthKey].push({ reading: item.reading, id: item.id });
      });

      const data = Object.entries(monthlyMap).map(([month, items]) => {
        // average reading
        const readings = items.map((x) => x.reading);
        const avg = readings.reduce((acc, val) => acc + val, 0) / readings.length;

        // store ID of the last item for that month (for editing)
        const latestItem = items[items.length - 1];
        return {
          month,
          average: parseFloat(avg.toFixed(2)),
          latestId: latestItem.id,
        };
      });

      return {
        metricName,
        data,
      };
    });

    // 4) Sort by your custom order
    result.sort((a, b) => {
      const indexA = METRIC_ORDER.indexOf(a.metricName);
      const indexB = METRIC_ORDER.indexOf(b.metricName);

      if (indexA === -1 && indexB === -1) {
        // neither in METRIC_ORDER => alphabetical
        return a.metricName.localeCompare(b.metricName);
      } else if (indexA === -1) {
        return 1;
      } else if (indexB === -1) {
        return -1;
      } else {
        return indexA - indexB;
      }
    });

    return NextResponse.json({ success: true, metrics: result });
  } catch (error: any) {
    console.error("Error fetching health metrics:", error);
    return NextResponse.json(
      { success: false, error: "Server error fetching metrics" },
      { status: 500 }
    );
  }
}

// POST: create a new HealthMetric
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, metricName, reading, recordedAt } = body;

    if (!userId || !metricName || reading == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const newMetric = await prisma.healthMetric.create({
      data: {
        userId,
        metricName,
        reading: parseFloat(reading),
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, newMetric });
  } catch (error) {
    console.error("Error creating new metric:", error);
    return NextResponse.json(
      { success: false, error: "Server error creating metric" },
      { status: 500 }
    );
  }
}

// PATCH: edit an existing HealthMetric
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, reading, recordedAt } = body;

    if (!id || reading == null) {
      return NextResponse.json(
        { success: false, error: "Missing id or reading" },
        { status: 400 }
      );
    }

    const updatedMetric = await prisma.healthMetric.update({
      where: { id },
      data: {
        reading: parseFloat(reading),
        recordedAt: recordedAt ? new Date(recordedAt) : new Date(),
      },
    });

    return NextResponse.json({ success: true, updatedMetric });
  } catch (error) {
    console.error("Error updating metric:", error);
    return NextResponse.json(
      { success: false, error: "Server error updating metric" },
      { status: 500 }
    );
  }
}