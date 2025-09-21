import { NextResponse } from "next/server";
import prisma  from "@/lib/prisma";

export async function GET(request: Request) {
  const {searchParams} = new URL(request.url);
  const doctorId = parseInt(searchParams.get("id") || "0") ;
  const checkAvailability = searchParams.get("checkAvailability") === "true";
  let where = {}
  if (checkAvailability) {
    where = {
      status: "AVAILABLE",
    }
  }
  if (doctorId) {
    where = {
      ...where,
      userId: doctorId,
    }
  }
    try {
      const clinics = await prisma.doctorAvailability.findMany({
        where
    });
      return NextResponse.json(clinics);
    } catch (error) {
      return NextResponse.json({ error: "Failed to fetch clinics" }, { status: 500 });
    }
  }