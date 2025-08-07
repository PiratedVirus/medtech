const { PrismaClient, UserRole, UserStatus } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedUsers(prisma = require("@prisma/client").PrismaClient, clinics = []) {
  console.log("👥 Seeding users...");
  
  // Get the first clinic ID for user assignments
  const firstClinicId = clinics.length > 0 ? clinics[0].id : 1;



  const usersData = [
    // Doctors
    {
      phoneNumber: "+919420809961",
      email: "dr.sharma@carediabetics.com",
      name: "Dr. Rajesh Sharma",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-2222222220",
      email: "dr.patel@carediabetics.com",
      name: "Dr. Priya Patel",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-3333333330",
      email: "dr.kumar@carediabetics.com",
      name: "Dr. Amit Kumar",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-4444444440",
      email: "dr.singh@carediabetics.com",
      name: "Dr. Neha Singh",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-5555555550",
      email: "dr.verma@carediabetics.com",
      name: "Dr. Sneha Verma",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-9000000001",
      email: "dr.kapoor@example.com",
      name: "Dr. Ravi Kapoor",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-9000000002",
      email: "dr.menon@example.com",
      name: "Dr. Anjali Menon",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },

    // Patients
    {
      phoneNumber: "+918149306224",
      email: "patient.rahul@example.com",
      name: "Rahul Verma",
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-9000000004",
      email: "patient.sara@example.com",
      name: "Sara Ali",
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-9000000005",
      email: "patient.raj@example.com",
      name: "Raj Kumar",
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-9000000006",
      email: "patient.priya@example.com",
      name: "Priya Sharma",
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-9000000007",
      email: "patient.amit@example.com",
      name: "Amit Patel",
      role: UserRole.PATIENT,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },

    // Dieticians (as DOCTOR role)
    {
      phoneNumber: "+91-9000000008",
      email: "dietician.meera@example.com",
      name: "Meera Iyer",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-9000000009",
      email: "dietician.sunita@example.com",
      name: "Sunita Reddy",
      role: UserRole.DOCTOR,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },

    // Lab Techs
    {
      phoneNumber: "+91-9000000010",
      email: "labtech.rajesh@example.com",
      name: "Rajesh Lab Tech",
      role: UserRole.LAB_TECH,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-9000000011",
      email: "labtech.priya@example.com",
      name: "Priya Lab Tech",
      role: UserRole.LAB_TECH,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },

    // Pathology Admin
    {
      phoneNumber: "+919421300875",
      email: "pathology@carediabetics.com",
      name: "Pathology Admin",
      role: UserRole.PATHOLOGY,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },

    // Phlebotomists
    {
      phoneNumber: "+91-8888888888",
      email: "phlebo1@carediabetics.com",
      name: "Rajesh Kumar",
      role: UserRole.PHLEBOTOMIST,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-7777777777",
      email: "phlebo2@carediabetics.com",
      name: "Priya Sharma",
      role: UserRole.PHLEBOTOMIST,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
    {
      phoneNumber: "+91-6666666666",
      email: "phlebo3@carediabetics.com",
      name: "Amit Patel",
      role: UserRole.PHLEBOTOMIST,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },

    // Admin
    {
      phoneNumber: "+91-9999999990",
      email: "admin@caredb.com",
      password: "$2b$10$iem402R/BJ46Aa0tcPdomOCsA8NFNPGfX8WrORwaak7HYM33JXjHy",
      name: "System Admin",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      clinicId: firstClinicId,
    },
  ];

  const users = [];
  for (const userData of usersData) {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        phoneNumber: userData.phoneNumber,
        deletedAt: null,
      },
    });

    if (!existingUser) {
      const user = await prisma.user.create({
        data: userData,
      });
      users.push(user);
    } else {
      users.push(existingUser);
    }
  }
  console.log(`✅ ${users.length} users seeded`);

  return users;
}

module.exports = { seedUsers }; 