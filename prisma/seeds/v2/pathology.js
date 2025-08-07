const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedPathologyData() {
  console.log("🏥 Seeding pathology data...");

  // Create Pathology Lab
  const existingLab = await prisma.pathologyLab.findFirst({
    where: { licenseNumber: "PATH-2024-001" },
  });

  let pathologyLab;
  if (!existingLab) {
    pathologyLab = await prisma.pathologyLab.create({
      data: {
        name: "CareDiabetics Pathology Lab",
        address: "123 Healthcare Street, Medical District, Mumbai, Maharashtra 400001",
        contactNumber: "+91-9876543210",
        email: "lab@carediabetics.com",
        licenseNumber: "PATH-2024-001",
        isActive: true,
      },
    });
  } else {
    pathologyLab = existingLab;
  }
  console.log(`✅ Pathology lab created: ${pathologyLab.name}`);

  return pathologyLab;
}

module.exports = { seedPathologyData }; 