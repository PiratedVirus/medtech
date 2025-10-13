const { PrismaClient, LabAssignmentStatus, ComplaintSeverity } = require("@prisma/client");
const prisma = new PrismaClient();

async function robustFix(tx = prisma) {
  console.log("🔧 Running robust fix to ensure all tables are properly populated...");

  try {
    // Get all required data
    const patients = await tx.user.findMany({ where: { role: "PATIENT" } });
    const doctors = await tx.user.findMany({ where: { role: "DOCTOR" } });
    const appointments = await tx.appointment.findMany();
    const labBookings = await tx.labBooking.findMany();
    const labTests = await tx.labTest.findMany();
    const phlebotomists = await tx.phlebotomist.findMany();
    const pathologyLab = await tx.pathologyLab.findFirst();
    const plans = await tx.plan.findMany();
    const patientProfiles = await tx.patientProfile.findMany();
    const existingPrescriptions = await tx.prescription.findMany();

    console.log(`📊 Found: ${patients.length} patients, ${doctors.length} doctors, ${appointments.length} appointments, ${labBookings.length} lab bookings`);

    // 1. Ensure Lab Bookings exist
    if (labBookings.length === 0) {
      console.log("🔬 Creating lab bookings...");
      const labPackages = await tx.labPackage.findMany();
      
      for (let i = 0; i < Math.min(3, patients.length); i++) {
        const patient = patients[i];
        const labPackage = labPackages[i % labPackages.length];
        
        await tx.labBooking.create({
          data: {
            patientId: patient.id,
            labPackageId: labPackage.id,
            appointmentFor: `Health Checkup ${i + 1}`,
            fullName: patient.name,
            mobile: patient.phoneNumber,
            email: patient.email,
            address: `${100 + i} Main Street, City`,
            paymentOption: i % 2 === 0 ? "Online" : "Cash",
            status: LabAssignmentStatus.PENDING,
            labDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          },
        });
      }
      console.log("✅ Lab bookings created");
    }

    // 2. Ensure Lab Assignments exist
    const existingLabAssignments = await tx.labAssignment.count();
    if (existingLabAssignments === 0) {
      console.log("🔬 Creating lab assignments...");
      const updatedLabBookings = await tx.labBooking.findMany();
      
      for (let i = 0; i < Math.min(3, updatedLabBookings.length); i++) {
        const booking = updatedLabBookings[i];
        const phlebotomist = phlebotomists[i % phlebotomists.length];
        
        if (phlebotomist && pathologyLab) {
          await tx.labAssignment.create({
            data: {
              patientId: booking.patientId,
              phlebotomistId: phlebotomist.id,
              labId: pathologyLab.id,
              labBookingId: booking.id,
              assignedDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
              assignedTime: "09:00",
              status: i === 0 ? LabAssignmentStatus.PENDING : 
                      i === 1 ? LabAssignmentStatus.ASSIGNED : LabAssignmentStatus.COMPLETED,
              sampleCollected: i === 2,
              sampleCollectedAt: i === 2 ? new Date(Date.now() - 24 * 60 * 60 * 1000) : null,
              notes: `Assignment ${i + 1} for ${booking.fullName || 'Patient'}`,
            },
          });
        }
      }
      console.log("✅ Lab assignments created");
    }

    // 3. Ensure Prescriptions exist for appointments
    if (appointments.length > 0) {
      console.log("📋 Creating prescriptions for appointments...");
      const appointmentsWithoutPrescriptions = [];
      
      for (const appointment of appointments) {
        const existingPrescription = existingPrescriptions.find(p => p.appointmentId === appointment.id);
        if (!existingPrescription) {
          appointmentsWithoutPrescriptions.push(appointment);
        }
      }

      console.log(`📋 Found ${appointmentsWithoutPrescriptions.length} appointments without prescriptions`);

      for (const appointment of appointmentsWithoutPrescriptions.slice(0, 5)) {
        const prescription = await tx.prescription.create({
          data: {
            appointmentId: appointment.id,
            patientId: appointment.patientId,
            doctorId: appointment.userId,
            prescriptionNumber: `PRES-${Date.now()}-${appointment.id}`,
            advice: "Follow diabetic diet, exercise regularly, monitor blood sugar daily",
            testsRequested: "Fasting Blood Sugar, HbA1C, Lipid Profile",
            nextVisitDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            nextVisitType: "days",
            nextVisitValue: 30,
          },
        });

        // Add prescription complaints
        await tx.prescriptionComplaint.createMany({
          data: [
            {
              prescriptionId: prescription.id,
              complaintText: "High blood sugar levels",
              severity: ComplaintSeverity.MODERATE,
              daysSince: 7,
            },
            {
              prescriptionId: prescription.id,
              complaintText: "Fatigue and weakness",
              severity: ComplaintSeverity.MODERATE,
              daysSince: 5,
            },
          ],
        });

        // Add prescription vitals
        await tx.prescriptionVitals.create({
          data: {
            prescriptionId: prescription.id,
            bloodPressure: "140/90",
            pulse: 80,
            height: 170,
            weight: 70.5,
          },
        });

        // Add prescription history
        await tx.prescriptionHistory.create({
          data: {
            prescriptionId: prescription.id,
            allergies: "None",
            personalHistory: "Type 2 Diabetes for 3 years",
            pastMedicalHistory: "Hypertension",
            familyHistory: "Father had diabetes",
          },
        });

        // Add prescription systemic examination
        await tx.prescriptionSystemicExamination.create({
          data: {
            prescriptionId: prescription.id,
            general: "Conscious, oriented, afebrile",
            cvs: "S1, S2 normal, no murmurs",
            rs: "Bilateral air entry normal, no added sounds",
            cns: "Higher functions normal, cranial nerves intact",
          },
        });

        // Add prescription medicines
        await tx.prescriptionMedicine.createMany({
          data: [
            {
              prescriptionId: prescription.id,
              medicineName: "Metformin",
              frequency: "Twice daily",
              medicineTime: "Before meals",
              duration: "30 days",
              quantity: 60,
              instructions: "Take with food to avoid stomach upset",
            },
            {
              prescriptionId: prescription.id,
              medicineName: "Glimepiride",
              frequency: "Once daily",
              medicineTime: "Before breakfast",
              duration: "30 days",
              quantity: 30,
              instructions: "Take 30 minutes before breakfast",
            },
          ],
        });
      }
      console.log("✅ Prescriptions and related data created");
    }

    // 4. Ensure Health Metrics exist
    const existingHealthMetrics = await tx.healthMetric.count();
    if (existingHealthMetrics === 0 && patients.length > 0) {
      console.log("📊 Creating health metrics...");
      const healthMetricsData = [
        {
          userId: patients[0]?.id,
          metricName: "Blood Sugar (Fasting)",
          reading: 120,
          recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          userId: patients[0]?.id,
          metricName: "Blood Sugar (Post Prandial)",
          reading: 180,
          recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          userId: patients[0]?.id,
          metricName: "Weight",
          reading: 70.5,
          recordedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
        {
          userId: patients[1]?.id,
          metricName: "Blood Sugar (Fasting)",
          reading: 95,
          recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          userId: patients[1]?.id,
          metricName: "Systolic Blood Pressure",
          reading: 120,
          recordedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      ];

      for (const metricData of healthMetricsData) {
        if (metricData.userId) {
          await tx.healthMetric.create({ data: metricData });
        }
      }
      console.log("✅ Health metrics created");
    }

    // 5. Ensure Prescription Templates exist
    const existingTemplates = await tx.prescriptionTemplate.count();
    if (existingTemplates === 0 && doctors.length > 0) {
      console.log("📋 Creating prescription templates...");
      for (const doctor of doctors.slice(0, 2)) {
        // Diabetes template
        const diabetesTemplate = await tx.prescriptionTemplate.create({
          data: {
            doctorId: doctor.id,
            templateName: "Diabetes Management",
            templateDescription: "Standard template for diabetes management and monitoring",
            isActive: true,
          },
        });

        await tx.templateComplaint.createMany({
          data: [
            {
              templateId: diabetesTemplate.id,
              complaintText: "High blood sugar levels",
              severity: ComplaintSeverity.MODERATE,
            },
            {
              templateId: diabetesTemplate.id,
              complaintText: "Frequent urination",
              severity: ComplaintSeverity.MODERATE,
            },
          ],
        });

        await tx.templateMedicine.createMany({
          data: [
            {
              templateId: diabetesTemplate.id,
              medicineName: "Metformin",
              frequency: "Twice daily",
              medicineTime: "Before meals",
              duration: "30 days",
              quantity: 60,
              instructions: "Take with food to avoid stomach upset",
            },
            {
              templateId: diabetesTemplate.id,
              medicineName: "Glimepiride",
              frequency: "Once daily",
              medicineTime: "Before breakfast",
              duration: "30 days",
              quantity: 30,
              instructions: "Take 30 minutes before breakfast",
            },
          ],
        });

        // Hypertension template
        const hypertensionTemplate = await tx.prescriptionTemplate.create({
          data: {
            doctorId: doctor.id,
            templateName: "Hypertension Management",
            templateDescription: "Standard template for blood pressure management",
            isActive: true,
          },
        });

        await tx.templateComplaint.createMany({
          data: [
            {
              templateId: hypertensionTemplate.id,
              complaintText: "High blood pressure",
              severity: ComplaintSeverity.RISK,
            },
          ],
        });

        await tx.templateMedicine.createMany({
          data: [
            {
              templateId: hypertensionTemplate.id,
              medicineName: "Losartan",
              frequency: "Once daily",
              medicineTime: "Morning",
              duration: "30 days",
              quantity: 30,
              instructions: "Take in the morning",
            },
          ],
        });
      }
      console.log("✅ Prescription templates created");
    }

    // 6. Ensure Subscription Trackers exist
    const existingTrackers = await tx.subscriptionTracker.count();
    if (existingTrackers === 0 && patientProfiles.length > 0 && plans.length > 0) {
      console.log("📊 Creating subscription trackers...");
      for (let i = 0; i < Math.min(3, patientProfiles.length); i++) {
        const patient = patientProfiles[i];
        const plan = plans[i % plans.length];
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (plan.duration === "6months" ? 6 : 12));

        await tx.subscriptionTracker.create({
          data: {
            patientId: patient.id,
            planId: plan.id,
            doctorConsultationDates: [
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            ],
            dieticianConsultationDates: [
              new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            ],
            labTestsDates: [
              new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            ],
            ophthalmologistConsultationDates: [],
            usedMedicines: ["Metformin", "Glimepiride"],
            razorpayOrderId: `order_sub_${Date.now()}_${patient.id}`,
            razorpayPaymentId: `pay_sub_${Date.now()}_${patient.id}`,
            paymentStatus: "COMPLETED",
            startDate: startDate,
            endDate: endDate,
            isActive: true,
          },
        });
      }
      console.log("✅ Subscription trackers created");
    }

    // 7. Ensure Test Results exist
    const existingTestResults = await tx.testResult.count();
    if (existingTestResults === 0 && labTests.length > 0) {
      console.log("🔬 Creating test results...");
      const labAssignments = await tx.labAssignment.findMany();
      
      for (let i = 0; i < Math.min(5, labTests.length); i++) {
        const labTest = labTests[i];
        const labAssignment = labAssignments[i % labAssignments.length];
        
        if (labAssignment) {
          await tx.testResult.create({
            data: {
              labAssignmentId: labAssignment.id,
              labTestId: labTest.id,
              result: i % 2 === 0 ? "120" : "Normal",
              unit: i % 2 === 0 ? "mg/dL" : "",
              normalRange: i % 2 === 0 ? "70-140 mg/dL" : "Normal",
              isAbnormal: i % 2 === 0,
              remarks: i % 2 === 0 ? "Slightly elevated" : "Within normal range",
              reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
              reportedBy: doctors[0]?.id,
            },
          });
        }
      }
      console.log("✅ Test results created");
    }

    // Final verification
    console.log("\n📊 Final verification:");
    const finalCounts = {
      labBookings: await tx.labBooking.count(),
      labAssignments: await tx.labAssignment.count(),
      prescriptions: await tx.prescription.count(),
      prescriptionVitals: await tx.prescriptionVitals.count(),
      prescriptionHistory: await tx.prescriptionHistory.count(),
      prescriptionSystemicExamination: await tx.prescriptionSystemicExamination.count(),
      healthMetrics: await tx.healthMetric.count(),
      prescriptionTemplates: await tx.prescriptionTemplate.count(),
      subscriptionTrackers: await tx.subscriptionTracker.count(),
      testResults: await tx.testResult.count(),
    };

    console.log("📊 Final counts:");
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count}`);
    });

    console.log("🎉 Robust fix completed successfully!");

  } catch (error) {
    console.error("❌ Error in robust fix:", error);
    throw error;
  }
}

module.exports = { robustFix }; 