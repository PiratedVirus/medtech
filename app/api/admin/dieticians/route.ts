import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [dieticians, total] = await prisma.$transaction([
      prisma.dieticianProfile.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.dieticianProfile.count(),
    ]);

    return NextResponse.json({
      data: dieticians,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dieticians" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const dietician = await prisma.dieticianProfile.create({ data });
    return NextResponse.json({ data: dietician, message: "Dietician created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create dietician" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const dietician = await prisma.dieticianProfile.update({
      where: { id },
      data,
    });
    return NextResponse.json({ data: dietician, message: "Dietician updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update dietician" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.dieticianProfile.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Dietician deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete dietician" }, { status: 500 });
  }
}
