import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [labs, total] = await prisma.$transaction([
      prisma.lab.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.lab.count(),
    ]);

    return NextResponse.json({
      data: labs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch labs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const lab = await prisma.lab.create({ data });
    return NextResponse.json({ data: lab, message: "Lab created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create lab" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const lab = await prisma.lab.update({
      where: { id },
      data,
    });
    return NextResponse.json({ data: lab, message: "Lab updated successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update lab" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.lab.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Lab deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete lab" }, { status: 500 });
  }
}
