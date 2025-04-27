import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Fetch all doctors along with their profile & availability
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = Number(searchParams.get('id'));
    
        if (!patientId) {
        return NextResponse.json(
            { success: false, error: "Patient ID is required" },
            { status: 400 }
        );
        }
        const appt = await prisma.appointment.findFirst({
            where: {
              patientId,
              isDietician: true,
            },
            orderBy: {
              id: "desc",
            },
            select: {
              prescriptionLink: true,
            },
          });
        const dietLink = appt?.prescriptionLink || "#";
    
        return NextResponse.json({ success: true, dietLink });
    } catch (error) {
        return NextResponse.json(
        { success: false, error: "Failed to fetch doctors with error " + error },
        { status: 500 }
        );
    }
    }