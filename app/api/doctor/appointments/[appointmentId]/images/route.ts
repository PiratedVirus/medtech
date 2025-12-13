import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const id = Number(appointmentId);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointmentId" }, { status: 400 });
    }

    const images = await prisma.appointmentImage.findMany({
      where: { appointmentId: id, deletedAt: null },
      orderBy: { createdAt: "asc" },
      select: { id: true, imageUrl: true, type: true, createdAt: true }
    });

    return NextResponse.json({ success: true, data: images });
  } catch (error) {
    console.error('[APPT][IMAGES][GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch images' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const id = Number(appointmentId);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointmentId" }, { status: 400 });
    }

    const body = await request.json().catch(() => null) as { urls?: string[]; type?: 'BEFORE' | 'AFTER'; uploadedById?: number } | null;
    const urls = Array.isArray(body?.urls) ? body!.urls.filter(Boolean) : [];
    const type = body?.type;
    const uploadedById = body?.uploadedById;

    if (!urls.length || (type !== 'BEFORE' && type !== 'AFTER')) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const created = await prisma.$transaction(urls.map((u) => prisma.appointmentImage.create({
      data: {
        appointmentId: id,
        imageUrl: u,
        type,
        uploadedById: uploadedById ?? null,
      },
      select: { id: true, imageUrl: true, type: true, createdAt: true }
    })));

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('[APPT][IMAGES][POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save images' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    const { appointmentId } = await params;
    const id = Number(appointmentId);
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ success: false, error: "Invalid appointmentId" }, { status: 400 });
    }

    const body = await request.json().catch(() => null) as { imageId?: number } | null;
    const imageId = body?.imageId;
    if (!imageId) {
      return NextResponse.json({ success: false, error: "imageId is required" }, { status: 400 });
    }

    await prisma.appointmentImage.update({
      where: { id: Number(imageId) },
      data: { deletedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[APPT][IMAGES][DELETE] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete image' }, { status: 500 });
  }
}


