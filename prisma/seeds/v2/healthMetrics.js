const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedHealthMetrics() {
  console.log("📊 Seeding health metrics...");

  // Get patients
  const patients = await prisma.user.findMany({
    where: { role: "PATIENT" }
  });

  const healthMetricsData = [
    // Patient 1 - Blood Sugar readings
    {
      userId: patients[0]?.id,
      metricName: "Blood Sugar (Fasting)",
      reading: 120,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Blood Sugar (Post Prandial)",
      reading: 180,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Blood Sugar (Fasting)",
      reading: 115,
      recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Blood Sugar (Post Prandial)",
      reading: 165,
      recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Blood Sugar (Fasting)",
      reading: 110,
      recordedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Blood Sugar (Post Prandial)",
      reading: 155,
      recordedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },

    // Patient 1 - Blood Pressure readings
    {
      userId: patients[0]?.id,
      metricName: "Systolic Blood Pressure",
      reading: 140,
      recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Diastolic Blood Pressure",
      reading: 90,
      recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Systolic Blood Pressure",
      reading: 135,
      recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Diastolic Blood Pressure",
      reading: 85,
      recordedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },

    // Patient 1 - Weight readings
    {
      userId: patients[0]?.id,
      metricName: "Weight",
      reading: 70.5,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Weight",
      reading: 70.2,
      recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      userId: patients[0]?.id,
      metricName: "Weight",
      reading: 69.8,
      recordedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },

    // Patient 2 - Blood Sugar readings
    {
      userId: patients[1]?.id,
      metricName: "Blood Sugar (Fasting)",
      reading: 95,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: patients[1]?.id,
      metricName: "Blood Sugar (Post Prandial)",
      reading: 140,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: patients[1]?.id,
      metricName: "Blood Sugar (Fasting)",
      reading: 92,
      recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      userId: patients[1]?.id,
      metricName: "Blood Sugar (Post Prandial)",
      reading: 135,
      recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },

    // Patient 2 - Blood Pressure readings
    {
      userId: patients[1]?.id,
      metricName: "Systolic Blood Pressure",
      reading: 120,
      recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      userId: patients[1]?.id,
      metricName: "Diastolic Blood Pressure",
      reading: 80,
      recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },

    // Patient 3 - Blood Sugar readings
    {
      userId: patients[2]?.id,
      metricName: "Blood Sugar (Fasting)",
      reading: 85,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: patients[2]?.id,
      metricName: "Blood Sugar (Post Prandial)",
      reading: 125,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: patients[2]?.id,
      metricName: "Blood Sugar (Fasting)",
      reading: 88,
      recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      userId: patients[2]?.id,
      metricName: "Blood Sugar (Post Prandial)",
      reading: 130,
      recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },

    // Patient 3 - Weight readings
    {
      userId: patients[2]?.id,
      metricName: "Weight",
      reading: 80.0,
      recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    },
    {
      userId: patients[2]?.id,
      metricName: "Weight",
      reading: 79.5,
      recordedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      userId: patients[2]?.id,
      metricName: "Weight",
      reading: 79.2,
      recordedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  ];

  const healthMetrics = [];
  for (const metricData of healthMetricsData) {
    if (metricData.userId) {
      const metric = await prisma.healthMetric.create({
        data: metricData,
      });
      healthMetrics.push(metric);
    }
  }
  console.log(`✅ ${healthMetrics.length} health metrics seeded`);

  return healthMetrics;
}

module.exports = { seedHealthMetrics }; 