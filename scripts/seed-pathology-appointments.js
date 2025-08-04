const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPathologyAppointments() {
  try {
    console.log('🌱 Starting pathology appointments seeding...');

    // Get existing data
    const patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      take: 10,
    });

    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      take: 5,
    });

    const phlebotomists = await prisma.phlebotomist.findMany({
      where: { isAvailable: true },
    });

    const pathologyLab = await prisma.pathologyLab.findFirst({
      where: { isActive: true },
    });

    if (!patients.length || !doctors.length || !phlebotomists.length || !pathologyLab) {
      throw new Error('Required data not found. Please run the main seed file first.');
    }

    console.log(`Found ${patients.length} patients, ${doctors.length} doctors, ${phlebotomists.length} phlebotomists`);

    // Create doctor availability slots
    console.log('Creating doctor availability slots...');
    const today = new Date();
    const doctorAvailabilities = [];

    for (let i = 0; i < 15; i++) {
      const doctor = doctors[i % doctors.length];
      const date = new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000); // 1-15 days from now
      
      const availability = await prisma.doctorAvailability.create({
        data: {
          userId: doctor.id,
          date: date,
          startTime: "09:00",
          endTime: "17:00",
          status: "AVAILABLE",
        },
      });
      doctorAvailabilities.push(availability);
    }

    console.log(`✅ Created ${doctorAvailabilities.length} doctor availability slots`);

    // 1. Create 10 upcoming appointments (CONFIRMED status)
    console.log('Creating 10 upcoming appointments...');
    const appointmentTypes = ['Lab Test', 'Blood Test', 'Diabetes Screening', 'Health Checkup', 'Preventive Care'];
    
    let upcomingCreated = 0;

    for (let i = 0; i < 10; i++) {
      const patient = patients[i % patients.length];
      const doctor = doctors[i % doctors.length];
      const availability = doctorAvailabilities[i];
      const appointmentType = appointmentTypes[i % appointmentTypes.length];
      
      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          userId: doctor.id,
          patientId: patient.id,
          appointmentFor: appointmentType,
          appointmentDate: availability.date,
          consultationType: "video",
          status: "CONFIRMED",
          isDietician: false,
        },
      });

      // Create lab assignment for some appointments (mix of assigned and unassigned)
      if (i < 5) { // First 5 appointments will have phlebotomist assigned
        const phlebotomist = phlebotomists[i % phlebotomists.length];
        
        await prisma.labAssignment.create({
          data: {
            patientId: patient.id,
            phlebotomistId: phlebotomist.id,
            labId: pathologyLab.id,
            appointmentId: appointment.id,
            assignedDate: availability.date,
            assignedTime: `${9 + (i % 8)}:00`,
            status: "ASSIGNED",
            sampleCollected: false,
            sampleCollectedAt: null,
          },
        });
      }

      upcomingCreated++;
      console.log(`✅ Created upcoming appointment ${i + 1}/10: ${patient.name} - ${appointmentType} - ${i < 5 ? 'ASSIGNED' : 'UNASSIGNED'}`);
    }

    // 2. Create 5 ongoing appointments (various active statuses)
    console.log('Creating 5 ongoing appointments...');
    const ongoingStatuses = ['SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING'];
    
    let ongoingCreated = 0;

    for (let i = 0; i < 5; i++) {
      const patient = patients[(i + 10) % patients.length];
      const doctor = doctors[(i + 1) % doctors.length];
      const availability = doctorAvailabilities[i + 10];
      const appointmentType = appointmentTypes[(i + 2) % appointmentTypes.length];
      const status = ongoingStatuses[i % ongoingStatuses.length];
      const phlebotomist = phlebotomists[(i + 1) % phlebotomists.length];
      
      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          userId: doctor.id,
          patientId: patient.id,
          appointmentFor: appointmentType,
          appointmentDate: availability.date,
          consultationType: "video",
          status: "CONFIRMED",
          isDietician: false,
        },
      });

      // Create lab assignment for ongoing appointments
      await prisma.labAssignment.create({
        data: {
          patientId: patient.id,
          phlebotomistId: phlebotomist.id,
          labId: pathologyLab.id,
          appointmentId: appointment.id,
          assignedDate: availability.date,
          assignedTime: `${10 + (i % 6)}:00`,
          status: status,
          sampleCollected: ['SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING'].includes(status),
          sampleCollectedAt: ['SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING'].includes(status) 
            ? new Date(availability.date.getTime() + 2 * 60 * 60 * 1000) 
            : null,
        },
      });

      ongoingCreated++;
      console.log(`✅ Created ongoing appointment ${i + 1}/5: ${patient.name} - ${appointmentType} - ${status}`);
    }

    // 3. Create some completed appointments
    console.log('Creating 3 completed appointments...');
    
    let completedCreated = 0;

    for (let i = 0; i < 3; i++) {
      const patient = patients[(i + 15) % patients.length];
      const doctor = doctors[(i + 2) % doctors.length];
      const appointmentType = appointmentTypes[(i + 3) % appointmentTypes.length];
      const phlebotomist = phlebotomists[(i + 2) % phlebotomists.length];
      
      // Create appointment (past date)
      const appointment = await prisma.appointment.create({
        data: {
          userId: doctor.id,
          patientId: patient.id,
          appointmentFor: appointmentType,
          appointmentDate: new Date(today.getTime() - (i + 7) * 24 * 60 * 60 * 1000), // 7-9 days ago
          consultationType: "video",
          status: "COMPLETED",
          isDietician: false,
        },
      });

      // Create lab assignment for completed appointments
      await prisma.labAssignment.create({
        data: {
          patientId: patient.id,
          phlebotomistId: phlebotomist.id,
          labId: pathologyLab.id,
          appointmentId: appointment.id,
          assignedDate: new Date(today.getTime() - (i + 7) * 24 * 60 * 60 * 1000),
          assignedTime: `${11 + (i % 5)}:00`,
          status: "COMPLETED",
          sampleCollected: true,
          sampleCollectedAt: new Date(today.getTime() - (i + 7) * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000),
        },
      });

      completedCreated++;
      console.log(`✅ Created completed appointment ${i + 1}/3: ${patient.name} - ${appointmentType} - COMPLETED`);
    }

    console.log('🎉 Pathology appointments seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Doctor Availability Slots: ${doctorAvailabilities.length}`);
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
    console.error('❌ Error seeding pathology appointments:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedPathologyAppointments()
  .then(() => {
    console.log('✅ Pathology appointments seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Pathology appointments seeding failed:', error);
    process.exit(1);
  }); 