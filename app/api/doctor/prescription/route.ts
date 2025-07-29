import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: Fetch prescription by appointment ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get("appointmentId");
    const prescriptionId = searchParams.get("prescriptionId");

    if (!appointmentId && !prescriptionId) {
      return NextResponse.json(
        { success: false, error: "appointmentId or prescriptionId is required" },
        { status: 400 }
      );
    }

    const prescription = await prisma.prescription.findFirst({
      where: {
        OR: [
          { appointmentId: appointmentId ? parseInt(appointmentId) : undefined },
          { id: prescriptionId ? parseInt(prescriptionId) : undefined },
        ],
        deletedAt: null,
      },
      include: {
        complaints: true,
        vitals: true,
        history: true,
        systemicExamination: true,
        medicines: true,
        patient: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  } catch (error) {
    console.error("Fetch prescription error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch prescription" },
      { status: 500 }
    );
  }
}

// POST: Create new prescription
export async function POST(request: Request) {
  let body: any;
  try {
    body = await request.json();
    console.log("Received prescription data:", body);
    const {
      appointmentId,
      patientId,
      doctorId,
      complaints,
      vitals,
      history,
      systemicExamination,
      medicines,
      advice,
      testsRequested,
      nextVisitDate,
      nextVisitType,
      nextVisitValue,
    } = body;

    if (!appointmentId || !patientId || !doctorId) {
      return NextResponse.json(
        { success: false, error: "appointmentId, patientId, and doctorId are required" },
        { status: 400 }
      );
    }

    // Generate prescription number
    const prescriptionNumber = `PRES-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const prescription = await prisma.$transaction(async (tx) => {
      // Create main prescription
      const newPrescription = await tx.prescription.create({
        data: {
          appointmentId: parseInt(appointmentId),
          patientId: parseInt(patientId),
          doctorId: parseInt(doctorId),
          prescriptionNumber,
          advice,
          testsRequested,
          nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
          nextVisitType,
          nextVisitValue: nextVisitValue ? parseInt(nextVisitValue) : null,
        },
      });

      // Create complaints
      if (complaints && complaints.length > 0) {
        await tx.prescriptionComplaint.createMany({
          data: complaints.map((complaint: any) => ({
            prescriptionId: newPrescription.id,
            complaintText: complaint.text,
            severity: complaint.severity || "MODERATE",
            daysSince: complaint.daysSince,
          })),
        });
      }

      // Create vitals
      if (vitals) {
        await tx.prescriptionVitals.create({
          data: {
            prescriptionId: newPrescription.id,
            bloodPressure: vitals.bloodPressure,
            pulse: vitals.pulse ? parseInt(vitals.pulse) : null,
            height: vitals.height ? parseFloat(vitals.height) : null,
            weight: vitals.weight ? parseFloat(vitals.weight) : null,
          },
        });
      }

      // Create history
      if (history) {
        await tx.prescriptionHistory.create({
          data: {
            prescriptionId: newPrescription.id,
            allergies: history.allergies,
            personalHistory: history.personalHistory,
            pastMedicalHistory: history.pastMedicalHistory,
            familyHistory: history.familyHistory,
          },
        });
      }

      // Create systemic examination
      if (systemicExamination) {
        await tx.prescriptionSystemicExamination.create({
          data: {
            prescriptionId: newPrescription.id,
            general: systemicExamination.general,
            cvs: systemicExamination.cvs,
            rs: systemicExamination.rs,
            cns: systemicExamination.cns,
          },
        });
      }

      // Create medicines
      if (medicines && medicines.length > 0) {
        await tx.prescriptionMedicine.createMany({
          data: medicines.map((medicine: any) => ({
            prescriptionId: newPrescription.id,
            medicineName: medicine.name,
            frequency: medicine.frequency,
            medicineTime: medicine.medicineTime,
            duration: medicine.duration,
            quantity: medicine.quantity ? parseInt(medicine.quantity) : null,
            instructions: medicine.instructions,
          })),
        });
      }

      return newPrescription;
    });

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  } catch (error: any) {
    console.error("Create prescription error:", error);
    console.error("Request body:", body);
    return NextResponse.json(
      { success: false, error: "Failed to create prescription", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

// PUT: Update prescription
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log("Received update prescription data:", body);
    
    const {
      prescriptionId,
      complaints,
      vitals,
      history,
      systemicExamination,
      medicines,
      advice,
      testsRequested,
      nextVisitDate,
      nextVisitType,
      nextVisitValue,
    } = body;

    if (!prescriptionId) {
      return NextResponse.json(
        { success: false, error: "prescriptionId is required" },
        { status: 400 }
      );
    }

    const prescriptionIdNum = parseInt(prescriptionId);
    if (isNaN(prescriptionIdNum)) {
      return NextResponse.json(
        { success: false, error: "Invalid prescriptionId format" },
        { status: 400 }
      );
    }

    // First check if prescription exists
    const existingPrescription = await prisma.prescription.findUnique({
      where: { id: prescriptionIdNum },
    });

    if (!existingPrescription) {
      return NextResponse.json(
        { success: false, error: "Prescription not found" },
        { status: 404 }
      );
    }

    console.log("Updating prescription ID:", prescriptionIdNum);

    // Helper function to safely parse numbers
    const safeParseFloat = (value: any): number | null => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    const safeParseInt = (value: any): number | null => {
      if (value === null || value === undefined || value === "") return null;
      const parsed = parseInt(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update main prescription
      const updatedPrescription = await tx.prescription.update({
        where: { id: prescriptionIdNum },
        data: {
          advice: advice || null,
          testsRequested: testsRequested || null,
          nextVisitDate: nextVisitDate ? new Date(nextVisitDate) : null,
          nextVisitType: nextVisitType || null,
          nextVisitValue: safeParseInt(nextVisitValue),
        },
      });

      // Update complaints
      if (complaints !== undefined) {
        await tx.prescriptionComplaint.deleteMany({
          where: { prescriptionId: prescriptionIdNum },
        });

        if (complaints && complaints.length > 0) {
          await tx.prescriptionComplaint.createMany({
            data: complaints.map((complaint: any) => ({
              prescriptionId: prescriptionIdNum,
              complaintText: complaint.text || "",
              severity: complaint.severity || "MODERATE",
              daysSince: safeParseInt(complaint.daysSince),
            })),
          });
        }
      }

      // Update vitals - handle null vs undefined properly
      if (vitals !== undefined) {
        if (vitals === null) {
          // Delete vitals record if null is explicitly sent
          await tx.prescriptionVitals.deleteMany({
            where: { prescriptionId: prescriptionIdNum },
          });
        } else {
          // Upsert vitals record
          await tx.prescriptionVitals.upsert({
            where: { prescriptionId: prescriptionIdNum },
            update: {
              bloodPressure: vitals.bloodPressure || null,
              pulse: safeParseInt(vitals.pulse),
              height: safeParseFloat(vitals.height),
              weight: safeParseFloat(vitals.weight),
            },
            create: {
              prescriptionId: prescriptionIdNum,
              bloodPressure: vitals.bloodPressure || null,
              pulse: safeParseInt(vitals.pulse),
              height: safeParseFloat(vitals.height),
              weight: safeParseFloat(vitals.weight),
            },
          });
        }
      }

      // Update history - handle null vs undefined properly
      if (history !== undefined) {
        if (history === null) {
          // Delete history record if null is explicitly sent
          await tx.prescriptionHistory.deleteMany({
            where: { prescriptionId: prescriptionIdNum },
          });
        } else {
          // Upsert history record
          await tx.prescriptionHistory.upsert({
            where: { prescriptionId: prescriptionIdNum },
            update: {
              allergies: history.allergies || null,
              personalHistory: history.personalHistory || null,
              pastMedicalHistory: history.pastMedicalHistory || null,
              familyHistory: history.familyHistory || null,
            },
            create: {
              prescriptionId: prescriptionIdNum,
              allergies: history.allergies || null,
              personalHistory: history.personalHistory || null,
              pastMedicalHistory: history.pastMedicalHistory || null,
              familyHistory: history.familyHistory || null,
            },
          });
        }
      }

      // Update systemic examination - handle null vs undefined properly
      if (systemicExamination !== undefined) {
        if (systemicExamination === null) {
          // Delete systemic examination record if null is explicitly sent
          await tx.prescriptionSystemicExamination.deleteMany({
            where: { prescriptionId: prescriptionIdNum },
          });
        } else {
          // Upsert systemic examination record
          await tx.prescriptionSystemicExamination.upsert({
            where: { prescriptionId: prescriptionIdNum },
            update: {
              general: systemicExamination.general || null,
              cvs: systemicExamination.cvs || null,
              rs: systemicExamination.rs || null,
              cns: systemicExamination.cns || null,
            },
            create: {
              prescriptionId: prescriptionIdNum,
              general: systemicExamination.general || null,
              cvs: systemicExamination.cvs || null,
              rs: systemicExamination.rs || null,
              cns: systemicExamination.cns || null,
            },
          });
        }
      }

      // Update medicines
      if (medicines !== undefined) {
        await tx.prescriptionMedicine.deleteMany({
          where: { prescriptionId: prescriptionIdNum },
        });

        if (medicines && medicines.length > 0) {
          await tx.prescriptionMedicine.createMany({
            data: medicines.map((medicine: any) => ({
              prescriptionId: prescriptionIdNum,
              medicineName: medicine.name || "",
              frequency: medicine.frequency || null,
              medicineTime: medicine.medicineTime || null,
              duration: medicine.duration || null,
              quantity: safeParseInt(medicine.quantity),
              instructions: medicine.instructions || null,
            })),
          });
        }
      }

      return updatedPrescription;
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Update prescription error");
    // console.error("Error message:", error?.message);
    // console.error("Error code:", error?.code);
    
    return NextResponse.json(
      { success: false, error: "Failed to update prescription", details: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
} 