import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/patients/pills?userId=123
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    const userId = Number(userIdParam);

    const pills = await prisma.patientPill.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true, key: true, value: true },
    });

    return NextResponse.json({ success: true, data: pills });
  } catch (error) {
    console.error("GET /api/patients/pills error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pills" },
      { status: 500 }
    );
  }
}

// POST /api/patients/pills  { userId, key, value }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { userId, key, value } = body;

    if (!userId || !key || value == null) {
      return NextResponse.json(
        { success: false, error: "Missing userId, key or value" },
        { status: 400 }
      );
    }

    const pill = await prisma.patientPill.create({
      data: { userId: Number(userId), key: String(key), value: String(value) },
      select: { id: true, key: true, value: true },
    });

    return NextResponse.json({ success: true, data: pill });
  } catch (error) {
    console.error("POST /api/patients/pills error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create pill" },
      { status: 500 }
    );
  }
}

// PATCH /api/patients/pills  { id, value, key? }
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { id, key, value } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    const updated = await prisma.patientPill.update({
      where: { id: Number(id) },
      data: {
        ...(key != null ? { key: String(key) } : {}),
        ...(value != null ? { value: String(value) } : {}),
      },
      select: { id: true, key: true, value: true },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/patients/pills error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update pill" },
      { status: 500 }
    );
  }
}

// DELETE /api/patients/pills?id=123 (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    if (!idParam) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    const id = Number(idParam);
    await prisma.patientPill.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/patients/pills error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete pill" },
      { status: 500 }
    );
  }
}

