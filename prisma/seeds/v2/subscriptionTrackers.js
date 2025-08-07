const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedSubscriptionTrackers() {
  console.log("📊 Seeding subscription trackers...");

  // Get patients and plans
  const patients = await prisma.patientProfile.findMany({
    include: { user: true }
  });

  const plans = await prisma.plan.findMany();

  if (patients.length === 0 || plans.length === 0) {
    console.log("⚠️ No patients or plans found, skipping subscription tracker seeding");
    return [];
  }

  const subscriptionTrackers = [];

  // Create subscription trackers for some patients
  for (let i = 0; i < Math.min(3, patients.length); i++) {
    const patient = patients[i];
    const plan = plans[i % plans.length]; // Cycle through plans
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (plan.duration === "6months" ? 6 : 12));

    const subscriptionTracker = await prisma.subscriptionTracker.create({
      data: {
        patientId: patient.id,
        planId: plan.id,
        doctorConsultationDates: [
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
          new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
        ],
        dieticianConsultationDates: [
          new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 20 days ago
        ],
        labTestsDates: [
          new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 25 days ago
        ],
        ophthalmologistConsultationDates: [],
        usedMedicines: ["Metformin", "Glimepiride"],
        razorpayOrderId: `order_sub_${Date.now()}_${patient.id}`,
        razorpayPaymentId: `pay_sub_${Date.now()}_${patient.id}`,
        paymentStatus: "COMPLETED",
        startDate: startDate,
        endDate: endDate,
        isActive: true,
      },
    });

    subscriptionTrackers.push(subscriptionTracker);
  }

  console.log(`✅ ${subscriptionTrackers.length} subscription trackers seeded`);

  return subscriptionTrackers;
}

module.exports = { seedSubscriptionTrackers }; 