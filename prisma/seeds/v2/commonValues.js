const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedCommonValues() {
  console.log("📝 Seeding common values...");

  const commonValuesData = [
    // Frequency values
    { type: "frequency", value: "Once daily", category: "Daily" },
    { type: "frequency", value: "Twice daily", category: "Daily" },
    { type: "frequency", value: "Three times daily", category: "Daily" },
    { type: "frequency", value: "Four times daily", category: "Daily" },
    { type: "frequency", value: "Once weekly", category: "Weekly" },
    { type: "frequency", value: "Twice weekly", category: "Weekly" },
    { type: "frequency", value: "Once monthly", category: "Monthly" },
    { type: "frequency", value: "As needed", category: "PRN" },
    { type: "frequency", value: "Before meals", category: "Meal Related" },
    { type: "frequency", value: "After meals", category: "Meal Related" },

    // Medicine time values
    { type: "medicineTime", value: "Morning", category: "Time of Day" },
    { type: "medicineTime", value: "Afternoon", category: "Time of Day" },
    { type: "medicineTime", value: "Evening", category: "Time of Day" },
    { type: "medicineTime", value: "Before breakfast", category: "Meal Related" },
    { type: "medicineTime", value: "After breakfast", category: "Meal Related" },
    { type: "medicineTime", value: "Before lunch", category: "Meal Related" },
    { type: "medicineTime", value: "After lunch", category: "Meal Related" },
    { type: "medicineTime", value: "Before dinner", category: "Meal Related" },
    { type: "medicineTime", value: "After dinner", category: "Meal Related" },
    { type: "medicineTime", value: "Before bedtime", category: "Time of Day" },
    { type: "medicineTime", value: "On empty stomach", category: "Meal Related" },

    // Duration values
    { type: "duration", value: "3 days", category: "Short Term" },
    { type: "duration", value: "5 days", category: "Short Term" },
    { type: "duration", value: "7 days", category: "Short Term" },
    { type: "duration", value: "10 days", category: "Short Term" },
    { type: "duration", value: "15 days", category: "Medium Term" },
    { type: "duration", value: "21 days", category: "Medium Term" },
    { type: "duration", value: "30 days", category: "Medium Term" },
    { type: "duration", value: "45 days", category: "Medium Term" },
    { type: "duration", value: "60 days", category: "Long Term" },
    { type: "duration", value: "90 days", category: "Long Term" },
    { type: "duration", value: "6 months", category: "Long Term" },
    { type: "duration", value: "1 year", category: "Long Term" },
    { type: "duration", value: "Lifetime", category: "Long Term" },

    // Advice values
    { type: "advice", value: "Regular exercise recommended", category: "Lifestyle" },
    { type: "advice", value: "Follow diabetic diet", category: "Diet" },
    { type: "advice", value: "Monitor blood sugar regularly", category: "Monitoring" },
    { type: "advice", value: "Avoid sugary foods", category: "Diet" },
    { type: "advice", value: "Take medicines on time", category: "Medication" },
    { type: "advice", value: "Regular follow-up required", category: "Follow-up" },
    { type: "advice", value: "Maintain healthy weight", category: "Lifestyle" },
    { type: "advice", value: "Quit smoking", category: "Lifestyle" },
    { type: "advice", value: "Limit alcohol consumption", category: "Lifestyle" },
    { type: "advice", value: "Check feet daily", category: "Monitoring" },
    { type: "advice", value: "Annual eye examination", category: "Monitoring" },
    { type: "advice", value: "Annual kidney function test", category: "Monitoring" },
    { type: "advice", value: "Keep emergency contact handy", category: "Emergency" },
    { type: "advice", value: "Carry glucose tablets", category: "Emergency" },
    { type: "advice", value: "Wear medical alert bracelet", category: "Emergency" },

    // Tests requested values
    { type: "tests", value: "Fasting Blood Sugar", category: "Diabetes" },
    { type: "tests", value: "HbA1C", category: "Diabetes" },
    { type: "tests", value: "Post Prandial Blood Sugar", category: "Diabetes" },
    { type: "tests", value: "Complete Blood Count", category: "General" },
    { type: "tests", value: "Liver Function Test", category: "General" },
    { type: "tests", value: "Kidney Function Test", category: "General" },
    { type: "tests", value: "Lipid Profile", category: "Cardiac" },
    { type: "tests", value: "Thyroid Profile", category: "Endocrine" },
    { type: "tests", value: "Urine Analysis", category: "General" },
    { type: "tests", value: "Microalbumin Test", category: "Diabetes" },
    { type: "tests", value: "Vitamin D", category: "Vitamins" },
    { type: "tests", value: "Vitamin B12", category: "Vitamins" },
    { type: "tests", value: "ECG", category: "Cardiac" },
    { type: "tests", value: "Echocardiogram", category: "Cardiac" },
    { type: "tests", value: "Chest X-Ray", category: "Respiratory" },
    { type: "tests", value: "Retinal Examination", category: "Eye" },
    { type: "tests", value: "Foot Examination", category: "Diabetes" },
    { type: "tests", value: "Blood Pressure Monitoring", category: "Cardiac" },
  ];

  const commonValues = [];
  for (const valueData of commonValuesData) {
    const commonValue = await prisma.commonValue.upsert({
      where: {
        type_value: {
          type: valueData.type,
          value: valueData.value,
        },
      },
      update: {},
      create: valueData,
    });
    commonValues.push(commonValue);
  }
  console.log(`✅ ${commonValues.length} common values seeded`);

  return commonValues;
}

module.exports = { seedCommonValues }; 