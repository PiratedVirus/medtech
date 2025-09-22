const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Updates all time-sensitive dates in the database to be relative to current date
 * This makes seed data always relevant for testing without deleting data
 * Uses transactions for data consistency
 */
async function updateSeedDates() {
  console.log('🔄 Starting seed date update process...');
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  console.log(`📅 Current date: ${today.toISOString()}`);
  
  try {
          // Use Prisma transaction for atomicity with extended timeout
      await prisma.$transaction(async (tx) => {
      console.log('🔒 Starting database transaction...');
      
      // 1. Update Appointments and DoctorAvailability
      console.log('\n📋 Updating appointments and doctor availability...');
      
      const appointments = await tx.appointment.findMany({
        include: {
          doctorAvailability: true
        }
      });
      
      const appointmentUpdates = appointments.map(async (appointment) => {
        if (appointment.doctorAvailability) {
          // Update doctor availability to today + random time
          const newDate = new Date(today);
          newDate.setDate(newDate.getDate() + Math.floor(Math.random() * 30)); // Next 30 days
          
                  const startHour = 9 + Math.floor(Math.random() * 8); // 9 AM to 5 PM
        const startMinute = Math.floor(Math.random() * 4) * 15; // 0, 15, 30, 45
        
        // Ensure 24-hour format
        const startTime = `${startHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
        const endHour = startHour + 1;
        const endTime = `${endHour.toString().padStart(2, '0')}:${startMinute.toString().padStart(2, '0')}`;
          
          return Promise.all([
            tx.doctorAvailability.update({
              where: { id: appointment.doctorAvailability.id },
              data: {
                date: newDate,
                startTime,
                endTime
              }
            }),
            tx.appointment.update({
              where: { id: appointment.id },
              data: {
                doctorAvailability: { date: newDate }
              }
            })
          ]);
        }
        return Promise.resolve();
      });
      
      await Promise.all(appointmentUpdates);
      console.log(`✅ Updated ${appointments.length} appointments`);
      
      // 2. Update Lab Bookings
      console.log('\n🧪 Updating lab bookings...');
      
      const labBookings = await tx.labBooking.findMany();
      
      const labBookingUpdates = labBookings.map(async (booking) => {
        const newDate = new Date(today);
        newDate.setDate(newDate.getDate() + Math.floor(Math.random() * 14)); // Next 14 days
        
        return tx.labBooking.update({
          where: { id: booking.id },
          data: {
            labDate: newDate,
            createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time in last 7 days
          }
        });
      });
      
      await Promise.all(labBookingUpdates);
      console.log(`✅ Updated ${labBookings.length} lab bookings`);
      
      // 3. Update Subscription Trackers
      console.log('\n💳 Updating subscription trackers...');
      
      const subscriptions = await tx.subscriptionTracker.findMany();
      
      const subscriptionUpdates = subscriptions.map(async (subscription) => {
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30)); // Started within last 30 days
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30 + Math.floor(Math.random() * 60)); // 30-90 days duration
        
        return tx.subscriptionTracker.update({
          where: { subscriptionId: subscription.subscriptionId },
          data: {
            startDate,
            endDate,
            createdAt: startDate,
            updatedAt: now
          }
        });
      });
      
      await Promise.all(subscriptionUpdates);
      console.log(`✅ Updated ${subscriptions.length} subscription trackers`);
      
      // 4. Update Payments
      console.log('\n💰 Updating payments...');
      
      const payments = await tx.payment.findMany();
      
      const paymentUpdates = payments.map(async (payment) => {
        const paymentDate = new Date(today);
        paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
        
        return tx.payment.update({
          where: { id: payment.id },
          data: {
            createdAt: paymentDate,
            updatedAt: now
          }
        });
      });
      
      await Promise.all(paymentUpdates);
      console.log(`✅ Updated ${payments.length} payments`);
      
      // 5. Update Prescriptions
      console.log('\n💊 Updating prescriptions...');
      
      const prescriptions = await tx.prescription.findMany();
      
      const prescriptionUpdates = prescriptions.map(async (prescription) => {
        const prescriptionDate = new Date(today);
        prescriptionDate.setDate(prescriptionDate.getDate() - Math.floor(Math.random() * 60)); // Last 60 days
        
        return tx.prescription.update({
          where: { id: prescription.id },
          data: {
            createdAt: prescriptionDate,
            updatedAt: now
          }
        });
      });
      
      await Promise.all(prescriptionUpdates);
      console.log(`✅ Updated ${prescriptions.length} prescriptions`);
      
      // 6. Update Lab Report Analysis
      console.log('\n🔬 Updating lab report analysis...');
      
      const labAnalyses = await tx.labReportAnalysis.findMany();
      
      const labAnalysisUpdates = labAnalyses.map(async (analysis) => {
        const analysisDate = new Date(today);
        analysisDate.setDate(analysisDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
        
        return tx.labReportAnalysis.update({
          where: { id: analysis.id },
          data: {
            createdAt: analysisDate,
            processedAt: new Date(analysisDate.getTime() + Math.random() * 24 * 60 * 60 * 1000), // Same day or next day
            updatedAt: now
          }
        });
      });
      
      await Promise.all(labAnalysisUpdates);
      console.log(`✅ Updated ${labAnalyses.length} lab report analyses`);
      
      // 7. Update Prescription Text Analysis
      console.log('\n📄 Updating prescription text analysis...');
      
      const prescriptionTexts = await tx.prescriptionText.findMany();
      
      const prescriptionTextUpdates = prescriptionTexts.map(async (text) => {
        const textDate = new Date(today);
        textDate.setDate(textDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
        
        return tx.prescriptionText.update({
          where: { id: text.id },
          data: {
            createdAt: textDate,
            updatedAt: now
          }
        });
      });
      
      await Promise.all(prescriptionTextUpdates);
      console.log(`✅ Updated ${prescriptionTexts.length} prescription text analyses`);
      
      // 8. Update Diet Plan Requests
      console.log('\n🥗 Updating diet plan requests...');
      
      const dietRequests = await tx.dietPlanRequest.findMany();
      
      const dietRequestUpdates = dietRequests.map(async (request) => {
        const requestDate = new Date(today);
        requestDate.setDate(requestDate.getDate() - Math.floor(Math.random() * 14)); // Last 14 days
        
        return tx.dietPlanRequest.update({
          where: { id: request.id },
          data: {
            createdAt: requestDate,
            updatedAt: now
          }
        });
      });
      
      await Promise.all(dietRequestUpdates);
      console.log(`✅ Updated ${dietRequests.length} diet plan requests`);
      
      // 9. Update User creation dates (for new signups notification)
      console.log('\n👥 Updating user creation dates...');
      
      const users = await tx.user.findMany({
        where: {
          role: 'PATIENT'
        }
      });
      
      const userUpdates = users.map(async (user) => {
        const userDate = new Date(today);
        userDate.setDate(userDate.getDate() - Math.floor(Math.random() * 7)); // Last 7 days for "new signups"
        
        return tx.user.update({
          where: { id: user.id },
          data: {
            createdAt: userDate,
            updatedAt: now
          }
        });
      });
      
      await Promise.all(userUpdates);
      console.log(`✅ Updated ${users.length} user creation dates`);
      
      // 10. Update Health Metrics
      console.log('\n📊 Updating health metrics...');
      
      const healthMetrics = await tx.healthMetric.findMany();
      
      const healthMetricUpdates = healthMetrics.map(async (metric) => {
        const metricDate = new Date(today);
        metricDate.setDate(metricDate.getDate() - Math.floor(Math.random() * 7)); // Last 7 days
        
        return tx.healthMetric.update({
          where: { id: metric.id },
          data: {
            recordedAt: metricDate,
            createdAt: metricDate,
            updatedAt: now
          }
        });
      });
      
      await Promise.all(healthMetricUpdates);
      console.log(`✅ Updated ${healthMetrics.length} health metrics`);
      
      // 11. Update Patient Pills
      console.log('\n💊 Updating patient pills...');
      
      const patientPills = await tx.patientPill.findMany();
      
      const patientPillUpdates = patientPills.map(async (pill) => {
        const pillDate = new Date(today);
        pillDate.setDate(pillDate.getDate() - Math.floor(Math.random() * 7)); // Last 7 days
        
        return tx.patientPill.update({
          where: { id: pill.id },
          data: {
            createdAt: pillDate,
            updatedAt: now
          }
        });
      });
      
      await Promise.all(patientPillUpdates);
      console.log(`✅ Updated ${patientPills.length} patient pills`);
      
      console.log('✅ All updates completed within transaction');
    }, {
      timeout: 30000 // 30 seconds timeout
    });
    
    console.log('\n🎉 Seed date update completed successfully!');
    console.log('📅 All time-sensitive data has been updated to be relative to current date');
    console.log('🔄 Your test data is now fresh and relevant for development');
    console.log('🔒 All updates were performed atomically within a transaction');
    
  } catch (error) {
    console.error('❌ Error updating seed dates:', error);
    console.error('🔄 Transaction rolled back - no changes were made to the database');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  updateSeedDates()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateSeedDates };
