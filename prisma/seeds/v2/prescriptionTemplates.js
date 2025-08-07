const { PrismaClient, ComplaintSeverity } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedPrescriptionTemplates() {
  console.log("📋 Seeding prescription templates...");

  // Get doctors
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" }
  });

  if (doctors.length === 0) {
    console.log("⚠️ No doctors found, skipping prescription template seeding");
    return [];
  }

  const templates = [];

  // Create prescription templates for doctors
  for (const doctor of doctors) {
    // Template 1: Diabetes Management
    const diabetesTemplate = await prisma.prescriptionTemplate.create({
      data: {
        doctorId: doctor.id,
        templateName: "Diabetes Management",
        templateDescription: "Standard template for diabetes management and monitoring",
        isActive: true,
      },
    });

    // Add complaints for diabetes template
    await prisma.templateComplaint.createMany({
      data: [
        {
          templateId: diabetesTemplate.id,
          complaintText: "High blood sugar levels",
          severity: ComplaintSeverity.MODERATE,
        },
        {
          templateId: diabetesTemplate.id,
          complaintText: "Frequent urination",
          severity: ComplaintSeverity.MODERATE,
        },
      ],
    });

    // Add medicines for diabetes template
    await prisma.templateMedicine.createMany({
      data: [
        {
          templateId: diabetesTemplate.id,
          medicineName: "Metformin",
          frequency: "Twice daily",
          medicineTime: "Before meals",
          duration: "30 days",
          quantity: 60,
          instructions: "Take with food to avoid stomach upset",
        },
        {
          templateId: diabetesTemplate.id,
          medicineName: "Glimepiride",
          frequency: "Once daily",
          medicineTime: "Before breakfast",
          duration: "30 days",
          quantity: 30,
          instructions: "Take 30 minutes before breakfast",
        },
      ],
    });

    // Template 2: Hypertension Management
    const hypertensionTemplate = await prisma.prescriptionTemplate.create({
      data: {
        doctorId: doctor.id,
        templateName: "Hypertension Management",
        templateDescription: "Standard template for blood pressure management",
        isActive: true,
      },
    });

    // Add complaints for hypertension template
    await prisma.templateComplaint.createMany({
      data: [
        {
          templateId: hypertensionTemplate.id,
          complaintText: "High blood pressure",
          severity: ComplaintSeverity.RISK,
        },
        {
          templateId: hypertensionTemplate.id,
          complaintText: "Headache",
          severity: ComplaintSeverity.MODERATE,
        },
      ],
    });

    // Add medicines for hypertension template
    await prisma.templateMedicine.createMany({
      data: [
        {
          templateId: hypertensionTemplate.id,
          medicineName: "Losartan",
          frequency: "Once daily",
          medicineTime: "Morning",
          duration: "30 days",
          quantity: 30,
          instructions: "Take in the morning",
        },
        {
          templateId: hypertensionTemplate.id,
          medicineName: "Amlodipine",
          frequency: "Once daily",
          medicineTime: "Evening",
          duration: "30 days",
          quantity: 30,
          instructions: "Take in the evening",
        },
      ],
    });

    templates.push(diabetesTemplate, hypertensionTemplate);
  }

  console.log(`✅ ${templates.length} prescription templates seeded`);

  return templates;
}

module.exports = { seedPrescriptionTemplates }; 