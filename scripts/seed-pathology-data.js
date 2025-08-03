const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPathologyData() {
  try {
    console.log('🌱 Seeding comprehensive pathology data...');

    // Clear existing pathology data for fresh seeding
    console.log('🧹 Clearing existing pathology data...');
    await prisma.testResult.deleteMany({});
    await prisma.labAssignment.deleteMany({});
    await prisma.appointment.deleteMany({ where: { consultationType: "Lab Test" } });
    await prisma.phlebotomist.deleteMany({});
    await prisma.labTest.deleteMany({});
    await prisma.pathologyLab.deleteMany({});
    // Clear patient profiles first, then users
    await prisma.patientProfile.deleteMany({ where: { user: { phoneNumber: { startsWith: "+91987654322" } } } });
    await prisma.user.deleteMany({ where: { role: "PATHOLOGY" } });
    await prisma.user.deleteMany({ where: { role: "PATIENT", phoneNumber: { startsWith: "+91987654322" } } });
    console.log('✅ Cleared existing data');

    // Create pathology labs
    const labs = await Promise.all([
      prisma.pathologyLab.create({
        data: {
          name: "Care Diabetics Central Lab",
          address: "121 Ambedkar St, Kanpur VIC-110085, India",
          contactNumber: "+91-888-123-4587",
          email: "lab@carediabetics.com",
          licenseNumber: "LAB001",
          isActive: true,
        },
      }),
      prisma.pathologyLab.create({
        data: {
          name: "AIIMS Pathology Center",
          address: "AIIMS Campus, New Delhi",
          contactNumber: "+91-11-2658-8500",
          email: "pathology@aiims.edu",
          licenseNumber: "LAB002",
          isActive: true,
        },
      }),
      prisma.pathologyLab.create({
        data: {
          name: "Metro Diagnostics Lab",
          address: "45 MG Road, Bangalore",
          contactNumber: "+91-80-2222-3333",
          email: "info@metrodiagnostics.com",
          licenseNumber: "LAB003",
          isActive: true,
        },
      }),
    ]);

    console.log('✅ Created pathology labs:', labs.length);

    // Create lab tests
    const labTests = await Promise.all([
      prisma.labTest.create({
        data: {
          name: "Fasting Blood Sugar (FBS)",
          code: "FBS001",
          description: "Measurement of blood glucose levels after fasting",
          parameters: [
            { name: "Glucose", unit: "mg/dL", normalRange: "70-99" },
            { name: "HbA1c", unit: "%", normalRange: "4.0-5.6" },
          ],
          normalRange: {
            normal: "70-99 mg/dL",
            preDiabetes: "100-125 mg/dL",
            diabetes: ">126 mg/dL",
          },
          unit: "mg/dL",
          isActive: true,
        },
      }),
      prisma.labTest.create({
        data: {
          name: "Complete Blood Count (CBC)",
          code: "CBC001",
          description: "Complete blood count with differential",
          parameters: [
            { name: "Hemoglobin", unit: "g/dL", normalRange: "12-16" },
            { name: "White Blood Cells", unit: "cells/μL", normalRange: "4000-11000" },
            { name: "Platelets", unit: "cells/μL", normalRange: "150000-450000" },
            { name: "Red Blood Cells", unit: "million/μL", normalRange: "4.5-5.9" },
          ],
          normalRange: {
            hemoglobin: "12-16 g/dL",
            wbc: "4000-11000 cells/μL",
            platelets: "150000-450000 cells/μL",
            rbc: "4.5-5.9 million/μL",
          },
          unit: "various",
          isActive: true,
        },
      }),
      prisma.labTest.create({
        data: {
          name: "Lipid Profile",
          code: "LIPID001",
          description: "Complete lipid profile including cholesterol and triglycerides",
          parameters: [
            { name: "Total Cholesterol", unit: "mg/dL", normalRange: "<200" },
            { name: "HDL Cholesterol", unit: "mg/dL", normalRange: ">40" },
            { name: "LDL Cholesterol", unit: "mg/dL", normalRange: "<100" },
            { name: "Triglycerides", unit: "mg/dL", normalRange: "<150" },
          ],
          normalRange: {
            totalCholesterol: "<200 mg/dL",
            hdl: ">40 mg/dL",
            ldl: "<100 mg/dL",
            triglycerides: "<150 mg/dL",
          },
          unit: "mg/dL",
          isActive: true,
        },
      }),
      prisma.labTest.create({
        data: {
          name: "Kidney Function Test (KFT)",
          code: "KFT001",
          description: "Kidney function assessment",
          parameters: [
            { name: "Creatinine", unit: "mg/dL", normalRange: "0.7-1.3" },
            { name: "Urea", unit: "mg/dL", normalRange: "7-20" },
            { name: "Uric Acid", unit: "mg/dL", normalRange: "3.4-7.0" },
          ],
          normalRange: {
            creatinine: "0.7-1.3 mg/dL",
            urea: "7-20 mg/dL",
            uricAcid: "3.4-7.0 mg/dL",
          },
          unit: "mg/dL",
          isActive: true,
        },
      }),
      prisma.labTest.create({
        data: {
          name: "Liver Function Test (LFT)",
          code: "LFT001",
          description: "Liver function assessment",
          parameters: [
            { name: "Bilirubin Total", unit: "mg/dL", normalRange: "0.3-1.2" },
            { name: "ALT", unit: "U/L", normalRange: "7-55" },
            { name: "AST", unit: "U/L", normalRange: "8-48" },
            { name: "Alkaline Phosphatase", unit: "U/L", normalRange: "44-147" },
          ],
          normalRange: {
            bilirubin: "0.3-1.2 mg/dL",
            alt: "7-55 U/L",
            ast: "8-48 U/L",
            alp: "44-147 U/L",
          },
          unit: "various",
          isActive: true,
        },
      }),
    ]);

    console.log('✅ Created lab tests:', labTests.length);

    // Create phlebotomist users and profiles
    const phlebotomistUsers = await Promise.all([
      prisma.user.create({
        data: {
          phoneNumber: "+919876543210",
          email: "pathology@carediabetics.com",
          name: "Pathology Admin",
          role: "PATHOLOGY",
          status: "ACTIVE",
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543211",
          email: "phlebotomist1@carediabetics.com",
          name: "Rajesh Kumar",
          role: "PATHOLOGY",
          status: "ACTIVE",
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543212",
          email: "phlebotomist2@carediabetics.com",
          name: "Priya Sharma",
          role: "PATHOLOGY",
          status: "ACTIVE",
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543213",
          email: "phlebotomist3@carediabetics.com",
          name: "Amit Patel",
          role: "PATHOLOGY",
          status: "ACTIVE",
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543214",
          email: "phlebotomist4@carediabetics.com",
          name: "Sneha Reddy",
          role: "PATHOLOGY",
          status: "ACTIVE",
        },
      }),
    ]);

    console.log('✅ Created phlebotomist users:', phlebotomistUsers.length);

    // Create phlebotomist profiles
    const phlebotomists = await Promise.all([
      prisma.phlebotomist.create({
        data: {
          userId: phlebotomistUsers[0].id,
          employeeId: "PH001",
          specialization: "Senior Phlebotomist",
          isAvailable: true,
          currentLocation: "Kanpur Central",
        },
      }),
      prisma.phlebotomist.create({
        data: {
          userId: phlebotomistUsers[1].id,
          employeeId: "PH002",
          specialization: "Pediatric Phlebotomy",
          isAvailable: true,
          currentLocation: "Delhi North",
        },
      }),
      prisma.phlebotomist.create({
        data: {
          userId: phlebotomistUsers[2].id,
          employeeId: "PH003",
          specialization: "Emergency Phlebotomy",
          isAvailable: true,
          currentLocation: "Mumbai West",
        },
      }),
      prisma.phlebotomist.create({
        data: {
          userId: phlebotomistUsers[3].id,
          employeeId: "PH004",
          specialization: "Home Collection",
          isAvailable: false,
          currentLocation: "Bangalore South",
        },
      }),
      prisma.phlebotomist.create({
        data: {
          userId: phlebotomistUsers[4].id,
          employeeId: "PH005",
          specialization: "Mobile Phlebotomy",
          isAvailable: true,
          currentLocation: "Chennai Central",
        },
      }),
    ]);

    console.log('✅ Created phlebotomist profiles:', phlebotomists.length);

    // Create sample patients
    const patients = await Promise.all([
      prisma.user.create({
        data: {
          phoneNumber: "+919876543220",
          email: "patient1@example.com",
          name: "Mr. Sameer Reddy",
          role: "PATIENT",
          status: "ACTIVE",
          patientProfile: {
            create: {
              age: 45,
              gender: "Male",
              address: "123 Main Street, Kanpur",
              bloodGroup: "B+",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543221",
          email: "patient2@example.com",
          name: "Mrs. Karishma Singh",
          role: "PATIENT",
          status: "ACTIVE",
          patientProfile: {
            create: {
              age: 32,
              gender: "Female",
              address: "456 Park Avenue, Delhi",
              bloodGroup: "O+",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543222",
          email: "patient3@example.com",
          name: "Mr. Ramesh Kumar",
          role: "PATIENT",
          status: "ACTIVE",
          patientProfile: {
            create: {
              age: 58,
              gender: "Male",
              address: "789 Lake Road, Mumbai",
              bloodGroup: "A+",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543223",
          email: "patient4@example.com",
          name: "Mrs. Sunita Patel",
          role: "PATIENT",
          status: "ACTIVE",
          patientProfile: {
            create: {
              age: 41,
              gender: "Female",
              address: "321 Garden Street, Bangalore",
              bloodGroup: "AB+",
            },
          },
        },
      }),
      prisma.user.create({
        data: {
          phoneNumber: "+919876543224",
          email: "patient5@example.com",
          name: "Mr. Vijay Malhotra",
          role: "PATIENT",
          status: "ACTIVE",
          patientProfile: {
            create: {
              age: 29,
              gender: "Male",
              address: "654 Hill Road, Chennai",
              bloodGroup: "B-",
            },
          },
        },
      }),
    ]);

    console.log('✅ Created patients:', patients.length);

    // Create sample appointments (15 total - more than requested 10)
    const appointments = await Promise.all([
      // Original 5 appointments
      prisma.appointment.create({
        data: {
          patientId: patients[0].id,
          userId: 1, // Assuming doctor ID 1 exists
          consultationType: "Lab Test",
          doctorAvailabilityId: 1, // Assuming availability ID 1 exists
          appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
          status: "CONFIRMED",
          appointmentFor: "Diabetes Package",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[1].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
          status: "CONFIRMED",
          appointmentFor: "Complete Health Checkup",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[2].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          status: "CONFIRMED",
          appointmentFor: "Kidney Function Test",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[3].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
          status: "CONFIRMED",
          appointmentFor: "Liver Function Test",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[4].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
          status: "CONFIRMED",
          appointmentFor: "Lipid Profile",
        },
      }),
      // Additional 10 appointments
      prisma.appointment.create({
        data: {
          patientId: patients[0].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "Thyroid Function Test",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[1].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "Complete Blood Count",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[2].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "Cardiac Panel",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[3].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "Vitamin D Test",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[4].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "Iron Studies",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[0].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "Urine Analysis",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[1].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "HbA1c Test",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[2].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "Pregnancy Test",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[3].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "Allergy Panel",
        },
      }),
      prisma.appointment.create({
        data: {
          patientId: patients[4].id,
          userId: 1,
          consultationType: "Lab Test",
          doctorAvailabilityId: 1,
          appointmentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          appointmentFor: "Hepatitis Panel",
        },
      }),
    ]);

    console.log('✅ Created appointments:', appointments.length);

    // Create lab assignments (8 total - some assigned, some not)
    const labAssignments = await Promise.all([
      // Assigned appointments (first 7 appointments get assignments)
      prisma.labAssignment.create({
        data: {
          patientId: patients[0].id,
          phlebotomistId: phlebotomists[0].id,
          labId: labs[0].id,
          appointmentId: appointments[0].id,
          assignedDate: new Date(),
          assignedTime: "09:00",
          status: "ASSIGNED",
          sampleCollected: false,
        },
      }),
      prisma.labAssignment.create({
        data: {
          patientId: patients[1].id,
          phlebotomistId: phlebotomists[1].id,
          labId: labs[0].id,
          appointmentId: appointments[1].id,
          assignedDate: new Date(),
          assignedTime: "10:30",
          status: "SAMPLE_COLLECTED",
          sampleCollected: true,
          sampleCollectedAt: new Date(),
        },
      }),
      prisma.labAssignment.create({
        data: {
          patientId: patients[2].id,
          phlebotomistId: phlebotomists[2].id,
          labId: labs[1].id,
          appointmentId: appointments[2].id,
          assignedDate: new Date(),
          assignedTime: "11:00",
          status: "IN_LAB",
          sampleCollected: true,
          sampleCollectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
      }),
      prisma.labAssignment.create({
        data: {
          patientId: patients[0].id,
          phlebotomistId: phlebotomists[3].id,
          labId: labs[2].id,
          appointmentId: appointments[5].id,
          assignedDate: new Date(),
          assignedTime: "14:00",
          status: "PHLEBOTOMIST_LEFT",
          sampleCollected: false,
        },
      }),
      prisma.labAssignment.create({
        data: {
          patientId: patients[1].id,
          phlebotomistId: phlebotomists[4].id,
          labId: labs[0].id,
          appointmentId: appointments[6].id,
          assignedDate: new Date(),
          assignedTime: "15:30",
          status: "SAMPLE_COLLECTED",
          sampleCollected: true,
          sampleCollectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
      }),
      prisma.labAssignment.create({
        data: {
          patientId: patients[2].id,
          phlebotomistId: phlebotomists[0].id,
          labId: labs[1].id,
          appointmentId: appointments[7].id,
          assignedDate: new Date(),
          assignedTime: "16:00",
          status: "ANALYZING",
          sampleCollected: true,
          sampleCollectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        },
      }),
      prisma.labAssignment.create({
        data: {
          patientId: patients[3].id,
          phlebotomistId: phlebotomists[1].id,
          labId: labs[2].id,
          appointmentId: appointments[8].id,
          assignedDate: new Date(),
          assignedTime: "17:00",
          status: "COMPLETED",
          sampleCollected: true,
          sampleCollectedAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        },
      }),
      prisma.labAssignment.create({
        data: {
          patientId: patients[4].id,
          phlebotomistId: phlebotomists[2].id,
          labId: labs[0].id,
          appointmentId: appointments[9].id,
          assignedDate: new Date(),
          assignedTime: "18:00",
          status: "ASSIGNED",
          sampleCollected: false,
        },
      }),
      // Remaining appointments (appointments[3], [4], [10]-[14] remain unassigned)
    ]);

    console.log('✅ Created lab assignments:', labAssignments.length);

    // Create some test results for completed assignments
    const testResults = await Promise.all([
      prisma.testResult.create({
        data: {
          labAssignmentId: labAssignments[1].id,
          labTestId: labTests[0].id, // FBS test
          result: "85",
          unit: "mg/dL",
          normalRange: "70-99 mg/dL",
          isAbnormal: false,
          remarks: "Normal fasting glucose level",
          reportedAt: new Date(),
          reportedBy: phlebotomistUsers[0].id,
        },
      }),
      prisma.testResult.create({
        data: {
          labAssignmentId: labAssignments[1].id,
          labTestId: labTests[1].id, // CBC test
          result: "14.2",
          unit: "g/dL",
          normalRange: "12-16 g/dL",
          isAbnormal: false,
          remarks: "Normal hemoglobin level",
          reportedAt: new Date(),
          reportedBy: phlebotomistUsers[0].id,
        },
      }),
    ]);

    console.log('✅ Created test results:', testResults.length);

    console.log('🎉 Comprehensive pathology data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Pathology Labs: ${labs.length}`);
    console.log(`- Lab Tests: ${labTests.length}`);
    console.log(`- Phlebotomists: ${phlebotomists.length}`);
    console.log(`- Patients: ${patients.length}`);
    console.log(`- Appointments: ${appointments.length}`);
    console.log(`- Lab Assignments: ${labAssignments.length}`);
    console.log(`- Test Results: ${testResults.length}`);

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
    console.log('✅ Pathology seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Pathology seeding failed:', error);
    process.exit(1);
  }); 