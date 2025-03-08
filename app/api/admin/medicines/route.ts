import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [medicines, total] = await prisma.$transaction([
      prisma.medicine.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.medicine.count(),
    ]);

    return NextResponse.json({
      data: medicines,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch medicines" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const medicine = await prisma.medicine.create({ data });
    return NextResponse.json({ data: medicine, message: "Medicine created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create medicine" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const medicine = await prisma.medicine.update({
      where: { id },
      data,
    });
    return NextResponse.json({ data: medicine, message: "Medicine updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update medicine" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.medicine.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Medicine deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete medicine" }, { status: 500 });
  }
}
