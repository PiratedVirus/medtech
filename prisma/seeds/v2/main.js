const { PrismaClient, UserRole, UserStatus, LabAssignmentStatus, ComplaintSeverity } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Check for --start-fresh flag
  const shouldStartFresh = process.argv.includes('--start-fresh');
  
  if (shouldStartFresh) {
    console.log("🧹 --start-fresh flag detected");
    console.log("🗑️  Cleaning database before seeding...");
    
    const { cleanDatabase } = require('../../../scripts/clean-database.js');
    await cleanDatabase();
    
    console.log("✅ Database cleaned, proceeding with seeding...\n");
  }
  
  console.log("🌱 Starting comprehensive database seeding...");
  console.log("⚠️  This will run in a transaction - if any step fails, all changes will be rolled back");
  console.log("⏱️  Estimated time: 2-5 minutes depending on data size");
  
  const startTime = Date.now();
  
  try {
    // Wrap everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      console.log("\n🔄 Starting transaction...");
      
      // 1. Seed Clinics and Specializations
      console.log("\n🏥 Step 1/16: Seeding clinics and specializations...");
      const { seedClinics } = require('./clinics');
      const clinics = await seedClinics(tx);
      
      // 2. Seed Lab Packages (from SQL data)
      console.log("\n🧪 Step 2/16: Seeding lab packages...");
      const { seedLabPackages } = require('./labPackages');
      const labPackages = await seedLabPackages(tx);
      
      // 3. Seed Plans and Plan Features
      console.log("\n📋 Step 3/16: Seeding plans and plan features...");
      const { seedPlans } = require('./plans');
      const plans = await seedPlans(tx);
      
      // 4. Seed Users (Doctors, Patients, Dieticians, Lab Techs, Pathology, Phlebotomists)
      console.log("\n👥 Step 4/16: Seeding users...");
      const { seedUsers } = require('./users');
      const users = await seedUsers(tx, clinics);
      
      // 5. Seed User Profiles
      console.log("\n👤 Step 5/16: Seeding user profiles...");
      const { seedUserProfiles } = require('./userProfiles');
      const userProfiles = await seedUserProfiles(tx);
      
      // 6. Seed Pathology Data
      console.log("\n🏥 Step 6/16: Seeding pathology data...");
      const { seedPathologyData } = require('./pathology');
      const pathologyData = await seedPathologyData(tx);
      
      // 7. Seed Lab Tests
      console.log("\n🔬 Step 7/16: Seeding lab tests...");
      const { seedLabTests } = require('./labTests');
      const labTests = await seedLabTests(tx);
      
      // 8. Seed Medicines and Complaints
      console.log("\n💊 Step 8/16: Seeding medicines and complaints...");
      const { seedMedicinesAndComplaints } = require('./medicines');
      const medicinesData = await seedMedicinesAndComplaints(tx);
      
      // 9. Seed Common Values
      console.log("\n📝 Step 9/16: Seeding common values...");
      const { seedCommonValues } = require('./commonValues');
      const commonValues = await seedCommonValues(tx);
      
      // 10. Seed Appointments and Availability
      console.log("\n📅 Step 10/16: Seeding appointments and availability...");
      const { seedAppointments } = require('./appointments');
      const appointmentsData = await seedAppointments(tx);
      
      // 11. Seed Lab Bookings and Assignments
      console.log("\n🔬 Step 11/16: Seeding lab bookings and assignments...");
      const { seedLabBookings } = require('./labBookings');
      const labBookings = await seedLabBookings(tx);
      
      // 12. Seed Health Metrics
      console.log("\n📊 Step 12/16: Seeding health metrics...");
      const { seedHealthMetrics } = require('./healthMetrics');
      const healthMetrics = await seedHealthMetrics(tx);
      
      // 13. Seed Prescription Data
      console.log("\n📋 Step 13/16: Seeding prescription data...");
      const { seedPrescriptionData } = require('./prescriptions');
      const prescriptionData = await seedPrescriptionData(tx);
      
      // 14. Seed Prescription Templates
      console.log("\n📋 Step 14/16: Seeding prescription templates...");
      const { seedPrescriptionTemplates } = require('./prescriptionTemplates');
      const prescriptionTemplates = await seedPrescriptionTemplates(tx);
      
      // 15. Seed Subscription Trackers
      console.log("\n📊 Step 15/16: Seeding subscription trackers...");
      const { seedSubscriptionTrackers } = require('./subscriptionTrackers');
      const subscriptionTrackers = await seedSubscriptionTrackers(tx);
      
      // 16. Seed Payments
      console.log("\n💰 Step 16/16: Seeding payments...");
      const { seedPayments } = require('./payments');
      const payments = await seedPayments(tx);
      
      // 17. Seed default LLM Playground profile
      console.log("\n🤖 Step 17/19: Seeding LLM Playground default profile...");
      const { seedLlmPlaygroundProfile } = require('./llmPlaygroundProfile');
      await seedLlmPlaygroundProfile(tx);

      // 18. Seed Meal Timing Templates
      console.log("\n🍽️ Step 18/19: Seeding meal timing templates...");
      const { seedMealTimings } = require('./mealTimings');
      const mealTimings = await seedMealTimings(tx);

      // 19. Comprehensive Seed (ensure all tables are populated)
      console.log("\n🔧 Step 19/19: Running comprehensive seed...");
      const { comprehensiveSeed } = require('./comprehensiveSeed');
      await comprehensiveSeed(tx);
      
      console.log("\n✅ All seeding steps completed successfully!");
      
      return {
        clinics,
        labPackages,
        plans,
        users,
        userProfiles,
        pathologyData,
        labTests,
        medicinesData,
        commonValues,
        appointmentsData,
        labBookings,
        healthMetrics,
        prescriptionData,
        prescriptionTemplates,
        subscriptionTrackers,
        payments,
        mealTimings
      };
    }, {
      timeout: 300000, // 5 minutes timeout
      maxWait: 60000,  // 1 minute max wait
    });
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log("\n🎉 SEEDING COMPLETED SUCCESSFULLY!");
    console.log(`⏱️  Total time: ${duration} seconds`);
    console.log("✅ All data has been seeded in a single transaction");
    console.log("🔄 If any step had failed, all changes would have been rolled back");
    
    // Summary
    console.log("\n📊 SEEDING SUMMARY:");
    console.log(`🏥 Clinics: ${result.clinics?.length || 0}`);
    console.log(`🧪 Lab Packages: ${result.labPackages?.length || 0}`);
    console.log(`📋 Plans: ${result.plans?.length || 0}`);
    console.log(`👥 Users: ${result.users?.length || 0}`);
    console.log(`👤 User Profiles: ${result.userProfiles?.length || 0}`);
    console.log(`🔬 Lab Tests: ${result.labTests?.length || 0}`);
    console.log(`💊 Medicines: ${result.medicinesData?.medicines?.length || 0}`);
    console.log(`📅 Appointments: ${result.appointmentsData?.appointments?.length || 0}`);
    console.log(`🔬 Lab Bookings: ${result.labBookings?.labBookings?.length || 0}`);
    console.log(`📊 Health Metrics: ${result.healthMetrics?.length || 0}`);
    console.log(`📋 Prescriptions: ${result.prescriptionData?.length || 0}`);
    console.log(`📋 Prescription Templates: ${result.prescriptionTemplates?.length || 0}`);
    console.log(`📊 Subscription Trackers: ${result.subscriptionTrackers?.length || 0}`);
    console.log(`💰 Payments: ${result.payments?.length || 0}`);
    console.log(`🍽️ Meal Timing Templates: ${result.mealTimings?.length || 0}`);
    console.log(`🔧 Comprehensive seed completed successfully`);
    
  } catch (error) {
    console.error("\n❌ ERROR DURING SEEDING:");
    console.error("The transaction has been rolled back - no data was saved");
    console.error("Error details:", error.message);
    
    if (error.code === 'P2002') {
      console.error("💡 This appears to be a duplicate key error. The data might already exist.");
      console.error("💡 Try running: npm run seed -- --start-fresh");
    }
    
    if (error.code === 'P2024') {
      console.error("💡 This appears to be a timeout error. The operation took too long.");
      console.error("💡 Try running the seed again or check your database connection.");
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Import all seed functions
const { seedClinics } = require('./clinics');
const { seedLabPackages } = require('./labPackages');
const { seedPlans } = require('./plans');
const { seedUsers } = require('./users');
const { seedUserProfiles } = require('./userProfiles');
const { seedPathologyData } = require('./pathology');
const { seedLabTests } = require('./labTests');
const { seedMedicinesAndComplaints } = require('./medicines');
const { seedCommonValues } = require('./commonValues');
const { seedAppointments } = require('./appointments');
const { seedLabBookings } = require('./labBookings');
const { seedHealthMetrics } = require('./healthMetrics');
const { seedPrescriptionData } = require('./prescriptions');
const { seedPrescriptionTemplates } = require('./prescriptionTemplates');
const { seedSubscriptionTrackers } = require('./subscriptionTrackers');
const { seedPayments } = require('./payments');
const { seedMealTimings } = require('./mealTimings');
const { comprehensiveSeed } = require('./comprehensiveSeed');

main()
  .catch((e) => {
    console.error("\n💥 FATAL ERROR:");
    console.error(e);
    process.exit(1);
  }); 