import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET - Load all templates for a doctor
export async function GET(request: NextRequest) {
  try {
    // In a real app, you'd get the doctor ID from the session/auth
    const doctorId = 1; // Replace with actual auth logic - should be a number
    
    const templates = await prisma.prescriptionTemplate.findMany({
      where: {
        doctorId: doctorId,
        deletedAt: null,
        isActive: true,
      },
      include: {
        complaints: true,
        medicines: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });



    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("Error loading templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load templates" },
      { status: 500 }
    );
  }
}

// POST - Save a new template
export async function POST(request: NextRequest) {
  try {
    // Accept both the old format { name, data } and a flattened body
    const body = await request.json();

    const name: string | undefined = body.name || body.templateName;
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Template name is required" },
        { status: 400 }
      );
    }

    // Normalise template data – it may come in body.data or at the root
    const templateData = body.data ?? body;

    // Extract arrays safely
    const complaintsArr = Array.isArray(templateData.complaints) ? templateData.complaints : [];
    const medicinesArr = Array.isArray(templateData.medicines) ? templateData.medicines : [];

    // In a real app, you'd get the doctor ID from the session/auth
    const doctorId = 1; // TODO: Replace with auth context

    const template = await prisma.prescriptionTemplate.create({
      data: {
        templateName: name,
        templateDescription: `Template created on ${new Date().toLocaleDateString()}`,
        doctorId,
        advice: templateData.advice || "",
        testsRequested: templateData.testsRequested || "",
        complaints: {
          create: complaintsArr.map((c: any) => ({
            complaintText: c.text || c.complaintText || "",
            severity: c.severity || "MODERATE",
          })),
        },
        medicines: {
          create: medicinesArr.map((m: any) => ({
            medicineName: m.name || m.medicineName || "",
            frequency: m.frequency || "",
            medicineTime: m.medicineTime || "",
            duration: m.duration || "",
            quantity: parseInt(m.quantity ?? "0") || 0,
            instructions: m.instructions || "",
          })),
        },
      },
      include: {
        complaints: true,
        medicines: true,
      },
    });

    return NextResponse.json({ success: true, template });
  } catch (error) {
    console.error("Error saving template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save template" },
      { status: 500 }
    );
  }
} 