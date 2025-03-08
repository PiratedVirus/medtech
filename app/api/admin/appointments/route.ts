import { NextResponse } from "next/server";
import prisma  from "@/lib/prisma";

export async function GET() {
  try {
    const appointments = await prisma.appointment.findMany();
    return NextResponse.json(appointments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const appointment = await prisma.appointment.create({ data });
    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const appointment = await prisma.appointment.update({
      where: { id },
      data,
    });
    return NextResponse.json(appointment);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.appointment.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 });
  }
}
