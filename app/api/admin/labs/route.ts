import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    const [labs, total] = await prisma.$transaction([
      prisma.labPackage.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      prisma.labPackage.count(),
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
    const labPackage = await prisma.labPackage.create({ data });
    return NextResponse.json({ data: labPackage, message: "Lab created successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create labPackage" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    console.log("Updating Lab ID:", id);
    console.log("Update Payload:", data);

    const labPackage = await prisma.labPackage.update({
      where: { id },
      data,
    });
    return NextResponse.json({ data: labPackage, message: "Lab updated successfully" });
  } catch (error) {
    console.error("Update Error:", error instanceof Error ? error.message : JSON.stringify(error));
    return NextResponse.json({ error: "Failed to update labPackage" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.labPackage.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Lab deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete labPackage" }, { status: 500 });
  }
}
