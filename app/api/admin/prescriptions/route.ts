import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const prescriptions = await prisma.prescription.findMany();
    return NextResponse.json(prescriptions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prescriptions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const prescription = await prisma.prescription.create({ data });
    return NextResponse.json(prescription);
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
    return NextResponse.json(prescription);
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
