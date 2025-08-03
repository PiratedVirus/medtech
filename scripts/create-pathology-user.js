const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createPathologyUser() {
  try {
    console.log('🔧 Creating pathology user...');

    // Check if pathology user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        role: "PATHOLOGY",
      },
    });

    if (existingUser) {
      console.log('✅ Pathology user already exists:', existingUser.name);
      return existingUser;
    }

    // Create new pathology user
    const pathologyUser = await prisma.user.create({
      data: {
        phoneNumber: "+919421300875",
        email: "pathology@carediabetics.com",
        name: "Pathology Admin",
        role: "PATHOLOGY",
        status: "ACTIVE",
        password: await bcrypt.hash("password123", 10),
      },
    });

    console.log('✅ Created pathology user:', pathologyUser.name);
    console.log('📧 Email:', pathologyUser.email);
    console.log('📱 Phone:', pathologyUser.phoneNumber);
    console.log('🔑 Password: password123');

    return pathologyUser;
  } catch (error) {
    console.error('❌ Error creating pathology user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createPathologyUser()
  .then(() => {
    console.log('✅ Pathology user creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Pathology user creation failed:', error);
    process.exit(1);
  }); 