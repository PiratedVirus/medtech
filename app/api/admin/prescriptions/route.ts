import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [prescriptions, total] = await prisma.$transaction([
      prisma.prescription.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.prescription.count(),
    ]);

    return NextResponse.json({
      data: prescriptions,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const prescription = await prisma.prescription.create({ data });
    return NextResponse.json({ data: prescription, message: "Prescription created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create prescription" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const prescription = await prisma.prescription.update({
      where: { id },
      data,
    });
    return NextResponse.json({ data: prescription, message: "Prescription updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update prescription" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.prescription.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Prescription deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete prescription" }, { status: 500 });
  }
}
