import { NextResponse } from "next/server";
import prisma  from "@/lib/prisma";

export async function GET() {
  try {
    const labs = await prisma.lab.findMany();
    return NextResponse.json(labs);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch labs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const lab = await prisma.lab.create({ data });
    return NextResponse.json(lab);
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
    return NextResponse.json(lab);
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
