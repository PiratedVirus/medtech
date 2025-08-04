const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUnassignedDemo() {
  try {
    console.log('🌱 Creating demo assignments without phlebotomists...');

    // Get existing data
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      take: 5,
    });

    const labPackages = await prisma.labPackage.findMany({
      take: 3,
    });

    if (!patients.length || !labPackages.length) {
      throw new Error('Required data not found.');
    }

    console.log(`Found ${patients.length} patients, ${labPackages.length} lab packages`);

    // Create lab bookings WITHOUT automatically creating lab assignments
    // This will create bookings that need manual phlebotomist assignment
    console.log('Creating lab bookings without automatic lab assignments...');
    
    const today = new Date();
    let createdCount = 0;

    for (let i = 0; i < 5; i++) {
      const patient = patients[i % patients.length];
      const labPackage = labPackages[i % labPackages.length];
      
      // Create lab booking only (no lab assignment)
      const labBooking = await prisma.labBooking.create({
        data: {
          patientId: patient.id,
          labPackageId: labPackage.id,
          appointmentFor: labPackage.name,
          fullName: patient.name,
          mobile: patient.phoneNumber,
          email: `${patient.name.toLowerCase().replace(' ', '.')}@example.com`,
          address: `Address ${i + 1}, City`,
          paymentOption: "Online",
          labDate: new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000), // 1-5 days from now
          status: "Scheduled",
          pathologyStatus: "PENDING",
          // Note: labAssignmentId is null - no assignment created
        },
      });

      createdCount++;
      console.log(`✅ Created lab booking ${i + 1}/5: ${patient.name} - ${labPackage.name} - NO LAB ASSIGNMENT`);
    }

    console.log('\n🎉 Demo lab bookings created successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`- Lab Bookings Created: ${createdCount}`);
    console.log(`- These bookings have NO lab assignments`);
    console.log(`- They will show "Assign Phlebotomist" button in pathology panel`);

    console.log('\n🔧 To see "Assign Phlebotomist" button:');
    console.log('1. These lab bookings exist but have no LabAssignment records');
    console.log('2. The upcoming-appointments API will not show them (it queries LabAssignment)');
    console.log('3. You need to modify the API to also show LabBookings without assignments');

  } catch (error) {
    console.error('❌ Error creating demo:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createUnassignedDemo()
  .then(() => {
    console.log('✅ Demo creation completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Demo creation failed:', error);
    process.exit(1);
  }); 