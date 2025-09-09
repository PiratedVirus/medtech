const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Add more notification types for comprehensive testing
 */
async function addMoreNotifications() {
  console.log('🔔 Adding more notification types...');
  
  try {
    await prisma.$transaction(async (tx) => {
      console.log('🔒 Starting database transaction...');
      
      // 1. Add a pending lab collection for today
      const labBooking = await tx.labBooking.findFirst();
      if (labBooking) {
        await tx.labBooking.update({
          where: { id: labBooking.id },
          data: {
            labDate: new Date(),
            status: 'PENDING'
          }
        });
        console.log('✅ Added pending lab collection for today');
      }
      
      // 2. Add a new signup in the last 24 hours
      const newUser = await tx.user.findFirst({
        where: { role: 'PATIENT' }
      });
      if (newUser) {
        await tx.user.update({
          where: { id: newUser.id },
          data: {
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          }
        });
        console.log('✅ Added new signup in last 24 hours');
      }
      
      // 3. Add a failed prescription analysis
      const prescriptionText = await tx.prescriptionText.findFirst();
      if (prescriptionText) {
        await tx.prescriptionText.update({
          where: { id: prescriptionText.id },
          data: {
            processingStatus: 'FAILED',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
          }
        });
        console.log('✅ Added failed prescription analysis');
      }
      
      // 4. Add a failed lab analysis
      const labAnalysis = await tx.labReportAnalysis.findFirst();
      if (labAnalysis) {
        await tx.labReportAnalysis.update({
          where: { id: labAnalysis.id },
          data: {
            processingStatus: 'FAILED',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
          }
        });
        console.log('✅ Added failed lab analysis');
      }
      
      // 5. Add an upcoming appointment for tomorrow
      const appointment = await tx.appointment.findFirst();
      if (appointment && appointment.doctorAvailability) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        await tx.doctorAvailability.update({
          where: { id: appointment.doctorAvailability.id },
          data: {
            date: tomorrow,
            startTime: '10:00',
            endTime: '11:00'
          }
        });
        
        await tx.appointment.update({
          where: { id: appointment.id },
          data: {
            doctorAvailability: { date: tomorrow }
          }
        });
        console.log('✅ Added upcoming appointment for tomorrow');
      }
      
      console.log('✅ All additional notifications added');
    });
    
    console.log('🎉 Additional notifications script completed!');
    
  } catch (error) {
    console.error('❌ Error adding notifications:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  addMoreNotifications()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addMoreNotifications };
