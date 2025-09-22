const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Advanced seed data refresh utility
 * Provides granular control over date updates for different scenarios
 * Uses transactions for data consistency
 */
class SeedDataRefresher {
  constructor() {
    this.now = new Date();
    this.today = new Date(this.now.getFullYear(), this.now.getMonth(), this.now.getDate());
    this.stats = {
      appointments: 0,
      labBookings: 0,
      subscriptions: 0,
      payments: 0,
      prescriptions: 0,
      labAnalyses: 0,
      prescriptionTexts: 0,
      dietRequests: 0,
      users: 0,
      healthMetrics: 0,
      patientPills: 0,
      criticalLabResults: 0,
      suspendedUsers: 0,
      availabilityRecords: 0
    };
  }

  /**
   * Update appointments to be relevant for upcoming notifications
   */
  async refreshAppointments(tx) {
    console.log('\n📋 Refreshing appointments...');
    
    const appointments = await tx.appointment.findMany({
      include: {
        doctorAvailability: true
      }
    });

    const updatePromises = appointments.map(async (appointment) => {
      if (appointment.doctorAvailability) {
        // Create a mix of upcoming and recent appointments
        const isUpcoming = Math.random() > 0.7; // 30% upcoming, 70% recent
        
        let newDate;
        if (isUpcoming) {
          // Upcoming appointments (next 7 days)
          newDate = new Date(this.today);
          newDate.setDate(newDate.getDate() + Math.floor(Math.random() * 7));
        } else {
          // Recent appointments (last 30 days)
          newDate = new Date(this.today);
          newDate.setDate(newDate.getDate() - Math.floor(Math.random() * 30));
        }
        
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
              status: "SCHEDULED" // Ensure consistent status casing
            }
          })
        ]);
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
    
    this.stats.appointments = appointments.length;
    console.log(`✅ Updated ${appointments.length} appointments`);
  }

  /**
   * Update lab bookings for pending collections notification
   */
  async refreshLabBookings(tx) {
    console.log('\n🧪 Refreshing lab bookings...');
    
    const labBookings = await tx.labBooking.findMany();
    
    const updatePromises = labBookings.map(async (booking) => {
      // Mix of today's pending and upcoming bookings
      const isToday = Math.random() > 0.8; // 20% today, 80% upcoming
      
      let newDate;
      if (isToday) {
        newDate = new Date(this.today);
      } else {
        newDate = new Date(this.today);
        newDate.setDate(newDate.getDate() + Math.floor(Math.random() * 14));
      }
      
      return tx.labBooking.update({
        where: { id: booking.id },
        data: {
          labDate: newDate,
          createdAt: new Date(this.now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      });
    });

    await Promise.all(updatePromises);
    
    this.stats.labBookings = labBookings.length;
    console.log(`✅ Updated ${labBookings.length} lab bookings`);
  }

  /**
   * Update subscriptions for expiring notifications
   */
  async refreshSubscriptions(tx) {
    console.log('\n💳 Refreshing subscription trackers...');
    
    const subscriptions = await tx.subscriptionTracker.findMany();
    
    const updatePromises = subscriptions.map(async (subscription) => {
      const startDate = new Date(this.today);
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 60)); // Started within last 60 days
      
      // Mix of expiring soon and active subscriptions
      const isExpiringSoon = Math.random() > 0.7; // 30% expiring soon
      
      let endDate;
      if (isExpiringSoon) {
        // Expiring within 7 days
        endDate = new Date(this.today);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 7));
      } else {
        // Active for 30-90 days
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 30 + Math.floor(Math.random() * 60));
      }
      
      return tx.subscriptionTracker.update({
        where: { subscriptionId: subscription.subscriptionId },
        data: {
          startDate,
          endDate,
          createdAt: startDate,
          updatedAt: this.now
        }
      });
    });

    await Promise.all(updatePromises);
    
    this.stats.subscriptions = subscriptions.length;
    console.log(`✅ Updated ${subscriptions.length} subscription trackers`);
  }

  /**
   * Update payments for failed payment notifications
   */
  async refreshPayments(tx) {
    console.log('\n💰 Refreshing payments...');
    
    const payments = await tx.payment.findMany();
    
    const updatePromises = payments.map(async (payment) => {
      // Mix of recent failed payments and successful payments
      const isFailed = Math.random() > 0.8; // 20% failed payments
      
      const paymentDate = new Date(this.today);
      paymentDate.setDate(paymentDate.getDate() - Math.floor(Math.random() * 24)); // Last 24 hours for failed
      
      return tx.payment.update({
        where: { id: payment.id },
        data: {
          paymentStatus: isFailed ? 'FAILED' : 'SUCCESS',
          createdAt: paymentDate,
          updatedAt: this.now
        }
      });
    });

    await Promise.all(updatePromises);
    
    this.stats.payments = payments.length;
    console.log(`✅ Updated ${payments.length} payments`);
  }

  /**
   * Update users for new signup notifications
   */
  async refreshUsers(tx) {
    console.log('\n👥 Refreshing user creation dates...');
    
    const users = await tx.user.findMany({
      where: {
        role: 'PATIENT'
      }
    });
    
    const updatePromises = users.map(async (user) => {
      // Mix of new signups and existing users
      const isNewSignup = Math.random() > 0.8; // 20% new signups
      
      let userDate;
      if (isNewSignup) {
        // New signups in last 24 hours
        userDate = new Date(this.today);
        userDate.setDate(userDate.getDate() - Math.floor(Math.random() * 1));
      } else {
        // Existing users
        userDate = new Date(this.today);
        userDate.setDate(userDate.getDate() - Math.floor(Math.random() * 90));
      }
      
      return tx.user.update({
        where: { id: user.id },
        data: {
          createdAt: userDate,
          updatedAt: this.now
        }
      });
    });

    await Promise.all(updatePromises);
    
    this.stats.users = users.length;
    console.log(`✅ Updated ${users.length} user creation dates`);
  }

  /**
   * Update analysis data for system error notifications
   */
  async refreshAnalysisData(tx) {
    console.log('\n🔬 Refreshing analysis data...');
    
    // Update lab report analysis
    const labAnalyses = await tx.labReportAnalysis.findMany();
    
    const labUpdatePromises = labAnalyses.map(async (analysis) => {
      const isFailed = Math.random() > 0.9; // 10% failed analysis
      
      const analysisDate = new Date(this.today);
      analysisDate.setDate(analysisDate.getDate() - Math.floor(Math.random() * 24)); // Last 24 hours
      
      return tx.labReportAnalysis.update({
        where: { id: analysis.id },
        data: {
          processingStatus: isFailed ? 'FAILED' : 'COMPLETED',
          createdAt: analysisDate,
          processedAt: isFailed ? null : new Date(analysisDate.getTime() + Math.random() * 24 * 60 * 60 * 1000),
          updatedAt: this.now
        }
      });
    });

    await Promise.all(labUpdatePromises);
    this.stats.labAnalyses = labAnalyses.length;
    
    // Update prescription text analysis
    const prescriptionTexts = await tx.prescriptionText.findMany();
    
    const textUpdatePromises = prescriptionTexts.map(async (text) => {
      const isFailed = Math.random() > 0.9; // 10% failed analysis
      
      const textDate = new Date(this.today);
      textDate.setDate(textDate.getDate() - Math.floor(Math.random() * 24)); // Last 24 hours
      
      return tx.prescriptionText.update({
        where: { id: text.id },
        data: {
          processingStatus: isFailed ? 'FAILED' : 'COMPLETED',
          createdAt: textDate,
          updatedAt: this.now
        }
      });
    });

    await Promise.all(textUpdatePromises);
    this.stats.prescriptionTexts = prescriptionTexts.length;
    
    console.log(`✅ Updated ${labAnalyses.length} lab analyses and ${prescriptionTexts.length} prescription texts`);
  }

  /**
   * Update diet plan requests for pending requests notification
   */
  async refreshDietRequests(tx) {
    console.log('\n🥗 Refreshing diet plan requests...');
    
    const dietRequests = await tx.dietPlanRequest.findMany();
    
    const updatePromises = dietRequests.map(async (request) => {
      // Mix of pending and completed requests
      const isPending = Math.random() > 0.7; // 30% pending
      
      const requestDate = new Date(this.today);
      requestDate.setDate(requestDate.getDate() - Math.floor(Math.random() * 14)); // Last 14 days
      
      return tx.dietPlanRequest.update({
        where: { id: request.id },
        data: {
          status: isPending ? 'PENDING' : 'APPROVED',
          createdAt: requestDate,
          updatedAt: this.now
        }
      });
    });

    await Promise.all(updatePromises);
    
    this.stats.dietRequests = dietRequests.length;
    console.log(`✅ Updated ${dietRequests.length} diet plan requests`);
  }

  /**
   * Create critical lab results for high priority notifications
   */
  async createCriticalLabResults(tx) {
    console.log('\n🚨 Creating critical lab results...');
    
    // Get some lab bookings to create critical results for
    const labBookings = await tx.labBooking.findMany({
      take: 3 // Create 3 critical results
    });
    
    const criticalResults = [];
    
    for (let i = 0; i < labBookings.length; i++) {
      const booking = labBookings[i];
      
      // Check if analysis already exists for this booking
      const existingAnalysis = await tx.labReportAnalysis.findFirst({
        where: { labBookingId: booking.id }
      });
      
      if (!existingAnalysis) {
        // Create critical lab analysis with unique labResultIndex
        const criticalAnalysis = await tx.labReportAnalysis.create({
          data: {
            labBookingId: booking.id,
            labResultIndex: i, // Use index to ensure uniqueness
            processingStatus: 'COMPLETED',
            processedAt: new Date(this.now.getTime() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
            criticalValues: {
              "Blood Sugar": "350 mg/dL", // Critical high
              "Blood Pressure": "180/120 mmHg", // Critical high
              "Heart Rate": "120 bpm" // Elevated
            },
            llmSummary: "Critical values detected requiring immediate medical attention. Blood sugar is critically high at 350 mg/dL, blood pressure is elevated at 180/120 mmHg, and heart rate is elevated at 120 bpm. Contact healthcare provider immediately.",
            createdAt: new Date(this.now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
            updatedAt: this.now
          }
        });
        
        criticalResults.push(criticalAnalysis);
      }
    }
    
    this.stats.criticalLabResults = criticalResults.length;
    console.log(`✅ Created ${criticalResults.length} critical lab results`);
  }

  /**
   * Create suspended users for low priority notifications
   */
  async createSuspendedUsers(tx) {
    console.log('\n⏸️ Creating suspended users...');
    
    // Get some existing users to suspend
    const usersToSuspend = await tx.user.findMany({
      where: {
        role: 'PATIENT',
        status: 'ACTIVE'
      },
      take: 2 // Suspend 2 users
    });
    
    const suspendedUsers = [];
    
    for (const user of usersToSuspend) {
      const suspendedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          status: 'SUSPENDED',
          updatedAt: new Date(this.now.getTime() - Math.random() * 24 * 60 * 60 * 1000) // Suspended in last 24 hours
        }
      });
      
      suspendedUsers.push(suspendedUser);
    }
    
    this.stats.suspendedUsers = suspendedUsers.length;
    console.log(`✅ Suspended ${suspendedUsers.length} users`);
  }

  /**
   * Update all doctor availability dates to be current and relevant
   */
  async refreshDoctorAvailability(tx) {
    console.log('\n📅 Refreshing doctor availability dates...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get all availability records
    const allAvailabilities = await tx.doctorAvailability.findMany({
      select: {
        id: true,
        userId: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true
      }
    });
    
    console.log(`Found ${allAvailabilities.length} availability records`);
    
    // Separate past and future availability records
    const pastAvailabilities = allAvailabilities.filter(avail => 
      new Date(avail.date) < today
    );
    
    const futureAvailabilities = allAvailabilities.filter(avail => 
      new Date(avail.date) >= today
    );
    
    console.log(`Past availabilities: ${pastAvailabilities.length}, Future availabilities: ${futureAvailabilities.length}`);
    
    const updatePromises = [];
    
    // Update past availability records to be in the future (next 30 days)
    for (const avail of pastAvailabilities) {
      const futureDate = new Date(today);
      futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 30));
      
      updatePromises.push(
        tx.doctorAvailability.update({
          where: { id: avail.id },
          data: {
            date: futureDate,
            status: 'AVAILABLE' // Reset to available
          }
        })
      );
    }
    
    // Update future availability records to be more spread out (next 60 days)
    for (const avail of futureAvailabilities) {
      const newDate = new Date(today);
      newDate.setDate(newDate.getDate() + Math.floor(Math.random() * 60));
      
      updatePromises.push(
        tx.doctorAvailability.update({
          where: { id: avail.id },
          data: {
            date: newDate,
            status: Math.random() > 0.3 ? 'AVAILABLE' : 'BOOKED' // 70% available, 30% booked
          }
        })
      );
    }
    
    await Promise.all(updatePromises);
    
    this.stats.availabilityRecords = allAvailabilities.length;
    console.log(`✅ Updated ${allAvailabilities.length} availability records`);
    console.log(`   - Moved ${pastAvailabilities.length} past records to future dates`);
    console.log(`   - Refreshed ${futureAvailabilities.length} future records`);
  }

  /**
   * Main refresh function using transaction
   */
  async refreshAll() {
    console.log('🔄 Starting comprehensive seed data refresh...');
    console.log(`📅 Current date: ${this.today.toISOString()}`);
    
    try {
      // Use Prisma transaction for atomicity with extended timeout
      await prisma.$transaction(async (tx) => {
        console.log('🔒 Starting database transaction...');
        
        await this.refreshAppointments(tx);
        await this.refreshLabBookings(tx);
        await this.refreshSubscriptions(tx);
        await this.refreshPayments(tx);
        await this.refreshUsers(tx);
        await this.refreshAnalysisData(tx);
        await this.refreshDietRequests(tx);
        await this.refreshDoctorAvailability(tx);
        await this.createCriticalLabResults(tx);
        await this.createSuspendedUsers(tx);
        
        console.log('✅ All updates completed within transaction');
      }, {
        timeout: 30000 // 30 seconds timeout
      });
      
      console.log('\n📊 Refresh Summary:');
      console.log(`📋 Appointments: ${this.stats.appointments}`);
      console.log(`🧪 Lab Bookings: ${this.stats.labBookings}`);
      console.log(`💳 Subscriptions: ${this.stats.subscriptions}`);
      console.log(`💰 Payments: ${this.stats.payments}`);
      console.log(`👥 Users: ${this.stats.users}`);
      console.log(`🔬 Lab Analyses: ${this.stats.labAnalyses}`);
      console.log(`📄 Prescription Texts: ${this.stats.prescriptionTexts}`);
      console.log(`🥗 Diet Requests: ${this.stats.dietRequests}`);
      console.log(`📅 Availability Records: ${this.stats.availabilityRecords}`);
      console.log(`🚨 Critical Lab Results: ${this.stats.criticalLabResults}`);
      console.log(`⏸️ Suspended Users: ${this.stats.suspendedUsers}`);
      
      console.log('\n🎉 Seed data refresh completed successfully!');
      console.log('📅 All time-sensitive data has been updated to be relevant for current testing');
      console.log('🔄 Your notifications system will now show meaningful alerts');
      console.log('🔒 All updates were performed atomically within a transaction');
      
    } catch (error) {
      console.error('❌ Error during refresh:', error);
      console.error('🔄 Transaction rolled back - no changes were made to the database');
      throw error;
    }
  }
}

// Run the script
if (require.main === module) {
  const refresher = new SeedDataRefresher();
  
  refresher.refreshAll()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { SeedDataRefresher };
