const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedPlans() {
  console.log("📋 Seeding plans and plan features...");

  // Seed Plans - Updated to match SQL data exactly
  const plansData = [
    {
      id: 1,
      name: "Basic",
      duration: "6months",
      price: 2499.00,
      discountPercentage: 15,
    },
    {
      id: 2,
      name: "Care",
      duration: "6months",
      price: 4999.00,
      discountPercentage: 25,
    },
    {
      id: 3,
      name: "Care+",
      duration: "6months",
      price: 9999.00,
      discountPercentage: 35,
    },
    {
      id: 4,
      name: "Basic",
      duration: "12months",
      price: 4999.00,
      discountPercentage: 15,
    },
    {
      id: 5,
      name: "Care",
      duration: "12months",
      price: 8999.00,
      discountPercentage: 25,
    },
    {
      id: 6,
      name: "Care+",
      duration: "12months",
      price: 16999.00,
      discountPercentage: 35,
    },
    {
      id: 7,
      name: "Trial Package",
      duration: "3 months",
      price: 2999.00,
      discountPercentage: 20,
    },
    {
      id: 8,
      name: "Care",
      duration: "6months",
      price: 4999.00,
      discountPercentage: 25,
    },
  ];

  const plans = [];
  for (const planData of plansData) {
    const plan = await prisma.plan.upsert({
      where: { id: planData.id },
      update: {},
      create: planData,
    });
    plans.push(plan);
  }
  console.log(`✅ ${plans.length} plans seeded`);

  // Seed Plan Features - Complete data from SQL files
  const planFeaturesData = [
    // Plan 1 (Basic 6mo) - 7 features
    {
      id: 528,
      planId: 1,
      featureName: "Doctor Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: "-------",
    },
    {
      id: 529,
      planId: 1,
      featureName: "Dietician Consultation",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: null,
    },
    {
      id: 530,
      planId: 1,
      featureName: "Lab Tests",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      parameters: '{"Basic":["Fasting Plasma Glucose","HbA1C","Glucose Post Prandial"]}',
      notes: null,
    },
    {
      id: 531,
      planId: 1,
      featureName: "Ophthalmologist Consultation",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: null,
    },
    {
      id: 532,
      planId: 1,
      featureName: "Medicines",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: "Upto 15% off",
    },
    {
      id: 533,
      planId: 1,
      featureName: "BP,  Body  Composition  Analysis  test",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 534,
      planId: 1,
      featureName: "Biosthesiometer Test (Nerve Sensitivity Test)",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },

    // Plan 2 (Care 6mo) - 7 features  
    {
      id: 563,
      planId: 2,
      featureName: "Lab Tests",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      parameters: '{"FBS":["Fasting Plasma Glucose"],"HbA1C":["HbA1C (Glycosylated Hemoglobin)"],"2 hour PP":["Glucose Post Prandial"],"LFT (Liver function test)":["Serum Bilirubin (Indirect)","SGOT / AST","SGPT / ALT","Total Protein","Albumin","Albumin Globulin A/G Ratio","Alkaline Phosphatase","AST / ALT Ratio","Bilirubin Direct","Bilirubin Total","Globulin"],"KFT (Kidney function test)":["Urea","Blood Urea","Blood Urea Nitrogen (BUN)","Creatinine","BUN Creatinine Ratio","Uric Acid","Electrolytes (Na/K/Cl)","Sodium","Potassium","Chloride","pH","Specific Gravity","Remarks","Urobilinogen","Nitrite","Pus Cells, Urine","RBC, Urine","Epithelial Cells, Urine","Colour","Odour","Appearance","Casts","Crystals","Bacteria","Blood","Glucose","Protein","Ketones"],"Lipid Profile":["Total Cholesterol","Triglycerides","HDL Cholesterol","VLDL Cholesterol","LDL Cholesterol (Calculated)","HDL/LDL Ratio","HDL/Total Cholesterol Ratio"],"Urine ACR":["Microalbumin, Urine","Creatinine, Urine","Albumin Creatinine Ratio"],"Thyroid Profile Test":["TSH","T3","T4"],"CBC":["Haemoglobin (Hb)","Total WBC Count / TLC","RBC Count","PCV / Hematocrit","MCV","MCH","MCHC","RDW (Red Cell Distribution Width)","DLC (Differential Leucocyte Count)","Platelet Count","MPV (Mean Platelet Volume)","Absolute Neutrophil Count (ANC)","Absolute Eosinophil Count (AEC)","Absolute Lymphocyte Count","Absolute Monocyte Count","Absolute Basophil Count","Meta Myelocytes","Myelocytes","Blasts / Atypical Cells","Atypical Lymphocytes","Neutrophils","Lymphocytes","Monocytes","Basophils","Eosinophils","Band Forms","Pro Myelocytes","Pro Lymphocytes","Plasma Cells","Nucleated RBC Count"]}',
      notes: "1 complete blood panel and urine test + 1 FBS, HbA1c, 2hr PP",
    },
    {
      id: 564,
      planId: 2,
      featureName: "Doctor Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 565,
      planId: 2,
      featureName: "Dietician Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 566,
      planId: 2,
      featureName: "Ophthalmologist Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 6,
      notes: null,
    },
    {
      id: 567,
      planId: 2,
      featureName: "Medicines",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: "Upto 25% off",
    },
    {
      id: 568,
      planId: 2,
      featureName: "BP,  Body  Composition  Analysis  test",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 569,
      planId: 2,
      featureName: "Biosthesiometer Test (Nerve Sensitivity Test)",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },

    // Plan 3 (Care+ 6mo) - 7 features
    {
      id: 283,
      planId: 3,
      featureName: "Lab Tests",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      parameters: '{"FBS":["Fasting Plasma Glucose"],"HbA1C":["HbA1C (Glycosylated Hemoglobin)"],"2 hour PP":["Glucose Post Prandial"],"LFT (Liver function test)":["Serum Bilirubin (Indirect)","SGOT / AST","SGPT / ALT","Total Protein","Albumin","Albumin Globulin A/G Ratio","Alkaline Phosphatase","AST / ALT Ratio","Bilirubin Direct","Bilirubin Total","Globulin"],"KFT (Kidney function test)":["Urea","Blood Urea","Blood Urea Nitrogen (BUN)","Creatinine","BUN Creatinine Ratio","Uric Acid","Electrolytes (Na/K/Cl)","Sodium","Potassium","Chloride","Total Protein","Albumin","Globulin","Albumin Globulin A/G Ratio","pH Level","Specific Gravity","Remarks","Bilirubin","Urobilinogen","Nitrite","Pus Cells, Urine","RBC, Urine","Epithelial Cells, Urine","Colour, Urine","Appearance","Casts","Crystals","Bacteria","Blood","Glucose","Protein","Ketones"],"Lipid Profile":["Total Cholesterol","Triglycerides","HDL Cholesterol","VLDL Cholesterol","LDL Cholesterol (Calculated)","HDL/LDL Ratio","HDL/Total Cholesterol Ratio"],"Urine ACR":["Microalbumin, Urine","Creatinine, Urine","Albumin Creatinine Ratio"],"Throid Profile Test":["TSH","T3","T4"],"Urine R/M":["Colour","Odour","pH","Specific gravity"],"CBC":["Haemoglobin (Hb)","Total WBC Count / TLC","RBC Count","PCV / Hematocrit","MCV","MCH","MCHC","RDW (Red Cell Distribution Width)","DLC (Differential Leucocyte Count)","Platelet Count","MPV (Mean Platelet Volume)","Absolute Neutrophil Count (ANC)","Absolute Eosinophil Count (AEC)","Absolute Lymphocyte Count","Absolute Monocyte Count","Absolute Basophil Count","Meta Myelocytes","Myelocytes","Blasts / Atypical Cells","Atypical Lymphocytes","Neutrophils","Lymphocytes","Monocytes","Basophils","Eosinophils","Band Forms","Pro Myelocytes","Pro Lymphocytes","Plasma Cells","Nucleated RBC Count"],"Vitamin D":["Vitamin D 25 - Hydroxy"],"Vitamin B12":["Vitamin B12"]}',
      notes: "1 complete blood test + urine every 3 months",
    },
    {
      id: 284,
      planId: 3,
      featureName: "Dietician Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 285,
      planId: 3,
      featureName: "Ophthalmologist Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 6,
      notes: null,
    },
    {
      id: 286,
      planId: 3,
      featureName: "Doctor Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 287,
      planId: 3,
      featureName: "Medicines",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: "upto 35%",
    },
    {
      id: 288,
      planId: 3,
      featureName: "BP,  Body  Composition   Analysis  test",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 289,
      planId: 3,
      featureName: "Biosthesiometer Test (Nerve Sensitivity Test)",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },

    // Plan 4 (Basic 12mo) - 7 features
    {
      id: 409,
      planId: 4,
      featureName: "Doctor Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 410,
      planId: 4,
      featureName: "Dietician Consultation",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: null,
    },
    {
      id: 411,
      planId: 4,
      featureName: "Lab Tests",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      parameters: '{"Basic":["Fasting Plasma Glucose","HbA1C","Glucose Post Prandial"]}',
      notes: "1 complete blood test + urine",
    },
    {
      id: 412,
      planId: 4,
      featureName: "Ophthalmologist Consultation",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: null,
    },
    {
      id: 413,
      planId: 4,
      featureName: "Medicines",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: "Upto 15% off",
    },
    {
      id: 414,
      planId: 4,
      featureName: "BP,  Body  Composition   Analysis  test",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 415,
      planId: 4,
      featureName: "Biosthesiometer Test (Nerve Sensitivity Test)",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },

    // Plan 5 (Care 12mo) - 7 features
    {
      id: 542,
      planId: 5,
      featureName: "Lab Tests",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      parameters: '{"FBS":["Fasting Plasma Glucose"],"HbA1C":["HbA1C (Glycosylated Hemoglobin)"],"2 hour PP":["Glucose Post Prandial"],"LFT (Liver function test)":["Serum Bilirubin (Indirect)","SGOT / AST","SGPT / ALT","Total Protein","Albumin","Albumin Globulin A/G Ratio","Alkaline Phosphatase","AST / ALT Ratio","Bilirubin Direct","Bilirubin Total","Globulin"],"KFT (Kidney function test)":["Urea","Blood Urea","Blood Urea Nitrogen (BUN)","Creatinine","BUN Creatinine Ratio","Uric Acid","Electrolytes (Na/K/Cl)","Sodium","Potassium","Chloride","pH","Specific Gravity","Remarks","Urobilinogen","Nitrite","Pus Cells, Urine","RBC, Urine","Epithelial Cells, Urine","Colour","Odour","Appearance","Casts","Crystals","Bacteria","Blood","Glucose","Protein","Ketones"],"Lipid Profile":["Total Cholesterol","Triglycerides","HDL Cholesterol","VLDL Cholesterol","LDL Cholesterol (Calculated)","HDL/LDL Ratio","HDL/Total Cholesterol Ratio"],"Urine ACR":["Microalbumin, Urine","Creatinine, Urine","Albumin Creatinine Ratio"],"Thyroid Profile Test":["TSH","T3","T4"],"CBC":["Haemoglobin (Hb)","Total WBC Count / TLC","RBC Count","PCV / Hematocrit","MCV","MCH","MCHC","RDW (Red Cell Distribution Width)","DLC (Differential Leucocyte Count)","Platelet Count","MPV (Mean Platelet Volume)","Absolute Neutrophil Count (ANC)","Absolute Eosinophil Count (AEC)","Absolute Lymphocyte Count","Absolute Monocyte Count","Absolute Basophil Count","Meta Myelocytes","Myelocytes","Blasts / Atypical Cells","Atypical Lymphocytes","Neutrophils","Lymphocytes","Monocytes","Basophils","Eosinophils","Band Forms","Pro Myelocytes","Pro Lymphocytes","Plasma Cells","Nucleated RBC Count"]}',
      notes: "1 complete blood andurine test + 1 FBS, HbA1C, 2hr PP every 3 months",
    },
    {
      id: 543,
      planId: 5,
      featureName: "Doctor Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 544,
      planId: 5,
      featureName: "Dietician Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 545,
      planId: 5,
      featureName: "Ophthalmologist Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 12,
      notes: null,
    },
    {
      id: 546,
      planId: 5,
      featureName: "Medicines",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: "Upto 25%",
    },
    {
      id: 547,
      planId: 5,
      featureName: "Biosthesiometer Test (Nerve Sensitivity Test)",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 548,
      planId: 5,
      featureName: "BP,  Body  Composition   Analysis  test",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },

    // Plan 6 (Care+ 12mo) - 7 features
    {
      id: 458,
      planId: 6,
      featureName: "Ophthalmologist Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 12,
      notes: null,
    },
    {
      id: 459,
      planId: 6,
      featureName: "Doctor Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 460,
      planId: 6,
      featureName: "Dietician Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 461,
      planId: 6,
      featureName: "Lab Tests",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      parameters: '{"FBS":["Fasting Plasma Glucose"],"HbA1C":["HbA1C (Glycosylated Hemoglobin)"],"2 hour PP":["Glucose Post Prandial"],"LFT (Liver function test)":["Serum Bilirubin (Indirect)","SGOT / AST","SGPT / ALT","Total Protein","Albumin","Albumin Globulin A/G Ratio","Alkaline Phosphatase","AST / ALT Ratio","Bilirubin Direct","Bilirubin Total","Globulin"],"KFT (Kidney function test)":["Urea","Blood Urea","Blood Urea Nitrogen (BUN)","Creatinine","BUN Creatinine Ratio","Uric Acid","Electrolytes (Na/K/Cl)","Sodium","Potassium","Chloride","Total Protein","Albumin","Globulin","Albumin Globulin A/G Ratio","pH Level","Specific Gravity","Remarks","Bilirubin","Urobilinogen","Nitrite","Pus Cells, Urine","RBC, Urine","Epithelial Cells, Urine","Colour, Urine","Appearance","Casts","Crystals","Bacteria","Blood","Glucose","Protein","Ketones"],"Lipid Profile":["Total Cholesterol","Triglycerides","HDL Cholesterol","VLDL Cholesterol","LDL Cholesterol (Calculated)","HDL/LDL Ratio","HDL/Total Cholesterol Ratio"],"Urine ACR":["Microalbumin, Urine","Creatinine, Urine","Albumin Creatinine Ratio"],"Throid Profile Test":["TSH","T3","T4"],"Urine R/M":["Colour","Odour","pH","Specific gravity"],"CBC":["Haemoglobin (Hb)","Total WBC Count / TLC","RBC Count","PCV / Hematocrit","MCV","MCH","MCHC","RDW (Red Cell Distribution Width)","DLC (Differential Leucocyte Count)","Platelet Count","MPV (Mean Platelet Volume)","Absolute Neutrophil Count (ANC)","Absolute Eosinophil Count (AEC)","Absolute Lymphocyte Count","Absolute Monocyte Count","Absolute Basophil Count","Meta Myelocytes","Myelocytes","Blasts / Atypical Cells","Atypical Lymphocytes","Neutrophils","Lymphocytes","Monocytes","Basophils","Eosinophils","Band Forms","Pro Myelocytes","Pro Lymphocytes","Plasma Cells","Nucleated RBC Count"],"Vitamin D":["Vitamin D 25 - Hydroxy"],"Vitamin B12":["Vitamin B12"]}',
      notes: "1 complete blood test + urine every 3 months",
    },
    {
      id: 462,
      planId: 6,
      featureName: "Medicines",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: "Upto 35%",
    },
    {
      id: 463,
      planId: 6,
      featureName: "Biosthesiometer Test (Nerve Sensitivity Test)",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 464,
      planId: 6,
      featureName: "BP,  Body  Composition   Analysis  test",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },

    // Plan 7 (Trial Package 3mo) - 7 features
    {
      id: 472,
      planId: 7,
      featureName: "Doctor Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 473,
      planId: 7,
      featureName: "Dietitian consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 474,
      planId: 7,
      featureName: "Lab Tests",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      parameters: '{"FBS":["Fasting Plasma Glucose"],"HbA1C":["HbA1C (Glycosylated Hemoglobin)"],"2 hour PP":["Glucose Post Prandial"],"LFT (Liver function test)":["Serum Bilirubin (Indirect)","SGOT / AST","SGPT / ALT","Total Protein","Albumin","Albumin Globulin A/G Ratio","Alkaline Phosphatase","AST / ALT Ratio","Bilirubin Direct","Bilirubin Total","Globulin"],"KFT (Kidney function test)":["Urea","Blood Urea","Blood Urea Nitrogen (BUN)","Creatinine","BUN Creatinine Ratio","Uric Acid","Electrolytes (Na/K/Cl)","Sodium","Potassium","Chloride","pH","Specific Gravity","Remarks","Urobilinogen","Nitrite","Pus Cells, Urine","RBC, Urine","Epithelial Cells, Urine","Colour","Odour","Appearance","Casts","Crystals","Bacteria","Blood","Glucose","Protein","Ketones"],"Lipid Profile":["Total Cholesterol","Triglycerides","HDL Cholesterol","VLDL Cholesterol","LDL Cholesterol (Calculated)","HDL/LDL Ratio","HDL/Total Cholesterol Ratio"],"Urine ACR":["Microalbumin, Urine","Creatinine, Urine","Albumin Creatinine Ratio"],"Thyroid Profile Test":["TSH","T3","T4"],"CBC":["Haemoglobin (Hb)","Total WBC Count / TLC","RBC Count","PCV / Hematocrit","MCV","MCH","MCHC","RDW (Red Cell Distribution Width)","DLC (Differential Leucocyte Count)","Platelet Count","MPV (Mean Platelet Volume)","Absolute Neutrophil Count (ANC)","Absolute Eosinophil Count (AEC)","Absolute Lymphocyte Count","Absolute Monocyte Count","Absolute Basophil Count","Meta Myelocytes","Myelocytes","Blasts / Atypical Cells","Atypical Lymphocytes","Neutrophils","Lymphocytes","Monocytes","Basophils","Eosinophils","Band Forms","Pro Myelocytes","Pro Lymphocytes","Plasma Cells","Nucleated RBC Count"]}',
      notes: null,
    },
    {
      id: 475,
      planId: 7,
      featureName: "Ophthalmologist",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 476,
      planId: 7,
      featureName: "Medicines",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: "Upto 15% off",
    },
    {
      id: 477,
      planId: 7,
      featureName: "BP, Body composition analysis",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 478,
      planId: 7,
      featureName: "Biosthesiometer test/ Nerve Sensitivity test",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },

    // Plan 8 (Care 6mo duplicate) - 7 features
    {
      id: 570,
      planId: 8,
      featureName: "Lab Tests",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      parameters: '{"FBS":["Fasting Plasma Glucose"],"HbA1C":["HbA1C (Glycosylated Hemoglobin)"],"2 hour PP":["Glucose Post Prandial"],"LFT (Liver function test)":["Serum Bilirubin (Indirect)","SGOT / AST","SGPT / ALT","Total Protein","Albumin","Albumin Globulin A/G Ratio","Alkaline Phosphatase","AST / ALT Ratio","Bilirubin Direct","Bilirubin Total","Globulin"],"KFT (Kidney function test)":["Urea","Blood Urea","Blood Urea Nitrogen (BUN)","Creatinine","BUN Creatinine Ratio","Uric Acid","Electrolytes (Na/K/Cl)","Sodium","Potassium","Chloride","pH","Specific Gravity","Remarks","Urobilinogen","Nitrite","Pus Cells, Urine","RBC, Urine","Epithelial Cells, Urine","Colour","Odour","Appearance","Casts","Crystals","Bacteria","Blood","Glucose","Protein","Ketones"],"Lipid Profile":["Total Cholesterol","Triglycerides","HDL Cholesterol","VLDL Cholesterol","LDL Cholesterol (Calculated)","HDL/LDL Ratio","HDL/Total Cholesterol Ratio"],"Urine ACR":["Microalbumin, Urine","Creatinine, Urine","Albumin Creatinine Ratio"],"Thyroid Profile Test":["TSH","T3","T4"],"CBC":["Haemoglobin (Hb)","Total WBC Count / TLC","RBC Count","PCV / Hematocrit","MCV","MCH","MCHC","RDW (Red Cell Distribution Width)","DLC (Differential Leucocyte Count)","Platelet Count","MPV (Mean Platelet Volume)","Absolute Neutrophil Count (ANC)","Absolute Eosinophil Count (AEC)","Absolute Lymphocyte Count","Absolute Monocyte Count","Absolute Basophil Count","Meta Myelocytes","Myelocytes","Blasts / Atypical Cells","Atypical Lymphocytes","Neutrophils","Lymphocytes","Monocytes","Basophils","Eosinophils","Band Forms","Pro Myelocytes","Pro Lymphocytes","Plasma Cells","Nucleated RBC Count"]}',
      notes: "1 complete blood panel and urine test + 1 FBS, HbA1c, 2hr PP",
    },
    {
      id: 571,
      planId: 8,
      featureName: "Doctor Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 572,
      planId: 8,
      featureName: "Dietician Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 573,
      planId: 8,
      featureName: "Ophthalmologist Consultation",
      occurrencesPerInterval: 1,
      intervalInMonths: 6,
      notes: null,
    },
    {
      id: 574,
      planId: 8,
      featureName: "Medicines",
      occurrencesPerInterval: null,
      intervalInMonths: null,
      notes: "Upto 25% off",
    },
    {
      id: 575,
      planId: 8,
      featureName: "BP,  Body  Composition  Analysis  test",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
    {
      id: 576,
      planId: 8,
      featureName: "Biosthesiometer Test (Nerve Sensitivity Test)",
      occurrencesPerInterval: 1,
      intervalInMonths: 3,
      notes: null,
    },
  ];

  for (const featureData of planFeaturesData) {
    // Check if plan feature already exists
    const existingFeature = await prisma.planFeature.findFirst({
      where: {
        planId: featureData.planId,
        featureName: featureData.featureName,
      },
    });

    if (!existingFeature) {
      await prisma.planFeature.create({
        data: featureData,
      });
    }
  }
  console.log(`✅ ${planFeaturesData.length} plan features seeded`);

  return plans;
}

module.exports = { seedPlans }; 