const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedLabTests() {
  console.log("🔬 Seeding lab tests...");

  const labTestsData = [
    // Basic Tests
    {
      name: "Fasting Plasma Glucose",
      code: "FBS",
      description: "Measures blood glucose levels after fasting for 8-12 hours",
      parameters: ["Glucose"],
      normalRange: { min: 70, max: 100 },
      unit: "mg/dL",
    },
    {
      name: "HbA1C (Glycosylated Hemoglobin)",
      code: "HbA1C",
      description: "Measures average blood glucose over 2-3 months",
      parameters: ["HbA1C"],
      normalRange: { min: 4.0, max: 5.6 },
      unit: "%",
    },
    {
      name: "Glucose Post Prandial",
      code: "PPBS",
      description: "Measures blood glucose 2 hours after meal",
      parameters: ["Glucose"],
      normalRange: { min: 70, max: 140 },
      unit: "mg/dL",
    },

    // Liver Function Tests
    {
      name: "Serum Bilirubin (Total)",
      code: "BIL_T",
      description: "Measures total bilirubin levels",
      parameters: ["Bilirubin"],
      normalRange: { min: 0.3, max: 1.2 },
      unit: "mg/dL",
    },
    {
      name: "SGOT / AST",
      code: "AST",
      description: "Aspartate Aminotransferase",
      parameters: ["AST"],
      normalRange: { min: 8, max: 48 },
      unit: "U/L",
    },
    {
      name: "SGPT / ALT",
      code: "ALT",
      description: "Alanine Aminotransferase",
      parameters: ["ALT"],
      normalRange: { min: 7, max: 55 },
      unit: "U/L",
    },
    {
      name: "Alkaline Phosphatase",
      code: "ALP",
      description: "Measures alkaline phosphatase levels",
      parameters: ["ALP"],
      normalRange: { min: 44, max: 147 },
      unit: "U/L",
    },

    // Kidney Function Tests
    {
      name: "Urea",
      code: "UREA",
      description: "Blood urea nitrogen",
      parameters: ["Urea"],
      normalRange: { min: 7, max: 20 },
      unit: "mg/dL",
    },
    {
      name: "Creatinine",
      code: "CREAT",
      description: "Serum creatinine",
      parameters: ["Creatinine"],
      normalRange: { min: 0.6, max: 1.2 },
      unit: "mg/dL",
    },
    {
      name: "Uric Acid",
      code: "UA",
      description: "Serum uric acid",
      parameters: ["Uric Acid"],
      normalRange: { min: 3.4, max: 7.0 },
      unit: "mg/dL",
    },

    // Lipid Profile
    {
      name: "Total Cholesterol",
      code: "TC",
      description: "Total cholesterol levels",
      parameters: ["Cholesterol"],
      normalRange: { min: 125, max: 200 },
      unit: "mg/dL",
    },
    {
      name: "Triglycerides",
      code: "TG",
      description: "Serum triglycerides",
      parameters: ["Triglycerides"],
      normalRange: { min: 0, max: 150 },
      unit: "mg/dL",
    },
    {
      name: "HDL Cholesterol",
      code: "HDL",
      description: "High-density lipoprotein cholesterol",
      parameters: ["HDL"],
      normalRange: { min: 40, max: 60 },
      unit: "mg/dL",
    },
    {
      name: "LDL Cholesterol",
      code: "LDL",
      description: "Low-density lipoprotein cholesterol",
      parameters: ["LDL"],
      normalRange: { min: 0, max: 100 },
      unit: "mg/dL",
    },

    // Thyroid Profile
    {
      name: "TSH",
      code: "TSH",
      description: "Thyroid Stimulating Hormone",
      parameters: ["TSH"],
      normalRange: { min: 0.4, max: 4.0 },
      unit: "mIU/L",
    },
    {
      name: "T3",
      code: "T3",
      description: "Triiodothyronine",
      parameters: ["T3"],
      normalRange: { min: 80, max: 200 },
      unit: "ng/dL",
    },
    {
      name: "T4",
      code: "T4",
      description: "Thyroxine",
      parameters: ["T4"],
      normalRange: { min: 0.8, max: 1.8 },
      unit: "ng/dL",
    },

    // Complete Blood Count
    {
      name: "Haemoglobin (Hb)",
      code: "HB",
      description: "Hemoglobin levels",
      parameters: ["Hemoglobin"],
      normalRange: { min: 12, max: 16 },
      unit: "g/dL",
    },
    {
      name: "Total WBC Count",
      code: "WBC",
      description: "White blood cell count",
      parameters: ["WBC"],
      normalRange: { min: 4000, max: 11000 },
      unit: "cells/μL",
    },
    {
      name: "RBC Count",
      code: "RBC",
      description: "Red blood cell count",
      parameters: ["RBC"],
      normalRange: { min: 4.5, max: 5.5 },
      unit: "million/μL",
    },
    {
      name: "Platelet Count",
      code: "PLT",
      description: "Platelet count",
      parameters: ["Platelets"],
      normalRange: { min: 150000, max: 450000 },
      unit: "cells/μL",
    },

    // Vitamins
    {
      name: "Vitamin D 25-Hydroxy",
      code: "VITD",
      description: "Vitamin D levels",
      parameters: ["Vitamin D"],
      normalRange: { min: 30, max: 100 },
      unit: "ng/mL",
    },
    {
      name: "Vitamin B12",
      code: "B12",
      description: "Vitamin B12 levels",
      parameters: ["Vitamin B12"],
      normalRange: { min: 200, max: 900 },
      unit: "pg/mL",
    },

    // Urine Tests
    {
      name: "Microalbumin, Urine",
      code: "MAU",
      description: "Microalbumin in urine",
      parameters: ["Microalbumin"],
      normalRange: { min: 0, max: 30 },
      unit: "mg/L",
    },
    {
      name: "Creatinine, Urine",
      code: "UCREAT",
      description: "Urine creatinine",
      parameters: ["Creatinine"],
      normalRange: { min: 20, max: 370 },
      unit: "mg/dL",
    },
  ];

  const labTests = [];
  for (const testData of labTestsData) {
    const labTest = await prisma.labTest.upsert({
      where: { code: testData.code },
      update: {},
      create: testData,
    });
    labTests.push(labTest);
  }
  console.log(`✅ ${labTests.length} lab tests seeded`);

  return labTests;
}

module.exports = { seedLabTests }; 