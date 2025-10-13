async function seedMealTimings(tx = require("@prisma/client").PrismaClient) {
  console.log("🍽️ Seeding default meal timing templates...");

  const DEFAULT_MEAL_TIMINGS = [
    { id: 'breakfast', name: 'Breakfast', order: 1, icon: '🌅', color: 'bg-orange-100 text-orange-800' },
    { id: 'midMorning', name: 'Mid-morning Snack', order: 2, icon: '☕', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'lunch', name: 'Lunch', order: 3, icon: '🍽️', color: 'bg-green-100 text-green-800' },
    { id: 'eveningSnack', name: 'Evening Snack', order: 4, icon: '🍎', color: 'bg-blue-100 text-blue-800' },
    { id: 'dinner', name: 'Dinner', order: 5, icon: '🌙', color: 'bg-purple-100 text-purple-800' },
    { id: 'bedtime', name: 'Bedtime', order: 6, icon: '🛏️', color: 'bg-gray-100 text-gray-800' },
  ];

  try {
    // Get all dieticians
    const dieticians = await tx.user.findMany({
      where: {
        role: 'DIETICIAN',
        deletedAt: null
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Found ${dieticians.length} dieticians`);

    const createdTemplates = [];

    for (const dietician of dieticians) {
      // Check if dietician already has a default template
      const existingTemplate = await tx.dietMealTimingTemplate.findFirst({
        where: {
          dieticianId: dietician.id,
          isDefault: true,
          deletedAt: null
        }
      });

      if (!existingTemplate) {
        // Create default template
        const template = await tx.dietMealTimingTemplate.create({
          data: {
            dieticianId: dietician.id,
            name: 'Standard 6-Meal Plan',
            mealTimings: DEFAULT_MEAL_TIMINGS,
            isDefault: true
          }
        });

        createdTemplates.push(template);
        console.log(`✅ Created default template for ${dietician.name}`);
      } else {
        console.log(`⏭️  ${dietician.name} already has a default template`);
      }
    }

    console.log(`✅ ${createdTemplates.length} meal timing templates seeded`);
    return createdTemplates;
  } catch (error) {
    console.error("❌ Error seeding meal timing templates:", error);
    throw error;
  }
}

module.exports = { seedMealTimings };
