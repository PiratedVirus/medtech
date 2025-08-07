const { PrismaClient, LabAssignmentStatus, ComplaintSeverity } = require("@prisma/client");
const prisma = new PrismaClient();

async function ensureCompleteData() {
  console.log("🔧 Ensuring complete data across all tables...");
  console.log("⚠️  This script will ensure all required tables have data without losing existing data");

  try {
    // Get all required data
    const patients = await prisma.user.findMany({ where: { role: "PATIENT" } });
    const doctors = await prisma.user.findMany({ where: { role: "DOCTOR" } });
    const appointments = await prisma.appointment.findMany();
    const labBookings = await prisma.labBooking.findMany();
    const labTests = await prisma.labTest.findMany();
    const phlebotomists = await prisma.phlebotomist.findMany();
    const pathologyLab = await prisma.pathologyLab.findFirst();
    const plans = await prisma.plan.findMany();
    const patientProfiles = await prisma.patientProfile.findMany();
    const existingPrescriptions = await prisma.prescription.findMany();

    console.log(`📊 Current state: ${patients.length} patients, ${doctors.length} doctors, ${appointments.length} appointments`);

    // Check and fix each table
    const fixes = [];

    // 1. Lab Bookings
    if (labBookings.length === 0) {
      console.log("🔬 Creating lab bookings...");
      const labPackages = await prisma.labPackage.findMany();
      
      for (let i = 0; i < Math.min(3, patients.length); i++) {
        const patient = patients[i];
        const labPackage = labPackages[i % labPackages.length];
        
        await prisma.labBooking.create({
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
      fixes.push("Lab Bookings");
    }

    // 2. Lab Assignments
    const existingLabAssignments = await prisma.labAssignment.count();
    if (existingLabAssignments === 0) {
      console.log("🔬 Creating lab assignments...");
      const updatedLabBookings = await prisma.labBooking.findMany();
      
      for (let i = 0; i < Math.min(3, updatedLabBookings.length); i++) {
        const booking = updatedLabBookings[i];
        const phlebotomist = phlebotomists[i % phlebotomists.length];
        
        if (phlebotomist && pathologyLab) {
          await prisma.labAssignment.create({
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
      fixes.push("Lab Assignments");
    }

    // 3. Prescriptions for appointments without prescriptions
    if (appointments.length > 0) {
      const appointmentsWithoutPrescriptions = [];
      
      for (const appointment of appointments) {
        const existingPrescription = existingPrescriptions.find(p => p.appointmentId === appointment.id);
        if (!existingPrescription) {
          appointmentsWithoutPrescriptions.push(appointment);
        }
      }

      if (appointmentsWithoutPrescriptions.length > 0) {
        console.log(`📋 Creating prescriptions for ${appointmentsWithoutPrescriptions.length} appointments...`);
        
        for (const appointment of appointmentsWithoutPrescriptions.slice(0, 5)) {
          const prescription = await prisma.prescription.create({
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
          await prisma.prescriptionComplaint.createMany({
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
          await prisma.prescriptionVitals.create({
            data: {
              prescriptionId: prescription.id,
              bloodPressure: "140/90",
              pulse: 80,
              height: 170,
              weight: 70.5,
            },
          });

          // Add prescription history
          await prisma.prescriptionHistory.create({
            data: {
              prescriptionId: prescription.id,
              allergies: "None",
              personalHistory: "Type 2 Diabetes for 3 years",
              pastMedicalHistory: "Hypertension",
              familyHistory: "Father had diabetes",
            },
          });

          // Add prescription systemic examination
          await prisma.prescriptionSystemicExamination.create({
            data: {
              prescriptionId: prescription.id,
              general: "Conscious, oriented, afebrile",
              cvs: "S1, S2 normal, no murmurs",
              rs: "Bilateral air entry normal, no added sounds",
              cns: "Higher functions normal, cranial nerves intact",
            },
          });

          // Add prescription medicines
          await prisma.prescriptionMedicine.createMany({
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
        fixes.push("Prescriptions and related data");
      }
    }

    // 4. Health Metrics
    const existingHealthMetrics = await prisma.healthMetric.count();
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
          await prisma.healthMetric.create({ data: metricData });
        }
      }
      fixes.push("Health Metrics");
    }

    // 5. Prescription Templates
    const existingTemplates = await prisma.prescriptionTemplate.count();
    if (existingTemplates === 0 && doctors.length > 0) {
      console.log("📋 Creating prescription templates...");
      for (const doctor of doctors.slice(0, 2)) {
        // Diabetes template
        const diabetesTemplate = await prisma.prescriptionTemplate.create({
          data: {
            doctorId: doctor.id,
            templateName: "Diabetes Management",
            templateDescription: "Standard template for diabetes management and monitoring",
            isActive: true,
          },
        });

        await prisma.templateComplaint.createMany({
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

        await prisma.templateMedicine.createMany({
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
        const hypertensionTemplate = await prisma.prescriptionTemplate.create({
          data: {
            doctorId: doctor.id,
            templateName: "Hypertension Management",
            templateDescription: "Standard template for blood pressure management",
            isActive: true,
          },
        });

        await prisma.templateComplaint.createMany({
          data: [
            {
              templateId: hypertensionTemplate.id,
              complaintText: "High blood pressure",
              severity: ComplaintSeverity.RISK,
            },
          ],
        });

        await prisma.templateMedicine.createMany({
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
      fixes.push("Prescription Templates");
    }

    // 6. Subscription Trackers
    const existingTrackers = await prisma.subscriptionTracker.count();
    if (existingTrackers === 0 && patientProfiles.length > 0 && plans.length > 0) {
      console.log("📊 Creating subscription trackers...");
      for (let i = 0; i < Math.min(3, patientProfiles.length); i++) {
        const patient = patientProfiles[i];
        const plan = plans[i % plans.length];
        
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + (plan.duration === "6months" ? 6 : 12));

        await prisma.subscriptionTracker.create({
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
      fixes.push("Subscription Trackers");
    }

    // 7. Test Results
    const existingTestResults = await prisma.testResult.count();
    if (existingTestResults === 0 && labTests.length > 0) {
      console.log("🔬 Creating test results...");
      const labAssignments = await prisma.labAssignment.findMany();
      
      for (let i = 0; i < Math.min(5, labTests.length); i++) {
        const labTest = labTests[i];
        const labAssignment = labAssignments[i % labAssignments.length];
        
        if (labAssignment) {
          await prisma.testResult.create({
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
      fixes.push("Test Results");
    }

    // Final verification
    console.log("\n📊 Final verification:");
    const finalCounts = {
      labBookings: await prisma.labBooking.count(),
      labAssignments: await prisma.labAssignment.count(),
      prescriptions: await prisma.prescription.count(),
      prescriptionVitals: await prisma.prescriptionVitals.count(),
      prescriptionHistory: await prisma.prescriptionHistory.count(),
      prescriptionSystemicExamination: await prisma.prescriptionSystemicExamination.count(),
      healthMetrics: await prisma.healthMetric.count(),
      prescriptionTemplates: await prisma.prescriptionTemplate.count(),
      subscriptionTrackers: await prisma.subscriptionTracker.count(),
      testResults: await prisma.testResult.count(),
    };

    console.log("📊 Final counts:");
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`  ${table}: ${count}`);
    });

    if (fixes.length > 0) {
      console.log(`\n✅ Fixed: ${fixes.join(', ')}`);
    } else {
      console.log("\n✅ All tables already have data - no fixes needed");
    }

    console.log("🎉 Data completeness check completed!");

  } catch (error) {
    console.error("❌ Error ensuring complete data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  ensureCompleteData()
    .catch((e) => {
      console.error("💥 FATAL ERROR:", e);
      process.exit(1);
    });
}

module.exports = { ensureCompleteData }; 