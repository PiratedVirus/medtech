import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// Helper to get doctorId from JWT
async function getDoctorIdFromRequest() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  let decoded: any;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!);
  } catch (err) {
    return null;
  }
  const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
  if (!phoneNumber) return null;
  const user = await prisma.user.findFirst({
    where: { phoneNumber },
    include: { doctorProfile: true },
  });
  if (!user?.doctorProfile?.id) return null;
  return user.id;
}

// GET - Load all templates for a doctor
export async function GET(request: NextRequest) {
  try {
    const doctorId = await getDoctorIdFromRequest();
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get('type') || 'all').toLowerCase(); // 'complaints' | 'medicines' | 'all'
    
    const whereBase: any = {
      doctorId: doctorId,
      deletedAt: null,
      isActive: true,
    };

    // Filter by type if requested
    if (type === 'complaints') {
      // Only complaints templates based on scope
      whereBase.templateScope = 'COMPLAINTS';
    } else if (type === 'medicines') {
      // Only medicines templates based on scope
      whereBase.templateScope = 'MEDICINES';
    }

    const templates = await prisma.prescriptionTemplate.findMany({
      where: whereBase,
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

    const doctorId = await getDoctorIdFromRequest();
    if (!doctorId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Determine scope based on which arrays are present
    const hasComplaints = complaintsArr.length > 0;
    const hasMedicines = medicinesArr.length > 0;
    const templateScope = hasComplaints && hasMedicines ? 'FULL' : hasComplaints ? 'COMPLAINTS' : hasMedicines ? 'MEDICINES' : 'FULL';

    const template = await prisma.prescriptionTemplate.create({
      data: {
        templateName: name,
        templateDescription: `Template created on ${new Date().toLocaleDateString()}`,
        doctorId,
        templateScope: templateScope as any,
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