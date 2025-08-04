const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetPhlebotomistAvailability() {
  try {
    console.log('🔄 Resetting phlebotomist availability...');

    // Make all phlebotomists available
    const result = await prisma.phlebotomist.updateMany({
      data: {
        isAvailable: true,
      },
    });

    console.log(`✅ Updated ${result.count} phlebotomists to available`);

    // Verify the update
    const phlebotomists = await prisma.phlebotomist.findMany({
      include: {
        user: {
          select: { name: true, phoneNumber: true }
        }
      }
    });

    console.log('\n📊 Updated Phlebotomist Status:');
    phlebotomists.forEach(p => {
      console.log(`  - ${p.user.name} (${p.user.phoneNumber}): ${p.isAvailable ? '✅ Available' : '❌ Unavailable'}`);
    });

    const availableCount = phlebotomists.filter(p => p.isAvailable).length;
    console.log(`\n✅ Total Available Phlebotomists: ${availableCount}`);

  } catch (error) {
    console.error('❌ Error resetting phlebotomist availability:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPhlebotomistAvailability(); 