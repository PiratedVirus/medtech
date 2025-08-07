async function seedClinics(prisma = require("@prisma/client").PrismaClient) {
  console.log("🏥 Seeding clinics and specializations...");

  // Seed Clinics
  const clinicsData = [
    {
      name: "Apollo Health",
      subdomain: "apollo",
      domain: "apollohealth.com",
      address: "123 Apollo Street, Mumbai",
      contactInfo: "020-123456",
    },
    {
      name: "Fortis Clinic",
      subdomain: "fortis",
      domain: "fortisclinic.in",
      address: "456 Fortis Road, Delhi",
      contactInfo: "011-987654",
    },
    {
      name: "Care Hospital",
      subdomain: "care",
      domain: "carehospital.in",
      address: "789 Care Avenue, Bangalore",
      contactInfo: "080-246810",
    },
    {
      name: "CareDiabetics",
      subdomain: "carediabetics",
      domain: "carediabetics.com",
      address: "CareDiabetics Healthcare, Mumbai",
      contactInfo: "+91-9876543210",
    },
  ];

  const clinics = [];
  for (const clinicData of clinicsData) {
    const clinic = await prisma.clinic.upsert({
      where: { name: clinicData.name },
      update: {},
      create: clinicData,
    });
    clinics.push(clinic);
  }
  console.log(`✅ ${clinics.length} clinics seeded`);

  // Seed Clinic Specializations
  const specializationsData = [
    { name: "Cardiology", clinicId: clinics[0].id },
    { name: "Dermatology", clinicId: clinics[0].id },
    { name: "Orthopedics", clinicId: clinics[1].id },
    { name: "Pediatrics", clinicId: clinics[1].id },
    { name: "Gynecology", clinicId: clinics[2].id },
    { name: "Endocrinology", clinicId: clinics[3].id },
    { name: "Diabetes Care", clinicId: clinics[3].id },
    { name: "Internal Medicine", clinicId: clinics[3].id },
    { name: "Cardiology", clinicId: clinics[3].id },
    { name: "General Medicine", clinicId: clinics[3].id },
  ];

  for (const specData of specializationsData) {
    // Check if specialization already exists
    const existingSpec = await prisma.clinicSpecialization.findFirst({
      where: {
        clinicId: specData.clinicId,
        name: specData.name,
      },
    });

    if (!existingSpec) {
      await prisma.clinicSpecialization.create({
        data: specData,
      });
    }
  }
  console.log(`✅ ${specializationsData.length} clinic specializations seeded`);

  return clinics;
}

module.exports = { seedClinics }; 