async function seedUserProfiles(prisma = require("@prisma/client").PrismaClient) {
  console.log("👤 Seeding user profiles...");

  // Get users by role
  const doctors = await prisma.user.findMany({
    where: { role: "DOCTOR" }
  });

  const patients = await prisma.user.findMany({
    where: { role: "PATIENT" }
  });

  // Get dieticians (they now have DOCTOR role with specific phone numbers)
  const dieticians = await prisma.user.findMany({
    where: { 
      role: "DOCTOR",
      phoneNumber: {
        in: ["+91-9000000008", "+91-9000000009"]
      }
    }
  });

  const labTechs = await prisma.user.findMany({
    where: { role: "LAB_TECH" }
  });

  const phlebotomists = await prisma.user.findMany({
    where: { role: "PHLEBOTOMIST" }
  });

  // Seed Doctor Profiles
  const doctorProfilesData = [
    {
      userId: doctors[0]?.id,
      specialty: "Endocrinology",
      yearsOfExperience: 15,
      licenseNumber: "DOC001",
      consultationFee: 1500,
      rating: 4.8,
      type: "video",
      doctorCode: "DOC001",
      isDietician: false
    },
    {
      userId: doctors[1]?.id,
      specialty: "Internal Medicine",
      yearsOfExperience: 12,
      licenseNumber: "DOC002",
      consultationFee: 1200,
      rating: 4.7,
      type: "video",
      doctorCode: "DOC002",
      isDietician: false
    },
    {
      userId: doctors[2]?.id,
      specialty: "Cardiology",
      yearsOfExperience: 18,
      licenseNumber: "DOC003",
      consultationFee: 1800,
      rating: 4.9,
      type: "video",
      doctorCode: "DOC003",
      isDietician: false
    },
    {
      userId: doctors[3]?.id,
      specialty: "General Medicine",
      yearsOfExperience: 10,
      licenseNumber: "DOC004",
      consultationFee: 1000,
      rating: 4.6,
      type: "video",
      doctorCode: "DOC004",
      isDietician: false
    },
    {
      userId: doctors[4]?.id,
      specialty: "Diabetes Care",
      yearsOfExperience: 14,
      licenseNumber: "DOC005",
      consultationFee: 1400,
      rating: 4.8,
      type: "video",
      doctorCode: "DOC005",
      isDietician: false
    },
    {
      userId: doctors[5]?.id,
      specialty: "Endocrinology",
      yearsOfExperience: 16,
      licenseNumber: "DOC006",
      consultationFee: 1600,
      rating: 4.9,
      type: "video",
      doctorCode: "DOC006",
      isDietician: false
    },
    {
      userId: doctors[6]?.id,
      specialty: "Internal Medicine",
      yearsOfExperience: 13,
      licenseNumber: "DOC007",
      consultationFee: 1300,
      rating: 4.7,
      type: "video",
      doctorCode: "DOC007",
      isDietician: false
    },
  ];

  for (const profileData of doctorProfilesData) {
    if (profileData.userId) {
      await prisma.doctorProfile.upsert({
        where: { userId: profileData.userId },
        update: {},
        create: profileData,
      });
    }
  }
  console.log(`✅ ${doctorProfilesData.length} doctor profiles seeded`);

  // Seed Patient Profiles
  const patientProfilesData = [
    {
      userId: patients[0]?.id,
      age: 35,
      weight: 70.5,
      height: 170,
      gender: "Male",
      bloodGroup: "B+",
      allergies: "None",
      medicalHistory: "Type 2 Diabetes",
      emergencyContact: "+91-9876543210",
      dateOfBirth: new Date("1990-05-15"),
      address: "123 Main Street, Mumbai",
    },
    {
      userId: patients[1]?.id,
      age: 28,
      weight: 55.2,
      height: 160,
      gender: "Female",
      bloodGroup: "O+",
      allergies: "Penicillin",
      medicalHistory: "Gestational Diabetes",
      emergencyContact: "+91-9876543211",
      dateOfBirth: new Date("1995-08-22"),
      address: "456 Park Avenue, Delhi",
    },
    {
      userId: patients[2]?.id,
      age: 45,
      weight: 80.0,
      height: 175,
      gender: "Male",
      bloodGroup: "A+",
      allergies: "None",
      medicalHistory: "Type 1 Diabetes",
      emergencyContact: "+91-9876543212",
      dateOfBirth: new Date("1978-12-10"),
      address: "789 Lake Road, Bangalore",
    },
    {
      userId: patients[3]?.id,
      age: 32,
      weight: 62.5,
      height: 165,
      gender: "Female",
      bloodGroup: "AB+",
      allergies: "Sulfa drugs",
      medicalHistory: "Pre-diabetes",
      emergencyContact: "+91-9876543213",
      dateOfBirth: new Date("1991-03-18"),
      address: "321 Garden Street, Chennai",
    },
    {
      userId: patients[4]?.id,
      age: 50,
      weight: 75.8,
      height: 172,
      gender: "Male",
      bloodGroup: "B-",
      allergies: "None",
      medicalHistory: "Type 2 Diabetes, Hypertension",
      emergencyContact: "+91-9876543214",
      dateOfBirth: new Date("1973-11-05"),
      address: "654 River View, Hyderabad",
    },
  ];

  for (const profileData of patientProfilesData) {
    if (profileData.userId) {
      await prisma.patientProfile.upsert({
        where: { userId: profileData.userId },
        update: {},
        create: profileData,
      });
    }
  }
  console.log(`✅ ${patientProfilesData.length} patient profiles seeded`);

  // Seed Dietician Profiles (as DoctorProfile with isDietician flag)
  const dieticianProfilesData = [
    {
      userId: dieticians[0]?.id,
      specialty: "Diabetes Nutrition",
      yearsOfExperience: 8,
      licenseNumber: "DIET001",
      consultationFee: 800,
      rating: 4.7,
      type: "video",
      doctorCode: "DIET001",
      isDietician: true,
    },
    {
      userId: dieticians[1]?.id,
      specialty: "Clinical Nutrition",
      yearsOfExperience: 10,
      licenseNumber: "DIET002",
      consultationFee: 1000,
      rating: 4.8,
      type: "video",
      doctorCode: "DIET002",
      isDietician: true,
    },
  ];

  for (const profileData of dieticianProfilesData) {
    if (profileData.userId) {
      await prisma.doctorProfile.upsert({
        where: { userId: profileData.userId },
        update: {},
        create: profileData,
      });
    }
  }
  console.log(`✅ ${dieticianProfilesData.length} dietician profiles seeded (as doctor profiles)`);

  // Seed Lab Tech Profiles
  const labTechProfilesData = [
    {
      userId: labTechs[0]?.id,
      specialization: "Clinical Biochemistry",
    },
    {
      userId: labTechs[1]?.id,
      specialization: "Hematology",
    },
  ];

  for (const profileData of labTechProfilesData) {
    if (profileData.userId) {
      await prisma.labTechProfile.upsert({
        where: { userId: profileData.userId },
        update: {},
        create: profileData,
      });
    }
  }
  console.log(`✅ ${labTechProfilesData.length} lab tech profiles seeded`);

  // Seed Phlebotomist Profiles
  const phlebotomistProfilesData = [
    {
      userId: phlebotomists[0]?.id,
      employeeId: "PHLEB001",
      specialization: "Blood Collection",
      isAvailable: true,
      currentLocation: "Mumbai Central",
    },
    {
      userId: phlebotomists[1]?.id,
      employeeId: "PHLEB002",
      specialization: "Sample Collection",
      isAvailable: true,
      currentLocation: "Andheri West",
    },
    {
      userId: phlebotomists[2]?.id,
      employeeId: "PHLEB003",
      specialization: "Home Collection",
      isAvailable: false,
      currentLocation: "Bandra East",
    },
  ];

  for (const profileData of phlebotomistProfilesData) {
    if (profileData.userId) {
      await prisma.phlebotomist.upsert({
        where: { userId: profileData.userId },
        update: {},
        create: profileData,
      });
    }
  }
  console.log(`✅ ${phlebotomistProfilesData.length} phlebotomist profiles seeded`);
  
  // Return all created profiles for summary
  const allProfiles = [
    ...doctorProfilesData,
    ...patientProfilesData,
    ...dieticianProfilesData,
    ...labTechProfilesData,
    ...phlebotomistProfilesData
  ].filter(profile => profile.userId);
  
  return allProfiles;
}

module.exports = { seedUserProfiles }; 