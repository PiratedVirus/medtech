const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearDeviceTokens() {
  try {
    console.log('🧹 Clearing old device tokens...');
    
    const result = await prisma.patientDeviceToken.deleteMany({
      where: {
        platform: 'web'
      }
    });
    
    console.log(`✅ Cleared ${result.count} device tokens`);
    console.log('📱 Now re-enable push notifications in your browser');
    
  } catch (error) {
    console.error('❌ Error clearing device tokens:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDeviceTokens();
