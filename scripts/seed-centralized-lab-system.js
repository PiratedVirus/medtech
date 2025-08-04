const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCentralizedLabSystem() {
  try {
    console.log('🌱 Starting centralized lab booking system seeding...');

    // 1. Create Pathology Lab
    console.log('Creating pathology lab...');
    const pathologyLab = await prisma.pathologyLab.upsert({
      where: { licenseNumber: "PATH-2024-001" },
      update: {},
      create: {
        name: "CareDiabetics Pathology Lab",
        address: "123 Healthcare Street, Medical District, Mumbai, Maharashtra 400001",
        contactNumber: "+91-9876543210",
        email: "lab@carediabetics.com",
        licenseNumber: "PATH-2024-001",
        isActive: true,
      },
    });
    console.log('✅ Pathology lab created:', pathologyLab.name);

    // 2. Create Pathology Admin User
    console.log('Creating pathology admin user...');
    let pathologyAdmin = await prisma.user.findFirst({
      where: { 
        phoneNumber: "+91-9999999999",
        deletedAt: null
      }
    });

    if (!pathologyAdmin) {
      pathologyAdmin = await prisma.user.create({
        data: {
          phoneNumber: "+91-9999999999",
          email: "pathology@carediabetics.com",
          name: "Pathology Admin",
          role: "PATHOLOGY",
          status: "ACTIVE",
        },
      });
    }
    console.log('✅ Pathology admin created:', pathologyAdmin.name);

    // 3. Create Phlebotomist Users and Profiles
    console.log('Creating phlebotomist users and profiles...');
    const phlebotomistData = [
      {
        user: {
          phoneNumber: "+91-8888888888",
          email: "phlebo1@carediabetics.com",
          name: "Rajesh Kumar",
          role: "PHLEBOTOMIST",
          status: "ACTIVE",
        },
        profile: {
          employeeId: "PHLEB001",
          specialization: "Blood Collection",
          isAvailable: true,
          currentLocation: "Mumbai Central",
        }
      },
      {
        user: {
          phoneNumber: "+91-7777777777",
          email: "phlebo2@carediabetics.com",
          name: "Priya Sharma",
          role: "PHLEBOTOMIST",
          status: "ACTIVE",
        },
        profile: {
          employeeId: "PHLEB002",
          specialization: "Sample Collection",
          isAvailable: true,
          currentLocation: "Andheri West",
        }
      },
      {
        user: {
          phoneNumber: "+91-6666666666",
          email: "phlebo3@carediabetics.com",
          name: "Amit Patel",
          role: "PHLEBOTOMIST",
          status: "ACTIVE",
        },
        profile: {
          employeeId: "PHLEB003",
          specialization: "Home Collection",
          isAvailable: false,
          currentLocation: "Bandra East",
        }
      },
      {
        user: {
          phoneNumber: "+91-5555555555",
          email: "phlebo4@carediabetics.com",
          name: "Sneha Verma",
          role: "PHLEBOTOMIST",
          status: "ACTIVE",
        },
        profile: {
          employeeId: "PHLEB004",
          specialization: "Pediatric Collection",
          isAvailable: true,
          currentLocation: "Juhu",
        }
      }
    ];

    const phlebotomists = [];
    for (const data of phlebotomistData) {
      let user = await prisma.user.findFirst({
        where: { 
          phoneNumber: data.user.phoneNumber,
          deletedAt: null
        }
      });

      if (!user) {
        user = await prisma.user.create({
          data: data.user,
        });
      }

      let phlebotomist = await prisma.phlebotomist.findFirst({
        where: { employeeId: data.profile.employeeId }
      });

      if (!phlebotomist) {
        phlebotomist = await prisma.phlebotomist.create({
          data: {
            userId: user.id,
            ...data.profile,
          },
        });
      }
      phlebotomists.push(phlebotomist);
    }
    console.log('✅ Phlebotomists created:', phlebotomists.length);

    // 4. Create Lab Packages
    console.log('Creating lab packages...');
    const labPackages = [
      {
        name: 'Basic Diabetes Panel',
        shortDescription: 'Glucose + HbA1c',
        description: 'Essential tests for diabetes monitoring including fasting blood sugar and glycated hemoglobin',
        price: 800,
        isLabPackage: true,
        parameters: 'FBS, HbA1c',
      },
      {
        name: 'Complete Lipid Profile',
        shortDescription: 'Cholesterol + Triglycerides',
        description: 'Comprehensive lipid check including total cholesterol, HDL, LDL, and triglycerides',
        price: 1200,
        isLabPackage: true,
        parameters: 'Total Cholesterol, HDL, LDL, Triglycerides',
      },
      {
        name: 'Kidney & Liver Combo',
        shortDescription: 'KFT + LFT',
        description: 'Kidney and liver function assessment with comprehensive metabolic panel',
        price: 1500,
        isLabPackage: true,
        parameters: 'Creatinine, Urea, Bilirubin, ALT, AST, GGT',
      },
      {
        name: 'Complete Blood Count',
        shortDescription: 'CBC',
        description: 'Complete blood count with differential including hemoglobin, white blood cells, and platelets',
        price: 600,
        isLabPackage: true,
        parameters: 'Hemoglobin, WBC, RBC, Platelets, MCV, MCH',
      },
      {
        name: 'Thyroid Profile',
        shortDescription: 'TSH + T3 + T4',
        description: 'Complete thyroid function test including TSH, T3, and T4 levels',
        price: 1000,
        isLabPackage: true,
        parameters: 'TSH, T3, T4, Free T3, Free T4',
      },
      {
        name: 'Cardiac Markers',
        shortDescription: 'Troponin + CPK',
        description: 'Cardiac enzyme tests for heart health assessment',
        price: 1800,
        isLabPackage: true,
        parameters: 'Troponin I, CPK-MB, BNP, CRP',
      }
    ];

    const createdLabPackages = [];
    for (const pkg of labPackages) {
      const created = await prisma.labPackage.upsert({
        where: { name: pkg.name },
        update: {},
        create: pkg,
      });
      createdLabPackages.push(created);
    }
    console.log('✅ Lab packages created:', createdLabPackages.length);

    // 5. Create Lab Tests
    console.log('Creating lab tests...');
    const labTests = [
      {
        name: 'Fasting Blood Sugar',
        code: 'FBS',
        description: 'Measures glucose levels after fasting for 8-12 hours',
        parameters: ['Glucose'],
        normalRange: ['70-100 mg/dL'],
        unit: 'mg/dL',
      },
      {
        name: 'Glycated Hemoglobin',
        code: 'HbA1c',
        description: 'Measures average blood glucose over 2-3 months',
        parameters: ['HbA1c'],
        normalRange: ['4.0-5.6%'],
        unit: '%',
      },
      {
        name: 'Total Cholesterol',
        code: 'TCHOL',
        description: 'Measures total cholesterol levels',
        parameters: ['Total Cholesterol'],
        normalRange: ['<200 mg/dL'],
        unit: 'mg/dL',
      },
      {
        name: 'HDL Cholesterol',
        code: 'HDL',
        description: 'High-density lipoprotein cholesterol',
        parameters: ['HDL'],
        normalRange: ['>40 mg/dL'],
        unit: 'mg/dL',
      },
      {
        name: 'LDL Cholesterol',
        code: 'LDL',
        description: 'Low-density lipoprotein cholesterol',
        parameters: ['LDL'],
        normalRange: ['<100 mg/dL'],
        unit: 'mg/dL',
      },
      {
        name: 'Triglycerides',
        code: 'TRIG',
        description: 'Measures triglyceride levels',
        parameters: ['Triglycerides'],
        normalRange: ['<150 mg/dL'],
        unit: 'mg/dL',
      },
      {
        name: 'Creatinine',
        code: 'CREAT',
        description: 'Kidney function marker',
        parameters: ['Creatinine'],
        normalRange: ['0.7-1.3 mg/dL'],
        unit: 'mg/dL',
      },
      {
        name: 'Urea',
        code: 'UREA',
        description: 'Blood urea nitrogen',
        parameters: ['Urea'],
        normalRange: ['7-20 mg/dL'],
        unit: 'mg/dL',
      },
      {
        name: 'Alanine Aminotransferase',
        code: 'ALT',
        description: 'Liver function marker',
        parameters: ['ALT'],
        normalRange: ['7-55 U/L'],
        unit: 'U/L',
      },
      {
        name: 'Aspartate Aminotransferase',
        code: 'AST',
        description: 'Liver function marker',
        parameters: ['AST'],
        normalRange: ['8-48 U/L'],
        unit: 'U/L',
      }
    ];

    const createdLabTests = [];
    for (const test of labTests) {
      const created = await prisma.labTest.upsert({
        where: { code: test.code },
        update: {},
        create: {
          name: test.name,
          code: test.code,
          description: test.description,
          parameters: test.parameters,
          normalRange: test.normalRange,
          unit: test.unit,
          isActive: true,
        },
      });
      createdLabTests.push(created);
    }
    console.log('✅ Lab tests created:', createdLabTests.length);

    // 6. Get existing patients or create sample patients
    console.log('Getting or creating sample patients...');
    let patients = await prisma.user.findMany({
      where: { role: 'PATIENT' },
      take: 10,
    });

    if (patients.length < 5) {
      // Create sample patients if not enough exist
      const samplePatients = [
        {
          phoneNumber: "+91-1111111111",
          email: "patient1@example.com",
          name: "Rahul Sharma",
          role: "PATIENT",
          status: "ACTIVE",
        },
        {
          phoneNumber: "+91-2222222222",
          email: "patient2@example.com",
          name: "Priya Patel",
          role: "PATIENT",
          status: "ACTIVE",
        },
        {
          phoneNumber: "+91-3333333333",
          email: "patient3@example.com",
          name: "Amit Kumar",
          role: "PATIENT",
          status: "ACTIVE",
        },
        {
          phoneNumber: "+91-4444444444",
          email: "patient4@example.com",
          name: "Neha Singh",
          role: "PATIENT",
          status: "ACTIVE",
        },
        {
          phoneNumber: "+91-5555555555",
          email: "patient5@example.com",
          name: "Vikram Malhotra",
          role: "PATIENT",
          status: "ACTIVE",
        }
      ];

      for (const patientData of samplePatients) {
        let patient = await prisma.user.findFirst({
          where: { 
            phoneNumber: patientData.phoneNumber,
            deletedAt: null
          }
        });

        if (!patient) {
          patient = await prisma.user.create({
            data: patientData,
          });
        }
        patients.push(patient);
      }
    }
    console.log('✅ Patients available:', patients.length);

    // 7. Create Lab Bookings with Lab Assignments
    console.log('Creating lab bookings with assignments...');
    const statuses = ['PENDING', 'ASSIGNED', 'SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING', 'COMPLETED'];
    const paymentOptions = ['online', 'clinic', 'plan'];
    
    const today = new Date();
    let createdBookings = 0;
    let createdAssignments = 0;

    for (let i = 0; i < Math.min(patients.length, 15); i++) {
      const patient = patients[i % patients.length];
      const packageIndex = i % createdLabPackages.length;
      const labPackage = createdLabPackages[packageIndex];
      const phlebotomist = phlebotomists[i % phlebotomists.length];
      const status = statuses[i % statuses.length];
      const paymentOption = paymentOptions[i % paymentOptions.length];
      
      // Create lab booking
      const labBooking = await prisma.labBooking.create({
        data: {
          patientId: patient.id,
          labPackageId: labPackage.id,
          appointmentFor: labPackage.name,
          fullName: patient.name,
          mobile: patient.phoneNumber,
          email: patient.email,
          address: `Address ${i + 1}, Mumbai, Maharashtra`,
          paymentOption: paymentOption,
          status: status === 'COMPLETED' ? 'COMPLETED' : 'Scheduled',
          pathologyStatus: status,
          labDate: new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
          labResult: status === 'COMPLETED' ? [
            `https://example.com/reports/patient-${patient.id}-lab-${labPackage.id}-report-1.pdf`,
            `https://example.com/reports/patient-${patient.id}-lab-${labPackage.id}-report-2.pdf`
          ] : [],
        },
      });
      createdBookings++;

      // Create lab assignment
      const labAssignment = await prisma.labAssignment.create({
        data: {
          patientId: patient.id,
          phlebotomistId: phlebotomist.id,
          labId: pathologyLab.id,
          labBookingId: labBooking.id,
          assignedDate: new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
          assignedTime: `${9 + (i % 8)}:00`,
          status: status,
          sampleCollected: ['SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING', 'COMPLETED'].includes(status),
          sampleCollectedAt: ['SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING', 'COMPLETED'].includes(status) 
            ? new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000) 
            : null,
        },
      });
      createdAssignments++;

      // Create test results for completed bookings
      if (status === 'COMPLETED') {
        const testResults = [];
        for (let j = 0; j < Math.min(3, createdLabTests.length); j++) {
          const test = createdLabTests[j];
          const result = await prisma.testResult.create({
            data: {
              labAssignmentId: labAssignment.id,
              labTestId: test.id,
              result: (Math.random() * 100 + 50).toFixed(1),
              unit: test.unit,
              normalRange: test.normalRange[0],
              isAbnormal: Math.random() > 0.8, // 20% chance of abnormal
              remarks: Math.random() > 0.8 ? 'Requires follow-up' : null,
              reportedAt: new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
              reportedBy: pathologyAdmin.id,
            },
          });
          testResults.push(result);
        }
        console.log(`✅ Created ${testResults.length} test results for booking ${labBooking.id}`);
      }
    }

    console.log('✅ Lab bookings created:', createdBookings);
    console.log('✅ Lab assignments created:', createdAssignments);

    // 8. Create some individual lab tests (non-packages)
    console.log('Creating individual lab tests...');
    const individualTests = [
      {
        name: 'Blood Glucose Random',
        shortDescription: 'Random Blood Sugar',
        description: 'Random blood glucose test',
        price: 200,
        isLabPackage: false,
        parameters: 'Glucose',
      },
      {
        name: 'Hemoglobin Test',
        shortDescription: 'Hb Test',
        description: 'Hemoglobin level measurement',
        price: 150,
        isLabPackage: false,
        parameters: 'Hemoglobin',
      },
      {
        name: 'Vitamin D Test',
        shortDescription: '25-OH Vitamin D',
        description: 'Vitamin D deficiency screening',
        price: 800,
        isLabPackage: false,
        parameters: '25-OH Vitamin D',
      },
      {
        name: 'PSA Test',
        shortDescription: 'Prostate Specific Antigen',
        description: 'Prostate health screening',
        price: 600,
        isLabPackage: false,
        parameters: 'PSA',
      }
    ];

    for (const test of individualTests) {
      await prisma.labPackage.upsert({
        where: { name: test.name },
        update: {},
        create: test,
      });
    }
    console.log('✅ Individual lab tests created:', individualTests.length);

    console.log('🎉 Centralized lab booking system seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Pathology Lab: 1`);
    console.log(`- Pathology Admin: 1`);
    console.log(`- Phlebotomists: ${phlebotomists.length}`);
    console.log(`- Lab Packages: ${createdLabPackages.length}`);
    console.log(`- Individual Tests: ${individualTests.length}`);
    console.log(`- Lab Tests: ${createdLabTests.length}`);
    console.log(`- Patients: ${patients.length}`);
    console.log(`- Lab Bookings: ${createdBookings}`);
    console.log(`- Lab Assignments: ${createdAssignments}`);

  } catch (error) {
    console.error('❌ Error seeding centralized lab system:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedCentralizedLabSystem()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }); 