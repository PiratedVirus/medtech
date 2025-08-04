const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPhlebotomists() {
  try {
    console.log('🔍 Checking phlebotomists...');

    const phlebotomists = await prisma.phlebotomist.findMany({
      include: {
        user: {
          select: { name: true, phoneNumber: true }
        }
      }
    });

    console.log('\n📊 Phlebotomist Summary:');
    console.log(`- Total Phlebotomists: ${phlebotomists.length}`);

    console.log('\n🩸 Phlebotomist Details:');
    phlebotomists.forEach(p => {
      console.log(`  - ${p.user.name} (${p.user.phoneNumber})`);
      console.log(`    Employee ID: ${p.employeeId}`);
      console.log(`    Available: ${p.isAvailable}`);
      console.log(`    Location: ${p.currentLocation}`);
      console.log(`    Specialization: ${p.specialization}`);
      console.log('');
    });

    const availablePhlebotomists = phlebotomists.filter(p => p.isAvailable);
    console.log(`\n✅ Available Phlebotomists: ${availablePhlebotomists.length}`);
    availablePhlebotomists.forEach(p => {
      console.log(`  - ${p.user.name} (${p.user.phoneNumber})`);
    });

  } catch (error) {
    console.error('❌ Error checking phlebotomists:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPhlebotomists(); 