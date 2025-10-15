import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// List requests assigned to a dietician (doctor)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dieticianId = Number(searchParams.get("dieticianId"));
    if (!dieticianId) return NextResponse.json({ success: false, error: "dieticianId required" }, { status: 400 });
    const requests = await prisma.dietPlanRequest.findMany({
      where: { dieticianId, deletedAt: null },
      orderBy: { id: "desc" },
      include: { 
        patient: { select: { id: true, name: true } },
        dietPlan: true,
        dietician: { select: { id: true, name: true } }
      },
    });
    return NextResponse.json({ success: true, requests });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 });
  }
}


