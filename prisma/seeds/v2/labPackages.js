const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedLabPackages() {
  console.log("🧪 Seeding lab packages...");

  const labPackagesData = [
    {
      name: "Care+",
      shortDescription: "",
      description: "CBC: Detects infections, anemia, and blood disorders. LFT: Assesses liver health (ALT, AST, Bilirubin, etc.). KFT: Checks kidney function (Creatinine, Urea, Electrolytes). Thyroid Panel: Evaluates thyroid issues (TSH, T3, T4). Lipid Profile: Measures cholesterol and heart risk. Blood Sugar & HbA1c: Detects and monitors diabetes. Urine Panel: Urinalysis: Screens for infections, kidney issues, diabetes. Microalbumin: Early detection of diabetic kidney damage. Vitamin B12 status. Vit D status.",
      price: 1999,
      parameters: {
        "FBS": ["Fasting Plasma Glucose"],
        "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],
        "2 hour PP": ["Glucose Post Prandial"],
        "LFT (Liver function test)": [
          "Serum Bilirubin (Indirect)",
          "SGOT / AST",
          "SGPT / ALT",
          "Total Protein",
          "Albumin",
          "Albumin Globulin A/G Ratio",
          "Alkaline Phosphatase",
          "AST / ALT Ratio",
          "Bilirubin Direct",
          "Bilirubin Total",
          "Globulin"
        ],
        "KFT (Kidney function test)": [
          "Urea",
          "Blood Urea",
          "Blood Urea Nitrogen (BUN)",
          "Creatinine",
          "BUN Creatinine Ratio",
          "Uric Acid",
          "Electrolytes (Na/K/Cl)",
          "Sodium",
          "Potassium",
          "Chloride",
          "Total Protein",
          "Albumin",
          "Globulin",
          "Albumin Globulin A/G Ratio",
          "pH Level",
          "Specific Gravity",
          "Remarks",
          "Bilirubin",
          "Urobilinogen",
          "Nitrite",
          "Pus Cells, Urine",
          "RBC, Urine",
          "Epithelial Cells, Urine",
          "Colour, Urine",
          "Appearance",
          "Casts",
          "Crystals",
          "Bacteria",
          "Blood",
          "Glucose",
          "Protein",
          "Ketones"
        ],
        "Lipid Profile": [
          "Total Cholesterol",
          "Triglycerides",
          "HDL Cholesterol",
          "VLDL Cholesterol",
          "LDL Cholesterol (Calculated)",
          "HDL/LDL Ratio",
          "HDL/Total Cholesterol Ratio"
        ],
        "Urine ACR": [
          "Microalbumin, Urine",
          "Creatinine, Urine",
          "Albumin Creatinine Ratio"
        ],
        "Throid Profile Test": ["TSH", "T3", "T4"],
        "Urine R/M": ["Colour", "Odour", "pH", "Specific gravity"],
        "CBC": [
          "Haemoglobin (Hb)",
          "Total WBC Count / TLC",
          "RBC Count",
          "PCV / Hematocrit",
          "MCV",
          "MCH",
          "MCHC",
          "RDW (Red Cell Distribution Width)",
          "DLC (Differential Leucocyte Count)",
          "Platelet Count",
          "MPV (Mean Platelet Volume)",
          "Absolute Neutrophil Count (ANC)",
          "Absolute Eosinophil Count (AEC)",
          "Absolute Lymphocyte Count",
          "Absolute Monocyte Count",
          "Absolute Basophil Count",
          "Meta Myelocytes",
          "Myelocytes",
          "Blasts / Atypical Cells",
          "Atypical Lymphocytes",
          "Neutrophils",
          "Lymphocytes",
          "Monocytes",
          "Basophils",
          "Eosinophils",
          "Band Forms",
          "Pro Myelocytes",
          "Pro Lymphocytes",
          "Plasma Cells",
          "Nucleated RBC Count"
        ],
        "Vitamin D": ["Vitamin D 25 - Hydroxy"],
        "Vitamin B12": ["Vitamin B12"]
      },
      criticalRequirements: "Fasting required, Package",
      isLabPackage: false
    },
    {
      name: "Basic",
      shortDescription: "",
      description: "In this Lab test you will get tested for HbA1C, FBS, 2 hr PP the basic test needed for diabetes testing and management.",
      price: 499,
      parameters: {
        "Basic": ["Fasting Plasma Glucose", "HbA1C", "Glucose Post Prandial"]
      },
      criticalRequirements: "Fasting Required, Package",
      isLabPackage: false
    },
    {
      name: "Blood glucose",
      shortDescription: "",
      description: "",
      price: 149,
      parameters: {
        "Basic": ["Fasting Plasma Glucose", "Glucose Post Prandial"]
      },
      criticalRequirements: "Fasting required",
      isLabPackage: true
    },
    {
      name: "Care",
      shortDescription: "",
      description: "CBC: Detects infections, anemia, and blood disorders. LFT: Assesses liver health (ALT, AST, Bilirubin, etc.). KFT: Checks kidney function (Creatinine, Urea, Electrolytes). Thyroid Panel: Evaluates thyroid issues (TSH, T3, T4). Lipid Profile: Measures cholesterol and heart risk. Blood Sugar & HbA1c: Detects and monitors diabetes. Urine Panel: Urinalysis: Screens for infections, kidney issues, diabetes. Microalbumin: Early detection of diabetic kidney damage.",
      price: 1499,
      parameters: {
        "FBS": ["Fasting Plasma Glucose"],
        "HbA1C": ["HbA1C (Glycosylated Hemoglobin)"],
        "2 hour PP": ["Glucose Post Prandial"],
        "LFT (Liver function test)": [
          "Serum Bilirubin (Indirect)",
          "SGOT / AST",
          "SGPT / ALT",
          "Total Protein",
          "Albumin",
          "Albumin Globulin A/G Ratio",
          "Alkaline Phosphatase",
          "AST / ALT Ratio",
          "Bilirubin Direct",
          "Bilirubin Total",
          "Globulin"
        ],
        "KFT (Kidney function test)": [
          "Urea",
          "Blood Urea",
          "Blood Urea Nitrogen (BUN)",
          "Creatinine",
          "BUN Creatinine Ratio",
          "Uric Acid",
          "Electrolytes (Na/K/Cl)",
          "Sodium",
          "Potassium",
          "Chloride",
          "pH",
          "Specific Gravity",
          "Remarks",
          "Urobilinogen",
          "Nitrite",
          "Pus Cells, Urine",
          "RBC, Urine",
          "Epithelial Cells, Urine",
          "Colour",
          "Odour",
          "Appearance",
          "Casts",
          "Crystals",
          "Bacteria",
          "Blood",
          "Glucose",
          "Protein",
          "Ketones"
        ],
        "Lipid Profile": [
          "Total Cholesterol",
          "Triglycerides",
          "HDL Cholesterol",
          "VLDL Cholesterol",
          "LDL Cholesterol (Calculated)",
          "HDL/LDL Ratio",
          "HDL/Total Cholesterol Ratio"
        ],
        "Urine ACR": [
          "Microalbumin, Urine",
          "Creatinine, Urine",
          "Albumin Creatinine Ratio"
        ],
        "Thyroid Profile Test": ["TSH", "T3", "T4"],
        "CBC": [
          "Haemoglobin (Hb)",
          "Total WBC Count / TLC",
          "RBC Count",
          "PCV / Hematocrit",
          "MCV",
          "MCH",
          "MCHC",
          "RDW (Red Cell Distribution Width)",
          "DLC (Differential Leucocyte Count)",
          "Platelet Count",
          "MPV (Mean Platelet Volume)",
          "Absolute Neutrophil Count (ANC)",
          "Absolute Eosinophil Count (AEC)",
          "Absolute Lymphocyte Count",
          "Absolute Monocyte Count",
          "Absolute Basophil Count",
          "Meta Myelocytes",
          "Myelocytes",
          "Blasts / Atypical Cells",
          "Atypical Lymphocytes",
          "Neutrophils",
          "Lymphocytes",
          "Monocytes",
          "Basophils",
          "Eosinophils",
          "Band Forms",
          "Pro Myelocytes",
          "Pro Lymphocytes",
          "Plasma Cells",
          "Nucleated RBC Count"
        ]
      },
      criticalRequirements: "Fasting required, Package",
      isLabPackage: false
    },
    {
      name: "SAL panel",
      shortDescription: "Care+, Amylase, Lipase",
      description: "",
      price: 2850,
      parameters: {
        "Care+": ["Care+ Package"],
        "Serum Amylase": ["Serum Amylase"],
        "Serum Lipase": ["Serum Lipase"]
      },
      criticalRequirements: "",
      isLabPackage: false
    }
  ];

  const labPackages = [];
  for (const packageData of labPackagesData) {
    const labPackage = await prisma.labPackage.upsert({
      where: { name: packageData.name },
      update: {},
      create: packageData,
    });
    labPackages.push(labPackage);
  }
  console.log(`✅ ${labPackages.length} lab packages seeded`);

  return labPackages;
}

module.exports = { seedLabPackages }; 