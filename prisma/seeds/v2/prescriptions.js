const { PrismaClient, ComplaintSeverity } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedPrescriptionData(tx = prisma) {
  console.log("📋 Seeding prescription data...");

  // Get appointments that don't already have prescriptions
  const appointments = await tx.appointment.findMany({
    where: {
      prescription: null // Only get appointments without prescriptions
    },
    include: {
      doctor: true,
      patient: true,
    }
  });

  if (appointments.length === 0) {
    console.log("⚠️ No appointments without prescriptions found, skipping prescription seeding");
    return [];
  }

  console.log(`📋 Found ${appointments.length} appointments without prescriptions`);

  const prescriptions = [];

  for (const appointment of appointments) {
    // Create prescription for each appointment that doesn't have one
    const prescription = await tx.prescription.create({
      data: {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        doctorId: appointment.userId,
        prescriptionNumber: `PRES-${Date.now()}-${appointment.id}`,
        advice: "Follow diabetic diet, exercise regularly, monitor blood sugar daily",
        testsRequested: "Fasting Blood Sugar, HbA1C, Lipid Profile",
        nextVisitDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        nextVisitType: "days",
        nextVisitValue: 30,
      },
    });

    // Add complaints
    await tx.prescriptionComplaint.createMany({
      data: [
        {
          prescriptionId: prescription.id,
          complaintText: "High blood sugar levels",
          severity: ComplaintSeverity.MODERATE,
          daysSince: 7,
        },
        {
          prescriptionId: prescription.id,
          complaintText: "Fatigue and weakness",
          severity: ComplaintSeverity.MODERATE,
          daysSince: 5,
        },
      ],
    });

    // Add vitals
    await tx.prescriptionVitals.create({
      data: {
        prescriptionId: prescription.id,
        bloodPressure: "140/90",
        pulse: 80,
        height: 170,
        weight: 70.5,
      },
    });

    // Add history
    await tx.prescriptionHistory.create({
      data: {
        prescriptionId: prescription.id,
        allergies: "None",
        personalHistory: "Type 2 Diabetes for 3 years",
        pastMedicalHistory: "Hypertension",
        familyHistory: "Father had diabetes",
      },
    });

    // Add systemic examination
    await tx.prescriptionSystemicExamination.create({
      data: {
        prescriptionId: prescription.id,
        general: "Conscious, oriented, afebrile",
        cvs: "S1, S2 normal, no murmurs",
        rs: "Bilateral air entry normal, no added sounds",
        cns: "Higher functions normal, cranial nerves intact",
      },
    });

    // Add medicines
    await tx.prescriptionMedicine.createMany({
      data: [
        {
          prescriptionId: prescription.id,
          medicineName: "Metformin",
          frequency: "Twice daily",
          medicineTime: "Before meals",
          duration: "30 days",
          quantity: 60,
          instructions: "Take with food to avoid stomach upset",
        },
        {
          prescriptionId: prescription.id,
          medicineName: "Glimepiride",
          frequency: "Once daily",
          medicineTime: "Before breakfast",
          duration: "30 days",
          quantity: 30,
          instructions: "Take 30 minutes before breakfast",
        },
        {
          prescriptionId: prescription.id,
          medicineName: "Atorvastatin",
          frequency: "Once daily",
          medicineTime: "Evening",
          duration: "30 days",
          quantity: 30,
          instructions: "Take at bedtime",
        },
      ],
    });

    prescriptions.push(prescription);
  }

  console.log(`✅ ${prescriptions.length} prescriptions seeded`);

  return prescriptions;
}

module.exports = { seedPrescriptionData }; 