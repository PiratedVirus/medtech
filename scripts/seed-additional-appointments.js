const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedAdditionalAppointments() {
  try {
    console.log('🌱 Starting additional appointments seeding...');

    // Get existing data
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      take: 20,
    });

    const labPackages = await prisma.labPackage.findMany({
      where: { isLabPackage: true },
    });

    const phlebotomists = await prisma.phlebotomist.findMany({
      where: { isAvailable: true },
    });

    const pathologyLab = await prisma.pathologyLab.findFirst({
      where: { isActive: true },
    });

    const pathologyAdmin = await prisma.user.findFirst({
      where: { role: 'PATHOLOGY' },
    });

    if (!patients.length || !labPackages.length || !phlebotomists.length || !pathologyLab || !pathologyAdmin) {
      throw new Error('Required data not found. Please run the main seed file first.');
    }

    console.log(`Found ${patients.length} patients, ${labPackages.length} lab packages, ${phlebotomists.length} phlebotomists`);

    // 1. Create 10 upcoming appointments (PENDING status)
    console.log('Creating 10 upcoming appointments...');
    const upcomingStatuses = ['PENDING', 'ASSIGNED'];
    const paymentOptions = ['online', 'clinic', 'plan'];
    
    const today = new Date();
    let upcomingCreated = 0;

    for (let i = 0; i < 10; i++) {
      const patient = patients[i % patients.length];
      const packageIndex = i % labPackages.length;
      const labPackage = labPackages[packageIndex];
      const phlebotomist = phlebotomists[i % phlebotomists.length];
      const status = upcomingStatuses[i % upcomingStatuses.length];
      const paymentOption = paymentOptions[i % paymentOptions.length];
      
      // Create lab booking for upcoming appointment
      const labBooking = await prisma.labBooking.create({
        data: {
          patientId: patient.id,
          labPackageId: labPackage.id,
          appointmentFor: labPackage.name,
          fullName: patient.name,
          mobile: patient.phoneNumber,
          email: patient.email,
          address: `Upcoming Address ${i + 1}, Mumbai, Maharashtra`,
          paymentOption: paymentOption,
          status: 'Scheduled',
          pathologyStatus: status,
          labDate: new Date(today.getTime() + (i + 2) * 24 * 60 * 60 * 1000), // 2-11 days from now
          labResult: [],
        },
      });

      // Create lab assignment for upcoming appointment
      const labAssignment = await prisma.labAssignment.create({
        data: {
          patientId: patient.id,
          phlebotomistId: phlebotomist.id,
          labId: pathologyLab.id,
          labBookingId: labBooking.id,
          assignedDate: new Date(today.getTime() + (i + 2) * 24 * 60 * 60 * 1000),
          assignedTime: `${8 + (i % 10)}:00`, // 8 AM to 5 PM
          status: status,
          sampleCollected: false,
          sampleCollectedAt: null,
        },
      });

      upcomingCreated++;
      console.log(`✅ Created upcoming appointment ${i + 1}/10: ${patient.name} - ${labPackage.name} - ${status}`);
    }

    // 2. Create 5 more ongoing appointments (various active statuses)
    console.log('Creating 5 more ongoing appointments...');
    const ongoingStatuses = ['SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING'];
    
    let ongoingCreated = 0;

    for (let i = 0; i < 5; i++) {
      const patient = patients[(i + 10) % patients.length]; // Use different patients
      const packageIndex = (i + 2) % labPackages.length;
      const labPackage = labPackages[packageIndex];
      const phlebotomist = phlebotomists[(i + 1) % phlebotomists.length];
      const status = ongoingStatuses[i % ongoingStatuses.length];
      const paymentOption = paymentOptions[(i + 1) % paymentOptions.length];
      
      // Create lab booking for ongoing appointment
      const labBooking = await prisma.labBooking.create({
        data: {
          patientId: patient.id,
          labPackageId: labPackage.id,
          appointmentFor: labPackage.name,
          fullName: patient.name,
          mobile: patient.phoneNumber,
          email: patient.email,
          address: `Ongoing Address ${i + 1}, Mumbai, Maharashtra`,
          paymentOption: paymentOption,
          status: 'Scheduled',
          pathologyStatus: status,
          labDate: new Date(today.getTime() - (i + 1) * 24 * 60 * 60 * 1000), // 1-5 days ago
          labResult: [],
        },
      });

      // Create lab assignment for ongoing appointment
      const labAssignment = await prisma.labAssignment.create({
        data: {
          patientId: patient.id,
          phlebotomistId: phlebotomist.id,
          labId: pathologyLab.id,
          labBookingId: labBooking.id,
          assignedDate: new Date(today.getTime() - (i + 1) * 24 * 60 * 60 * 1000),
          assignedTime: `${9 + (i % 8)}:00`,
          status: status,
          sampleCollected: ['SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING'].includes(status),
          sampleCollectedAt: ['SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING'].includes(status) 
            ? new Date(today.getTime() - (i + 1) * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) 
            : null,
        },
      });

      ongoingCreated++;
      console.log(`✅ Created ongoing appointment ${i + 1}/5: ${patient.name} - ${labPackage.name} - ${status}`);
    }

    // 3. Create some completed appointments with test results
    console.log('Creating 3 completed appointments with test results...');
    const labTests = await prisma.labTest.findMany({
      take: 5,
    });

    let completedCreated = 0;

    for (let i = 0; i < 3; i++) {
      const patient = patients[(i + 15) % patients.length];
      const packageIndex = (i + 4) % labPackages.length;
      const labPackage = labPackages[packageIndex];
      const phlebotomist = phlebotomists[(i + 2) % phlebotomists.length];
      const paymentOption = paymentOptions[(i + 2) % paymentOptions.length];
      
      // Create lab booking for completed appointment
      const labBooking = await prisma.labBooking.create({
        data: {
          patientId: patient.id,
          labPackageId: labPackage.id,
          appointmentFor: labPackage.name,
          fullName: patient.name,
          mobile: patient.phoneNumber,
          email: patient.email,
          address: `Completed Address ${i + 1}, Mumbai, Maharashtra`,
          paymentOption: paymentOption,
          status: 'COMPLETED',
          pathologyStatus: 'COMPLETED',
          labDate: new Date(today.getTime() - (i + 7) * 24 * 60 * 60 * 1000), // 7-9 days ago
          labResult: [
            `https://example.com/reports/patient-${patient.id}-lab-${labPackage.id}-completed-report-1.pdf`,
            `https://example.com/reports/patient-${patient.id}-lab-${labPackage.id}-completed-report-2.pdf`,
            `https://example.com/reports/patient-${patient.id}-lab-${labPackage.id}-completed-report-3.pdf`
          ],
        },
      });

      // Create lab assignment for completed appointment
      const labAssignment = await prisma.labAssignment.create({
        data: {
          patientId: patient.id,
          phlebotomistId: phlebotomist.id,
          labId: pathologyLab.id,
          labBookingId: labBooking.id,
          assignedDate: new Date(today.getTime() - (i + 7) * 24 * 60 * 60 * 1000),
          assignedTime: `${10 + (i % 6)}:00`,
          status: 'COMPLETED',
          sampleCollected: true,
          sampleCollectedAt: new Date(today.getTime() - (i + 7) * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        },
      });

      // Create test results for completed appointments
      const testResults = [];
      for (let j = 0; j < Math.min(4, labTests.length); j++) {
        const test = labTests[j];
        const result = await prisma.testResult.create({
          data: {
            labAssignmentId: labAssignment.id,
            labTestId: test.id,
            result: (Math.random() * 100 + 50).toFixed(1),
            unit: test.unit,
            normalRange: test.normalRange[0],
            isAbnormal: Math.random() > 0.7, // 30% chance of abnormal
            remarks: Math.random() > 0.7 ? 'Requires follow-up' : null,
            reportedAt: new Date(today.getTime() - (i + 7) * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
            reportedBy: pathologyAdmin.id,
          },
        });
        testResults.push(result);
      }

      completedCreated++;
      console.log(`✅ Created completed appointment ${i + 1}/3: ${patient.name} - ${labPackage.name} with ${testResults.length} test results`);
    }

    console.log('🎉 Additional appointments seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Upcoming Appointments: ${upcomingCreated}`);
    console.log(`- Ongoing Appointments: ${ongoingCreated}`);
    console.log(`- Completed Appointments: ${completedCreated}`);
    console.log(`- Total New Appointments: ${upcomingCreated + ongoingCreated + completedCreated}`);

    // Update phlebotomist availability for assigned appointments
    console.log('Updating phlebotomist availability...');
    const assignedPhlebotomists = await prisma.labAssignment.findMany({
      where: {
        status: {
          in: ['ASSIGNED', 'SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING']
        }
      },
      select: {
        phlebotomistId: true
      },
      distinct: ['phlebotomistId']
    });

    for (const assignment of assignedPhlebotomists) {
      await prisma.phlebotomist.update({
        where: { id: assignment.phlebotomistId },
        data: { isAvailable: false },
      });
    }

    console.log(`✅ Updated ${assignedPhlebotomists.length} phlebotomists availability`);

  } catch (error) {
    console.error('❌ Error seeding additional appointments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedAdditionalAppointments()
  .then(() => {
    console.log('✅ Additional appointments seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Additional appointments seeding failed:', error);
    process.exit(1);
  }); 