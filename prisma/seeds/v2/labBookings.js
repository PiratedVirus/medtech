const { PrismaClient, LabAssignmentStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedLabBookings(tx = prisma) {
  console.log("🧪 Seeding lab bookings and assignments...");

  // Get patients, lab packages, phlebotomists, and pathology lab
  const patients = await tx.user.findMany({
    where: { role: "PATIENT" }
  });

  const labPackages = await tx.labPackage.findMany();
  const phlebotomists = await tx.phlebotomist.findMany();
  const pathologyLab = await tx.pathologyLab.findFirst();

  // Seed Lab Bookings
  const labBookingsData = [
    {
      patientId: patients[0]?.id,
      labPackageId: labPackages[0]?.id, // Care+
      appointmentFor: "Routine Health Checkup",
      fullName: patients[0]?.name,
      mobile: patients[0]?.phoneNumber,
      email: patients[0]?.email,
      address: "123 Main Street, Mumbai",
      paymentOption: "Online",
      status: LabAssignmentStatus.PENDING,
      labDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      patientId: patients[1]?.id,
      labPackageId: labPackages[1]?.id, // Basic
      appointmentFor: "Diabetes Monitoring",
      fullName: patients[1]?.name,
      mobile: patients[1]?.phoneNumber,
      email: patients[1]?.email,
      address: "456 Park Avenue, Delhi",
      paymentOption: "Cash",
      status: LabAssignmentStatus.ASSIGNED,
      labDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    },
    {
      patientId: patients[2]?.id,
      labPackageId: labPackages[2]?.id, // Blood glucose
      appointmentFor: "Blood Sugar Test",
      fullName: patients[2]?.name,
      mobile: patients[2]?.phoneNumber,
      email: patients[2]?.email,
      address: "789 Lake Road, Bangalore",
      paymentOption: "Online",
      status: LabAssignmentStatus.COMPLETED,
      labDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    },
  ];

  const labBookings = [];
  for (const bookingData of labBookingsData) {
    if (bookingData.patientId && bookingData.labPackageId) {
      const booking = await tx.labBooking.create({
        data: bookingData,
      });
      labBookings.push(booking);
    }
  }
  console.log(`✅ ${labBookings.length} lab bookings seeded`);

  // Seed Lab Assignments
  const labAssignmentsData = [
    {
      patientId: patients[1]?.id,
      phlebotomistId: phlebotomists[0]?.id,
      labId: pathologyLab?.id,
      labBookingId: labBookings[1]?.id,
      assignedDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      assignedTime: "09:00",
      status: LabAssignmentStatus.ASSIGNED,
      sampleCollected: false,
      notes: "Patient prefers morning collection",
    },
    {
      patientId: patients[2]?.id,
      phlebotomistId: phlebotomists[1]?.id,
      labId: pathologyLab?.id,
      labBookingId: labBookings[2]?.id,
      assignedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      assignedTime: "10:30",
      status: LabAssignmentStatus.COMPLETED,
      sampleCollected: true,
      sampleCollectedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      notes: "Sample collected successfully",
    },
  ];

  const labAssignments = [];
  for (const assignmentData of labAssignmentsData) {
    if (assignmentData.patientId && assignmentData.phlebotomistId && assignmentData.labId) {
      const assignment = await tx.labAssignment.create({
        data: assignmentData,
      });
      labAssignments.push(assignment);
    }
  }
  console.log(`✅ ${labAssignments.length} lab assignments seeded`);

  return { labBookings, labAssignments };
}

module.exports = { seedLabBookings }; 