import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch templates for a doctor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get("doctorId");
    const templateId = searchParams.get("templateId");

    if (!doctorId && !templateId) {
      return NextResponse.json(
        { success: false, error: "doctorId or templateId is required" },
        { status: 400 }
      );
    }

    if (templateId) {
      // Fetch specific template
      const template = await prisma.prescriptionTemplate.findFirst({
        where: {
          id: parseInt(templateId),
          deletedAt: null,
        },
        include: {
          complaints: true,
          medicines: true,
        },
      });

      if (!template) {
        return NextResponse.json(
          { success: false, error: "Template not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: template,
      });
    } else {
      // Fetch all templates for doctor
      const templates = await prisma.prescriptionTemplate.findMany({
        where: {
          doctorId: parseInt(doctorId!),
          deletedAt: null,
          isActive: true,
        },
        include: {
          complaints: true,
          medicines: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return NextResponse.json({
        success: true,
        data: templates,
      });
    }
  } catch (error) {
    console.error("Fetch templates error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}

// POST: Create new template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      doctorId,
      templateName,
      templateDescription,
      complaints,
      medicines,
      advice,
      testsRequested,
    } = body;

    if (!doctorId || !templateName) {
      return NextResponse.json(
        { success: false, error: "doctorId and templateName are required" },
        { status: 400 }
      );
    }

    const template = await prisma.$transaction(async (tx) => {
      // Create template
      const newTemplate = await tx.prescriptionTemplate.create({
        data: {
          doctorId: parseInt(doctorId),
          templateName,
          templateDescription,
          advice,
          testsRequested,
        },
      });

      // Create template complaints
      if (complaints && complaints.length > 0) {
        await tx.templateComplaint.createMany({
          data: complaints.map((complaint: any) => ({
            templateId: newTemplate.id,
            complaintText: complaint.text,
            severity: complaint.severity || "MODERATE",
          })),
        });
      }

      // Create template medicines
      if (medicines && medicines.length > 0) {
        await tx.templateMedicine.createMany({
          data: medicines.map((medicine: any) => ({
            templateId: newTemplate.id,
            medicineName: medicine.name,
            frequency: medicine.frequency,
            medicineTime: medicine.medicineTime,
            duration: medicine.duration,
            quantity: medicine.quantity ? parseInt(medicine.quantity) : null,
            instructions: medicine.instructions,
          })),
        });
      }

      return newTemplate;
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Create template error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create template" },
      { status: 500 }
    );
  }
}

// PUT: Update template
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      templateId,
      templateName,
      templateDescription,
      complaints,
      medicines,
      advice,
      testsRequested,
      isActive,
    } = body;

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "templateId is required" },
        { status: 400 }
      );
    }

    const template = await prisma.$transaction(async (tx) => {
      // Update template
      const updatedTemplate = await tx.prescriptionTemplate.update({
        where: { id: parseInt(templateId) },
        data: {
          templateName,
          templateDescription,
          advice,
          testsRequested,
          isActive,
        },
      });

      // Update complaints (delete existing and create new)
      if (complaints !== undefined) {
        await tx.templateComplaint.deleteMany({
          where: { templateId: parseInt(templateId) },
        });

        if (complaints.length > 0) {
          await tx.templateComplaint.createMany({
            data: complaints.map((complaint: any) => ({
              templateId: parseInt(templateId),
              complaintText: complaint.text,
              severity: complaint.severity || "MODERATE",
            })),
          });
        }
      }

      // Update medicines (delete existing and create new)
      if (medicines !== undefined) {
        await tx.templateMedicine.deleteMany({
          where: { templateId: parseInt(templateId) },
        });

        if (medicines.length > 0) {
          await tx.templateMedicine.createMany({
            data: medicines.map((medicine: any) => ({
              templateId: parseInt(templateId),
              medicineName: medicine.name,
              frequency: medicine.frequency,
              medicineTime: medicine.medicineTime,
              duration: medicine.duration,
              quantity: medicine.quantity ? parseInt(medicine.quantity) : null,
              instructions: medicine.instructions,
            })),
          });
        }
      }

      return updatedTemplate;
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error("Update template error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update template" },
      { status: 500 }
    );
  }
}

// DELETE: Delete template (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("templateId");

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "templateId is required" },
        { status: 400 }
      );
    }

    await prisma.prescriptionTemplate.update({
      where: { id: parseInt(templateId) },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error) {
    console.error("Delete template error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete template" },
      { status: 500 }
    );
  }
} 