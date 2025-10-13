const { PrismaClient, ComplaintSeverity } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedMedicinesAndComplaints() {
  console.log("💊 Seeding medicines and complaints...");

  // Seed Medicines
  const medicinesData = [
    {
      name: "Metformin",
      category: "Antidiabetic",
      description: "Oral diabetes medicine that helps control blood sugar levels",
      price: 150,
      frequency: ["Once daily", "Twice daily", "Three times daily"],
      medicineTime: ["Morning", "Evening", "Before meals", "After meals"],
      duration: ["7 days", "15 days", "30 days", "90 days"],
    },
    {
      name: "Glimepiride",
      category: "Antidiabetic",
      description: "Sulfonylurea that stimulates insulin release from pancreas",
      price: 200,
      frequency: ["Once daily", "Twice daily"],
      medicineTime: ["Morning", "Before breakfast", "Before dinner"],
      duration: ["7 days", "15 days", "30 days"],
    },
    {
      name: "Insulin Regular",
      category: "Insulin",
      description: "Short-acting insulin for blood sugar control",
      price: 500,
      frequency: ["Once daily", "Twice daily", "Three times daily"],
      medicineTime: ["Before meals", "Morning", "Evening"],
      duration: ["7 days", "15 days", "30 days"],
    },
    {
      name: "Insulin NPH",
      category: "Insulin",
      description: "Intermediate-acting insulin",
      price: 450,
      frequency: ["Once daily", "Twice daily"],
      medicineTime: ["Morning", "Evening", "Before bedtime"],
      duration: ["7 days", "15 days", "30 days"],
    },
    {
      name: "Atorvastatin",
      category: "Statin",
      description: "Cholesterol-lowering medication",
      price: 300,
      frequency: ["Once daily"],
      medicineTime: ["Evening", "Before bedtime"],
      duration: ["30 days", "90 days"],
    },
    {
      name: "Losartan",
      category: "Antihypertensive",
      description: "Angiotensin receptor blocker for blood pressure control",
      price: 250,
      frequency: ["Once daily"],
      medicineTime: ["Morning", "Evening"],
      duration: ["30 days", "90 days"],
    },
    {
      name: "Amlodipine",
      category: "Antihypertensive",
      description: "Calcium channel blocker for blood pressure control",
      price: 180,
      frequency: ["Once daily"],
      medicineTime: ["Morning", "Evening"],
      duration: ["30 days", "90 days"],
    },
    {
      name: "Aspirin",
      category: "Antiplatelet",
      description: "Low-dose aspirin for heart protection",
      price: 50,
      frequency: ["Once daily"],
      medicineTime: ["Morning", "Evening"],
      duration: ["30 days", "90 days"],
    },
    {
      name: "Vitamin D3",
      category: "Vitamin",
      description: "Vitamin D supplement",
      price: 100,
      frequency: ["Once daily", "Once weekly"],
      medicineTime: ["Morning", "Evening"],
      duration: ["30 days", "90 days"],
    },
    {
      name: "Vitamin B12",
      category: "Vitamin",
      description: "Vitamin B12 supplement",
      price: 120,
      frequency: ["Once daily", "Once weekly"],
      medicineTime: ["Morning", "Evening"],
      duration: ["30 days", "90 days"],
    },
  ];

  const medicines = [];
  for (const medicineData of medicinesData) {
    const medicine = await prisma.medicine.upsert({
      where: { name: medicineData.name },
      update: {},
      create: medicineData,
    });
    medicines.push(medicine);
  }
  console.log(`✅ ${medicines.length} medicines seeded`);

  // Seed Complaints
  const complaintsData = [
    {
      text: "High blood sugar levels",
      category: "Diabetes",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Frequent urination",
      category: "Diabetes",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Increased thirst",
      category: "Diabetes",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Fatigue and weakness",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Blurred vision",
      category: "Diabetes",
      severity: ComplaintSeverity.RISK,
    },
    {
      text: "Slow-healing wounds",
      category: "Diabetes",
      severity: ComplaintSeverity.RISK,
    },
    {
      text: "Numbness in hands and feet",
      category: "Diabetes",
      severity: ComplaintSeverity.RISK,
    },
    {
      text: "Chest pain",
      category: "Cardiac",
      severity: ComplaintSeverity.CRITICAL,
    },
    {
      text: "Shortness of breath",
      category: "Cardiac",
      severity: ComplaintSeverity.CRITICAL,
    },
    {
      text: "Headache",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Dizziness",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Nausea",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Vomiting",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Abdominal pain",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Joint pain",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Back pain",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Fever",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Cough",
      category: "Respiratory",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Cold",
      category: "Respiratory",
      severity: ComplaintSeverity.GOOD,
    },
    {
      text: "Sore throat",
      category: "Respiratory",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Insomnia",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Anxiety",
      category: "Mental Health",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Depression",
      category: "Mental Health",
      severity: ComplaintSeverity.RISK,
    },
    {
      text: "Weight gain",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Weight loss",
      category: "General",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Swelling in legs",
      category: "General",
      severity: ComplaintSeverity.RISK,
    },
    {
      text: "Skin rash",
      category: "Dermatological",
      severity: ComplaintSeverity.MODERATE,
    },
    {
      text: "Itching",
      category: "Dermatological",
      severity: ComplaintSeverity.MODERATE,
    },
  ];

  const complaints = [];
  for (const complaintData of complaintsData) {
    const complaint = await prisma.complaint.upsert({
      where: { text: complaintData.text },
      update: {},
      create: complaintData,
    });
    complaints.push(complaint);
  }
  console.log(`✅ ${complaints.length} complaints seeded`);

  return { medicines, complaints };
}

module.exports = { seedMedicinesAndComplaints }; 