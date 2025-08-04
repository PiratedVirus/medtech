const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedPathologyData() {
  try {
    console.log('🌱 Starting pathology data seeding...');

    // Create Pathology Lab
    console.log('Creating pathology lab...');
    const pathologyLab = await prisma.pathologyLab.create({
      data: {
        name: "CareDiabetics Pathology Lab",
        address: "123 Healthcare Street, Medical District, Mumbai, Maharashtra 400001",
        contactNumber: "+91-9876543210",
        email: "lab@carediabetics.com",
        licenseNumber: "PATH-2024-001",
        isActive: true,
      },
    });
    console.log('✅ Pathology lab created:', pathologyLab.name);

    // Create Pathology Admin User
    console.log('Creating pathology admin user...');
    const pathologyAdmin = await prisma.user.create({
      data: {
        phoneNumber: "+91-9999999999",
        email: "pathology@carediabetics.com",
        name: "Pathology Admin",
        role: "PATHOLOGY",
        status: "ACTIVE",
      },
    });
    console.log('✅ Pathology admin created:', pathologyAdmin.name);

    // Create Phlebotomist Users
    console.log('Creating phlebotomist users...');
    const phlebotomistUsers = await Promise.all([
      prisma.user.create({
        data: {
          phoneNumber: "+91-8888888888",
          email: "phlebo1@carediabetics.com",
          name: "Rajesh Kumar",
          role: "PHLEBOTOMIST",
          status: "ACTIVE",
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+91-7777777777",
          email: "phlebo2@carediabetics.com",
          name: "Priya Sharma",
          role: "PHLEBOTOMIST",
          status: "ACTIVE",
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+91-6666666666",
          email: "phlebo3@carediabetics.com",
          name: "Amit Patel",
          role: "PHLEBOTOMIST",
          status: "ACTIVE",
        },
      }),
    ]);

    // Create Phlebotomist Profiles
    console.log('Creating phlebotomist profiles...');
    const phlebotomists = await Promise.all([
      prisma.phlebotomist.create({
        data: {
          userId: phlebotomistUsers[0].id,
          employeeId: "PHLEB001",
          specialization: "Blood Collection",
          isAvailable: true,
          currentLocation: "Mumbai Central",
        },
      }),
      prisma.phlebotomist.create({
        data: {
          userId: phlebotomistUsers[1].id,
          employeeId: "PHLEB002",
          specialization: "Sample Collection",
          isAvailable: true,
          currentLocation: "Andheri West",
        },
      }),
      prisma.phlebotomist.create({
        data: {
          userId: phlebotomistUsers[2].id,
          employeeId: "PHLEB003",
          specialization: "Home Collection",
          isAvailable: false,
          currentLocation: "Bandra East",
        },
      }),
    ]);
    console.log('✅ Phlebotomists created:', phlebotomists.length);

    // Create Lab Tests
    console.log('Creating lab tests...');
    const labTests = await Promise.all([
      prisma.labTest.create({
        data: {
          name: "Complete Blood Count (CBC)",
          code: "CBC001",
          description: "Complete blood count with differential",
          parameters: ["WBC", "RBC", "Hemoglobin", "Platelets", "MCV", "MCH", "MCHC"],
          normalRange: {
            "WBC": "4,000-11,000 /μL",
            "RBC": "4.5-5.5 M/μL",
            "Hemoglobin": "12-16 g/dL",
            "Platelets": "150,000-450,000 /μL",
            "MCV": "80-100 fL",
            "MCH": "27-32 pg",
            "MCHC": "32-36 g/dL"
          },
          unit: "Various",
          isActive: true,
        },
      }),
      prisma.labTest.create({
        data: {
          name: "Blood Glucose (Fasting)",
          code: "GLU001",
          description: "Fasting blood glucose test",
          parameters: ["Glucose"],
          normalRange: {
            "Glucose": "70-100 mg/dL"
          },
          unit: "mg/dL",
          isActive: true,
        },
      }),
      prisma.labTest.create({
        data: {
          name: "HbA1c (Glycated Hemoglobin)",
          code: "HBA1C001",
          description: "Average blood glucose over 2-3 months",
          parameters: ["HbA1c"],
          normalRange: {
            "HbA1c": "< 5.7%"
          },
          unit: "%",
          isActive: true,
        },
      }),
      prisma.labTest.create({
        data: {
          name: "Lipid Profile",
          code: "LIPID001",
          description: "Complete lipid profile",
          parameters: ["Total Cholesterol", "HDL", "LDL", "Triglycerides"],
          normalRange: {
            "Total Cholesterol": "< 200 mg/dL",
            "HDL": "> 40 mg/dL",
            "LDL": "< 100 mg/dL",
            "Triglycerides": "< 150 mg/dL"
          },
          unit: "mg/dL",
          isActive: true,
        },
      }),
      prisma.labTest.create({
        data: {
          name: "Kidney Function Test",
          code: "KFT001",
          description: "Kidney function panel",
          parameters: ["Creatinine", "BUN", "eGFR"],
          normalRange: {
            "Creatinine": "0.6-1.2 mg/dL",
            "BUN": "7-20 mg/dL",
            "eGFR": "> 90 mL/min/1.73m²"
          },
          unit: "Various",
          isActive: true,
        },
      }),
    ]);
    console.log('✅ Lab tests created:', labTests.length);

    // Create Sample Patients
    console.log('Creating sample patients...');
    const patients = await Promise.all([
      prisma.user.create({
        data: {
          phoneNumber: "+91-1111111111",
          email: "patient1@example.com",
          name: "Ramesh Singh",
          role: "PATIENT",
          status: "ACTIVE",
          patientProfile: {
            create: {
              age: 45,
              weight: 75.5,
              height: 170,
              gender: "Male",
              bloodGroup: "B+",
              allergies: "None",
              medicalHistory: "Type 2 Diabetes",
              emergencyContact: "+91-2222222222",
              dateOfBirth: new Date("1979-05-15"),
              address: "Flat 101, Building A, Andheri West, Mumbai",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+91-2222222222",
          email: "patient2@example.com",
          name: "Sunita Verma",
          role: "PATIENT",
          status: "ACTIVE",
          patientProfile: {
            create: {
              age: 52,
              weight: 68.2,
              height: 165,
              gender: "Female",
              bloodGroup: "O+",
              allergies: "Penicillin",
              medicalHistory: "Hypertension",
              emergencyContact: "+91-3333333333",
              dateOfBirth: new Date("1972-08-22"),
              address: "Flat 205, Building B, Bandra East, Mumbai",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+91-3333333333",
          email: "patient3@example.com",
          name: "Vikram Mehta",
          role: "PATIENT",
          status: "ACTIVE",
          patientProfile: {
            create: {
              age: 38,
              weight: 82.1,
              height: 175,
              gender: "Male",
              bloodGroup: "A+",
              allergies: "None",
              medicalHistory: "Pre-diabetes",
              emergencyContact: "+91-4444444444",
              dateOfBirth: new Date("1986-03-10"),
              address: "Flat 301, Building C, Mumbai Central, Mumbai",
            },
          },
        },
      }),
    ]);
    console.log('✅ Patients created:', patients.length);

    // Create Sample Appointments
    console.log('Creating sample appointments...');
    const appointments = await Promise.all([
      prisma.appointment.create({
        data: {
          patientId: patients[0].id,
          doctorId: 1, // Assuming there's a doctor with ID 1
          appointmentFor: "Blood Test - CBC and Glucose",
          appointmentDate: new Date("2024-12-20"),
          consultationType: "LAB_TEST",
          status: "CONFIRMED",
          doctorAvailability: {
            create: {
              date: new Date("2024-12-20"),
              startTime: "09:00",
              endTime: "10:00",
              isAvailable: true,
            },
          },
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[1].id,
          doctorId: 1,
          appointmentFor: "Lipid Profile and HbA1c",
          appointmentDate: new Date("2024-12-21"),
          consultationType: "LAB_TEST",
          status: "CONFIRMED",
          doctorAvailability: {
            create: {
              date: new Date("2024-12-21"),
              startTime: "10:00",
              endTime: "11:00",
              isAvailable: true,
            },
          },
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[2].id,
          doctorId: 1,
          appointmentFor: "Kidney Function Test",
          appointmentDate: new Date("2024-12-22"),
          consultationType: "LAB_TEST",
          status: "CONFIRMED",
          doctorAvailability: {
            create: {
              date: new Date("2024-12-22"),
              startTime: "11:00",
              endTime: "12:00",
              isAvailable: true,
            },
          },
        },
      }),
    ]);
    console.log('✅ Appointments created:', appointments.length);

    // Create Lab Assignments
    console.log('Creating lab assignments...');
    const labAssignments = await Promise.all([
      prisma.labAssignment.create({
        data: {
          patientId: patients[0].id,
          phlebotomistId: phlebotomists[0].id,
          labId: pathologyLab.id,
          appointmentId: appointments[0].id,
          assignedDate: new Date("2024-12-20"),
          assignedTime: "09:00",
          status: "ASSIGNED",
          sampleCollected: false,
        },
      }),
      prisma.labAssignment.create({
        data: {
          patientId: patients[1].id,
          phlebotomistId: phlebotomists[1].id,
          labId: pathologyLab.id,
          appointmentId: appointments[1].id,
          assignedDate: new Date("2024-12-21"),
          assignedTime: "10:00",
          status: "SAMPLE_COLLECTED",
          sampleCollected: true,
          sampleCollectedAt: new Date("2024-12-21T10:30:00Z"),
        },
      }),
      prisma.labAssignment.create({
        data: {
          patientId: patients[2].id,
          phlebotomistId: phlebotomists[2].id,
          labId: pathologyLab.id,
          appointmentId: appointments[2].id,
          assignedDate: new Date("2024-12-22"),
          assignedTime: "11:00",
          status: "IN_LAB",
          sampleCollected: true,
          sampleCollectedAt: new Date("2024-12-22T11:15:00Z"),
        },
      }),
    ]);
    console.log('✅ Lab assignments created:', labAssignments.length);

    // Create Test Results
    console.log('Creating test results...');
    const testResults = await Promise.all([
      // Results for patient 1 (CBC)
      prisma.testResult.create({
        data: {
          labAssignmentId: labAssignments[0].id,
          labTestId: labTests[0].id,
          result: "Normal",
          unit: "Various",
          normalRange: "See individual parameters",
          isAbnormal: false,
          remarks: "All parameters within normal range",
          reportedAt: new Date(),
          reportedBy: pathologyAdmin.id,
        },
      }),
      // Results for patient 2 (Lipid Profile)
      prisma.testResult.create({
        data: {
          labAssignmentId: labAssignments[1].id,
          labTestId: labTests[3].id,
          result: "Elevated LDL",
          unit: "mg/dL",
          normalRange: "< 100 mg/dL",
          isAbnormal: true,
          remarks: "LDL cholesterol elevated, recommend lifestyle changes",
          reportedAt: new Date(),
          reportedBy: pathologyAdmin.id,
        },
      }),
      // Results for patient 3 (Kidney Function)
      prisma.testResult.create({
        data: {
          labAssignmentId: labAssignments[2].id,
          labTestId: labTests[4].id,
          result: "Normal",
          unit: "Various",
          normalRange: "See individual parameters",
          isAbnormal: false,
          remarks: "Kidney function normal",
          reportedAt: new Date(),
          reportedBy: pathologyAdmin.id,
        },
      }),
    ]);
    console.log('✅ Test results created:', testResults.length);

    // Create Sample Appointment Reports
    console.log('Creating sample appointment reports...');
    const appointmentReports = await Promise.all([
      prisma.appointmentReport.create({
        data: {
          appointmentId: appointments[0].id,
          fileName: "CBC_Report_Ramesh_Singh.pdf",
          fileUrl: "https://example.com/reports/cbc_report_1.pdf",
          fileSize: 1024000,
          mimeType: "application/pdf",
        },
      }),
      prisma.appointmentReport.create({
        data: {
          appointmentId: appointments[1].id,
          fileName: "Lipid_Profile_Sunita_Verma.pdf",
          fileUrl: "https://example.com/reports/lipid_report_1.pdf",
          fileSize: 1536000,
          mimeType: "application/pdf",
        },
      }),
    ]);
    console.log('✅ Appointment reports created:', appointmentReports.length);

    console.log('🎉 Pathology data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Pathology Lab: 1`);
    console.log(`- Pathology Admin: 1`);
    console.log(`- Phlebotomists: ${phlebotomists.length}`);
    console.log(`- Lab Tests: ${labTests.length}`);
    console.log(`- Patients: ${patients.length}`);
    console.log(`- Appointments: ${appointments.length}`);
    console.log(`- Lab Assignments: ${labAssignments.length}`);
    console.log(`- Test Results: ${testResults.length}`);
    console.log(`- Appointment Reports: ${appointmentReports.length}`);

    console.log('\n🔑 Login Credentials:');
    console.log('Pathology Admin: +91-9999999999');
    console.log('Phlebotomist 1: +91-8888888888');
    console.log('Phlebotomist 2: +91-7777777777');
    console.log('Phlebotomist 3: +91-6666666666');

  } catch (error) {
    console.error('❌ Error seeding pathology data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedPathologyData()
  .then(() => {
    console.log('✅ Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }); 