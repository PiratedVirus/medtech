const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedUnassignedAppointments() {
  try {
    console.log('🌱 Starting pending appointments seeding...');

    // Get existing data
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      take: 10,
    });

    const phlebotomists = await prisma.phlebotomist.findMany({
      where: { isAvailable: true },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    const pathologyLab = await prisma.pathologyLab.findFirst({
      where: { isActive: true },
    });

    if (!patients.length || !phlebotomists.length || !pathologyLab) {
      throw new Error('Required data not found.');
    }

    console.log(`Found ${patients.length} patients, ${phlebotomists.length} phlebotomists, 1 pathology lab`);

    // Create pending lab assignments (PENDING status - phlebotomist assigned but not started)
    console.log('Creating pending lab assignments...');
    const appointmentTypes = ['Lab Test', 'Blood Test', 'Diabetes Screening', 'Health Checkup', 'Preventive Care'];
    
    const today = new Date();
    let createdCount = 0;

    for (let i = 0; i < 8; i++) {
      const patient = patients[i % patients.length];
      const phlebotomist = phlebotomists[i % phlebotomists.length];
      const appointmentType = appointmentTypes[i % appointmentTypes.length];
      
      // Create lab assignment with phlebotomist but PENDING status (not started yet)
      const labAssignment = await prisma.labAssignment.create({
        data: {
          patientId: patient.id,
          phlebotomistId: phlebotomist.id, // Phlebotomist is assigned
          labId: pathologyLab.id,
          appointmentId: null, // No appointment linked
          labBookingId: null, // No lab booking linked
          assignedDate: new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000), // 1-8 days from now
          assignedTime: `${9 + (i % 8)}:00`,
          status: "PENDING", // PENDING = phlebotomist assigned but not started
          sampleCollected: false,
          sampleCollectedAt: null,
        },
      });

      createdCount++;
      console.log(`✅ Created pending appointment ${i + 1}/8: ${patient.name} - ${appointmentType} - PENDING (Phlebotomist: ${phlebotomist.user.name})`);
    }

    console.log('🎉 Pending appointments seeding completed successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`- Pending Appointments Created: ${createdCount}`);

  } catch (error) {
    console.error('❌ Error seeding pending appointments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedUnassignedAppointments()
  .then(() => {
    console.log('✅ Pending appointments seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Pending appointments seeding failed:', error);
    process.exit(1);
  }); 