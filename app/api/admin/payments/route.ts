import { NextResponse } from "next/server";
import prisma  from "@/lib/prisma";

export async function GET() {
  try {
    const payments = await prisma.payment.findMany();
    return NextResponse.json(payments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const payment = await prisma.payment.create({ data });
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const payment = await prisma.payment.update({
      where: { id },
      data,
    });
    return NextResponse.json(payment);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.payment.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Payment deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
