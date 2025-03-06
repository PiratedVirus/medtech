import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const dieticians = await prisma.dieticianProfile.findMany();
    return NextResponse.json(dieticians);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch dieticians" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const dietician = await prisma.dieticianProfile.create({ data });
    return NextResponse.json(dietician);
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
    return NextResponse.json(dietician);
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
