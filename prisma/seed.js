const { PrismaClient, UserRole, UserStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // 1. Upsert consultation types so we have id=1 and id=2
  await prisma.consultationType.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      type: "Video",
    },
  });

  await prisma.consultationType.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      type: "Physical",
    },
  });

  // 2. Upsert multiple DOCTOR users
  //    Each has a distinct user ID, so we can reference them separately later
  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: "Dr. Aditi Sharma",
      phoneNumber: "+91-81100000001",
      email: "dr.aditi@example.com",
      password: "hashedPassword1", // In production, hash the password
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      doctorProfile: {
        create: {
          specialty: "Cardiology",
          yearsOfExperience: 8,
          licenseNumber: "DOC-ADITI-123",
          consultationFee: 500,
          rating: 4.5,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: "Dr. Rohit Mehta",
      phoneNumber: "+91-9700000002",
      email: "dr.rohit@example.com",
      password: "hashedPassword2",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      doctorProfile: {
        create: {
          specialty: "Dermatology",
          yearsOfExperience: 5,
          licenseNumber: "DOC-ROHIT-456",
          consultationFee: 400,
          rating: 4.3,
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { id: 3 },
    update: {},
    create: {
      id: 3,
      name: "Dr. Priya Nair",
      phoneNumber: "+91-9103000003",
      email: "dr.priya@example.com",
      password: "hashedPassword3",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      doctorProfile: {
        create: {
          specialty: "Orthopedics",
          yearsOfExperience: 10,
          licenseNumber: "DOC-PRIYA-789",
          consultationFee: 600,
          rating: 4.7,
        },
      },
    },
  });

  // 3. Upsert one PATIENT user (ID=10)
  await prisma.user.upsert({
    where: { id: 10 },
    update: {},
    create: {
      id: 10,
      name: "Rahul Verma",
      phoneNumber: "+91-9130000010",
      email: "rahul.verma@example.com",
      password: "hashedPassword10",
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      patientProfile: {
        create: {
          age: 30,
          gender: "Male",
          bloodGroup: "B+",
        },
      },
    },
  });

  // 4. Create multiple appointments referencing the three doctors (1,2,3) and patient=10
  await prisma.appointment.createMany({
    data: [
      {
        patientId: 10,
        doctorId: 1,
        consultationTypeId: 1, // "Video"
        appointmentDate: new Date("2024-09-01T10:00:00.000Z"),
        status: "Scheduled",
      },
      {
        patientId: 10,
        doctorId: 2,
        consultationTypeId: 2, // "Physical"
        appointmentDate: new Date("2024-09-02T11:00:00.000Z"),
        status: "Completed",
      },
      {
        patientId: 10,
        doctorId: 3,
        consultationTypeId: 1, // "Video"
        appointmentDate: new Date("2024-09-03T12:00:00.000Z"),
        status: "Cancelled",
      },
      {
        patientId: 10,
        doctorId: 1,
        consultationTypeId: 2, // "Physical"
        appointmentDate: new Date("2024-09-04T08:30:00.000Z"),
        status: "Scheduled",
      },
      {
        patientId: 10,
        doctorId: 2,
        consultationTypeId: 1, // "Video"
        appointmentDate: new Date("2024-09-05T14:00:00.000Z"),
        status: "Scheduled",
      },
    ],
  });

  console.log("Seeding completed successfully with multiple appointments!");
}

main()
  .catch((err) => {
    console.error("Error in seeding:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });