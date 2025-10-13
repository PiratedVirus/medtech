import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = Number(searchParams.get("patientId"));
    if (!patientId) return NextResponse.json({ success: false, error: "patientId required" }, { status: 400 });
    const plans = await prisma.dietPlan.findMany({
      where: { patientId, deletedAt: null },
      orderBy: { id: "desc" },
    });
    return NextResponse.json({ success: true, plans });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 });
  }
}



