import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const clinics = await prisma.clinic.findMany();
    return NextResponse.json(clinics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clinics" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const clinic = await prisma.clinic.create({ data });
    return NextResponse.json(clinic);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create clinic" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const clinic = await prisma.clinic.update({
      where: { id },
      data,
    });
    return NextResponse.json(clinic);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update clinic" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.clinic.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Clinic deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete clinic" }, { status: 500 });
  }
}
