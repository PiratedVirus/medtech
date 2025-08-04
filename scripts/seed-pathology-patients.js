const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPathologyPatients() {
  try {
    console.log('🌱 Starting pathology patients seeding...');

    // Find existing patients
    console.log('Finding existing patients...');
    const existingPatients = await prisma.user.findMany({
      where: {
        role: "PATIENT",
        deletedAt: null,
      },
      include: {
        patientProfile: true,
      },
      take: 3,
    });

    if (existingPatients.length === 0) {
      console.log('❌ No existing patients found. Please create patients first.');
      return;
    }

    console.log(`✅ Found ${existingPatients.length} existing patients`);

    // Create a basic plan for subscriptions
    console.log('Creating basic plan...');
    const basicPlan = await prisma.plan.create({
      data: {
        name: "Basic Health Plan",
        duration: "30 days",
        price: 999.00,
        planFeatures: {
          create: [
            {
              featureName: "Doctor Consultation",
              occurrencesPerInterval: 2,
              intervalInMonths: 1,
              notes: "2 consultations per month",
            },
            {
              featureName: "Lab Tests",
              occurrencesPerInterval: 1,
              intervalInMonths: 1,
              notes: "1 lab test per month",
            },
          ],
        },
      },
    });
    console.log('✅ Basic plan created:', basicPlan.name);

    // Create profiles for patients that don't have them
    console.log('Creating profiles for patients without profiles...');
    for (const patient of existingPatients) {
      if (!patient.patientProfile) {
        await prisma.patientProfile.create({
          data: {
            userId: patient.id,
            age: 30 + Math.floor(Math.random() * 40), // Random age between 30-70
            weight: 60 + Math.floor(Math.random() * 30), // Random weight between 60-90 kg
            height: 160 + Math.floor(Math.random() * 20), // Random height between 160-180 cm
            gender: Math.random() > 0.5 ? "Male" : "Female",
            bloodGroup: ["A+", "B+", "O+", "AB+"][Math.floor(Math.random() * 4)],
            allergies: "None",
            medicalHistory: "No significant medical history",
            emergencyContact: "+91-9999999999",
            dateOfBirth: new Date(1980 + Math.floor(Math.random() * 30), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)),
            address: "Sample Address, Mumbai, Maharashtra",
          },
        });
        console.log(`✅ Created profile for patient ${patient.id} (${patient.name})`);
      }
    }

    // Refresh patient data to include newly created profiles
    const patientsWithProfiles = await prisma.user.findMany({
      where: {
        id: { in: existingPatients.map(p => p.id) },
        role: "PATIENT",
        deletedAt: null,
      },
      include: {
        patientProfile: true,
      },
    });

    // Create subscription trackers for existing patients
    console.log('Creating subscription trackers...');
    const subscriptions = await Promise.all(
      patientsWithProfiles.map(async (patient) => {
        if (!patient.patientProfile) {
          console.log(`⚠️ Patient ${patient.id} (${patient.name}) has no profile, skipping subscription`);
          return null;
        }
        
        return prisma.subscriptionTracker.create({
          data: {
            patientId: patient.patientProfile.id,
            planId: basicPlan.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            isActive: true,
            razorpayOrderId: `order_basic_${patient.id}`,
            paymentStatus: "COMPLETED",
          },
        });
      })
    );
    console.log('✅ Subscriptions created:', subscriptions.filter(Boolean).length);

    // Create lab packages
    console.log('Creating lab packages...');
    const labPackages = await Promise.all([
      prisma.labPackage.create({
        data: {
          name: "Diabetes Screening Package",
          description: "Complete diabetes screening with HbA1c and glucose tests",
          price: 1200,
        },
      }),
      prisma.labPackage.create({
        data: {
          name: "Complete Health Checkup",
          description: "Comprehensive health checkup including CBC, lipid profile, and kidney function",
          price: 2500,
        },
      }),
    ]);
    console.log('✅ Lab packages created:', labPackages.length);

    // Create lab bookings for existing patients
    console.log('Creating lab bookings...');
    const labBookings = await Promise.all(
      patientsWithProfiles.map(async (patient, index) => {
        const packageIndex = index % labPackages.length;
        const labPackage = labPackages[packageIndex];
        
        return prisma.labBooking.create({
          data: {
            patientId: patient.id,
            labPackageId: labPackage.id,
            appointmentFor: labPackage.name,
            fullName: patient.name,
            mobile: patient.phoneNumber,
            email: patient.email,
            address: patient.patientProfile?.address || "Address not provided",
            paymentOption: "ONLINE",
            labDate: new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000), // Different dates for each patient
            status: "Scheduled",
            pathologyStatus: "PENDING",
          },
        });
      })
    );
    console.log('✅ Lab bookings created:', labBookings.length);

    console.log('🎉 Pathology patients seeding completed successfully!');
    console.log('📋 Summary:');
    console.log(`   - Patients used: ${existingPatients.length}`);
    console.log(`   - Subscriptions created: ${subscriptions.filter(Boolean).length}`);
    console.log(`   - Lab packages created: ${labPackages.length}`);
    console.log(`   - Lab bookings created: ${labBookings.length}`);
    console.log('');
    console.log('🔍 Patient IDs for testing:');
    existingPatients.forEach((patient, index) => {
      console.log(`   Patient ${index + 1}: ${patient.id} (${patient.name})`);
    });

  } catch (error) {
    console.error('❌ Error seeding pathology patients:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedPathologyPatients()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }); 