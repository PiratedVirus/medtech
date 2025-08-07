async function seedAppointments(prisma = require("@prisma/client").PrismaClient) {
  console.log("📅 Seeding appointments and availability...");

  // Get doctors and patients
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" },
    include: { doctorProfile: true }
  });

  const patients = await prisma.user.findMany({
    where: { role: "PATIENT" }
  });

  console.log(`👨‍⚕️ Found ${doctors.length} doctors and ${patients.length} patients`);

  // Create 50 slots per doctor (mix of past, present, and future)
  const availabilityData = [];
  const today = new Date();
  
  console.log("📅 Generating 50 slots per doctor...");
  
  // Define time ranges for slots
  const sessionTimings = [
    { startTime: "09:00", endTime: "12:00" }, // Morning session
    { startTime: "14:00", endTime: "18:00" }, // Afternoon session
  ];

  function generateTimeSlots(start, end) {
    const slots = [];
    let current = new Date(`2025-01-01T${start}:00`);
    const endTime = new Date(`2025-01-01T${end}:00`);

    while (current < endTime) {
      const nextSlot = new Date(current);
      nextSlot.setMinutes(nextSlot.getMinutes() + 30); // 30-minute slot

      if (nextSlot <= endTime) {
        slots.push({
          startTime: current.toTimeString().slice(0, 5), // HH:MM format
          endTime: nextSlot.toTimeString().slice(0, 5), // HH:MM format
        });
      }
      current = nextSlot;
    }
    return slots;
  }

  // Generate 50 slots per doctor across different dates
  for (const doctor of doctors) {
    let slotCount = 0;
    let dayOffset = -30; // Start 30 days ago
    
    while (slotCount < 50) {
      const date = new Date(today);
      date.setDate(today.getDate() + dayOffset);
      
      // Skip weekends
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        for (const session of sessionTimings) {
          const slots = generateTimeSlots(session.startTime, session.endTime);
          
          for (const slot of slots) {
            if (slotCount >= 50) break;
            
            availabilityData.push({
              userId: doctor.id,
              date: date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              status: "AVAILABLE", // Will be updated based on appointments
            });
            slotCount++;
          }
        }
      }
      dayOffset++;
    }
  }
  
  console.log(`📊 Generated ${availabilityData.length} availability slots`);

  // Create availability slots
  console.log("🔄 Creating availability slots...");
  const createdAvailabilities = [];
  
  for (const availability of availabilityData) {
    const created = await prisma.doctorAvailability.create({
      data: availability,
    });
    createdAvailabilities.push(created);
  }
  
  console.log(`✅ ${createdAvailabilities.length} availability slots created`);

  // Create realistic appointment scenarios
  console.log("📋 Creating realistic appointment scenarios...");
  
  const appointmentScenarios = [
    // Scenario 1: Completed appointments with prescriptions (past)
    {
      count: 15,
      status: "COMPLETED",
      hasPrescription: true,
      hasPayment: true,
      daysOffset: -30,
      description: "Completed appointments with prescriptions"
    },
    // Scenario 2: Completed appointments without prescriptions (past)
    {
      count: 10,
      status: "COMPLETED", 
      hasPrescription: false,
      hasPayment: true,
      daysOffset: -20,
      description: "Completed appointments without prescriptions"
    },
    // Scenario 3: Confirmed upcoming appointments (future)
    {
      count: 8,
      status: "CONFIRMED",
      hasPrescription: false,
      hasPayment: true,
      daysOffset: 5,
      description: "Confirmed upcoming appointments"
    },
    // Scenario 4: Scheduled appointments (future)
    {
      count: 7,
      status: "SCHEDULED",
      hasPrescription: false,
      hasPayment: false,
      daysOffset: 10,
      description: "Scheduled appointments"
    },
    // Scenario 5: Cancelled appointments (mixed)
    {
      count: 5,
      status: "CANCELLED",
      hasPrescription: false,
      hasPayment: false,
      daysOffset: -10,
      description: "Cancelled appointments"
    }
  ];

  const appointments = [];
  const prescriptions = [];
  const payments = [];
  
  let appointmentIndex = 0;
  
  for (const scenario of appointmentScenarios) {
    console.log(`📅 Creating ${scenario.count} ${scenario.description}...`);
    
    for (let i = 0; i < scenario.count; i++) {
      // Prioritize Dr. Rajesh Sharma (+919420809961) for completed appointments
      let doctor;
      if (scenario.status === "COMPLETED" && i < 8) {
        // First 8 completed appointments go to Dr. Rajesh Sharma
        doctor = doctors.find(d => d.phoneNumber === "+919420809961");
      } else {
        doctor = doctors[i % doctors.length];
      }
      const patient = patients[i % patients.length];
      
      if (!doctor || !patient) continue;
      
      // Find an available slot for this scenario
      const availableSlots = createdAvailabilities.filter(slot => 
        slot.userId === doctor.id && 
        slot.status === "AVAILABLE"
      );
      
      if (availableSlots.length === 0) continue;
      
      const slot = availableSlots[0];
      
      // Calculate appointment date based on scenario
      const appointmentDate = new Date(today);
      appointmentDate.setDate(today.getDate() + scenario.daysOffset + (i % 7));
      
      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          patientId: patient.id,
          userId: doctor.id,
          consultationType: "video",
          appointmentFor: ["Diabetes Management", "Blood Pressure Check", "Cardiac Consultation", "General Checkup"][i % 4],
          fullName: patient.name,
          mobile: patient.phoneNumber,
          email: patient.email,
          isDietician: false,
          appointmentDate: appointmentDate,
          status: scenario.status,
          doctorNotes: `Notes for ${scenario.description} - Patient ${patient.name}`,
          doctorAvailabilityId: slot.id,
        },
      });
      
      appointments.push(appointment);
      
      // Update slot status
      await prisma.doctorAvailability.update({
        where: { id: slot.id },
        data: { status: "BOOKED" },
      });
      
      // Create prescription for completed appointments that need it
      if (scenario.hasPrescription && scenario.status === "COMPLETED") {
        const prescription = await prisma.prescription.create({
          data: {
            appointmentId: appointment.id,
            patientId: patient.id,
            doctorId: doctor.id,
            prescriptionNumber: `PRES-${Date.now()}-${appointmentIndex}`,
            advice: "Continue current medication and lifestyle modifications",
            testsRequested: "FBS, HbA1C",
            nextVisitDate: new Date(appointmentDate.getTime() + 30 * 24 * 60 * 60 * 1000),
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
              severity: "MODERATE",
            },
            {
              prescriptionId: prescription.id,
              complaintText: "Frequent urination",
              severity: "MODERATE",
            }
          ],
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
            }
          ],
        });
        
        prescriptions.push(prescription);
      }
      
      // Create payment for appointments that need it
      if (scenario.hasPayment) {
        const paymentStatus = scenario.status === "CANCELLED" ? "REFUNDED" : "COMPLETED";
        const paymentMethod = Math.random() > 0.7 ? "Cash" : "Online";
        
        // Get doctor's consultation fee
        const doctorProfile = await prisma.doctorProfile.findUnique({
          where: { userId: doctor.id }
        });
        
        const consultationFee = doctorProfile?.consultationFee || 1500;
        
        const payment = await prisma.payment.create({
          data: {
            appointmentId: appointment.id,
            razorpayOrderId: `order_${Date.now()}_${appointmentIndex}`,
            razorpayPaymentId: `pay_${Date.now()}_${appointmentIndex}`,
            amount: consultationFee * 100, // Convert to paise
            currency: "INR",
            paymentStatus: paymentStatus,
            paymentMethod: paymentMethod,
            createdAt: appointmentDate,
            updatedAt: appointmentDate,
          },
        });
        
        payments.push(payment);
      }
      
      appointmentIndex++;
    }
  }

  // Create lab reports for some completed appointments
  console.log("🔬 Creating lab reports for some appointments...");
  
  const completedAppointments = appointments.filter(apt => apt.status === "COMPLETED");
  const labReportsCount = Math.min(5, completedAppointments.length);
  
  for (let i = 0; i < labReportsCount; i++) {
    const appointment = completedAppointments[i];
    
    // Create appointment report
    await prisma.appointmentReport.create({
      data: {
        appointmentId: appointment.id,
        fileName: `blood-test-report-${appointment.id}.pdf`,
        fileUrl: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`,
        fileSize: 1024, // 1KB dummy size
        mimeType: "application/pdf",
      },
    });
  }

  console.log(`✅ ${appointments.length} appointments created`);
  console.log(`✅ ${prescriptions.length} prescriptions created`);
  console.log(`✅ ${payments.length} payments created`);
  console.log(`✅ ${labReportsCount} lab reports created`);

  // Summary of slot status
  const slotStatus = await prisma.doctorAvailability.groupBy({
    by: ['status'],
    _count: { status: true }
  });
  
  console.log("\n📊 Slot Status Summary:");
  slotStatus.forEach(status => {
    console.log(`   ${status.status}: ${status._count.status} slots`);
  });

  return { 
    availabilities: createdAvailabilities, 
    appointments,
    prescriptions,
    payments
  };
}

module.exports = { seedAppointments }; 