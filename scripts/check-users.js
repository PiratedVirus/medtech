const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...');

    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      select: { id: true, name: true, phoneNumber: true, role: true }
    });

    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: { id: true, name: true, phoneNumber: true, role: true }
    });

    const phlebotomists = await prisma.user.findMany({
      where: { role: 'PHLEBOTOMIST' },
      select: { id: true, name: true, phoneNumber: true, role: true }
    });

    const pathologyUsers = await prisma.user.findMany({
      where: { role: 'PATHOLOGY' },
      select: { id: true, name: true, phoneNumber: true, role: true }
    });

    console.log('\n📊 User Summary:');
    console.log(`- Patients: ${patients.length}`);
    console.log(`- Doctors: ${doctors.length}`);
    console.log(`- Phlebotomists: ${phlebotomists.length}`);
    console.log(`- Pathology: ${pathologyUsers.length}`);

    console.log('\n👥 Patients:');
    patients.forEach(p => console.log(`  - ${p.name} (${p.phoneNumber})`));

    console.log('\n👨‍⚕️ Doctors:');
    doctors.forEach(d => console.log(`  - ${d.name} (${d.phoneNumber})`));

    console.log('\n🩸 Phlebotomists:');
    phlebotomists.forEach(p => console.log(`  - ${p.name} (${p.phoneNumber})`));

    console.log('\n🏥 Pathology:');
    pathologyUsers.forEach(p => console.log(`  - ${p.name} (${p.phoneNumber})`));

  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers(); 