import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // or your Prisma client

function getMonthString(date: Date) {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${year}-${String(month).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  try {
    // 1) Extract userId from query string
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

    // 2) Fetch all HealthMetric rows for this user
    const metrics = await prisma.healthMetric.findMany({
      where: { userId },
      orderBy: { recordedAt: "asc" },
    });

    // 3) Group by metricName
    const groupedByMetric: Record<string, typeof metrics> = {};
    metrics.forEach((m) => {
      if (!groupedByMetric[m.metricName]) {
        groupedByMetric[m.metricName] = [];
      }
      groupedByMetric[m.metricName].push(m);
    });

    // 4) For each metricName, group by month and compute averages
    const result = Object.entries(groupedByMetric).map(([metricName, arr]) => {
      const monthlyMap: Record<string, number[]> = {};

      arr.forEach((item) => {
        const monthKey = getMonthString(item.recordedAt);
        if (!monthlyMap[monthKey]) {
          monthlyMap[monthKey] = [];
        }
        monthlyMap[monthKey].push(item.reading);
      });

      const data = Object.entries(monthlyMap).map(([month, readings]) => {
        const avg = readings.reduce((acc, val) => acc + val, 0) / readings.length;
        return {
          month,
          average: parseFloat(avg.toFixed(2)),
        };
      });

      return {
        metricName,
        data,
      };
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