const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanDatabase() {
  console.log("🧹 Starting database cleanup...");
  console.log("⚠️  This will DELETE ALL DATA from the database!");
  console.log("⚠️  This action cannot be undone!");
  
  try {
    // Disable foreign key checks temporarily (if supported)
    console.log("🔄 Disabling foreign key checks...");
    
    // Delete in reverse order of dependencies to avoid constraint violations
    console.log("🗑️  Deleting data in dependency order...");
    
    // 1. Delete data that depends on other tables first
    console.log("📋 Step 1: Deleting prescription-related data...");
    await prisma.prescriptionMedicine.deleteMany({});
    await prisma.prescriptionSystemicExamination.deleteMany({});
    await prisma.prescriptionHistory.deleteMany({});
    await prisma.prescriptionVitals.deleteMany({});
    await prisma.prescriptionComplaint.deleteMany({});
    await prisma.prescription.deleteMany({});
    
    console.log("📋 Step 2: Deleting prescription templates...");
    await prisma.templateMedicine.deleteMany({});
    await prisma.templateComplaint.deleteMany({});
    await prisma.prescriptionTemplate.deleteMany({});
    
    console.log("💰 Step 3: Deleting payments...");
    await prisma.payment.deleteMany({});
    
    console.log("📋 Step 3.5: Deleting appointment reports...");
    await prisma.appointmentReport.deleteMany({});
    
    console.log("📅 Step 4: Deleting appointments...");
    await prisma.appointment.deleteMany({});
    
    console.log("📊 Step 5: Deleting subscription trackers...");
    await prisma.subscriptionTracker.deleteMany({});
    
    console.log("🔬 Step 6: Deleting lab-related data...");
    await prisma.testResult.deleteMany({});
    await prisma.labAssignment.deleteMany({});
    await prisma.labBooking.deleteMany({});
    
    console.log("📊 Step 7: Deleting health metrics...");
    await prisma.healthMetric.deleteMany({});
    
    console.log("📅 Step 8: Deleting doctor availability...");
    await prisma.doctorAvailability.deleteMany({});
    
    console.log("👤 Step 9: Deleting user profiles...");
    await prisma.patientProfile.deleteMany({});
    await prisma.doctorProfile.deleteMany({});
    await prisma.dieticianProfile.deleteMany({});
    await prisma.labTechProfile.deleteMany({});
    await prisma.phlebotomist.deleteMany({});
    
    console.log("👥 Step 10: Deleting users...");
    await prisma.user.deleteMany({});
    
    console.log("🔬 Step 11: Deleting lab tests...");
    await prisma.labTest.deleteMany({});
    
    console.log("🏥 Step 12: Deleting pathology labs...");
    await prisma.pathologyLab.deleteMany({});
    
    console.log("💊 Step 13: Deleting medicines and complaints...");
    await prisma.medicine.deleteMany({});
    await prisma.complaint.deleteMany({});
    
    console.log("📝 Step 14: Deleting common values...");
    await prisma.commonValue.deleteMany({});
    
    console.log("📋 Step 15: Deleting plan features...");
    await prisma.planFeature.deleteMany({});
    
    console.log("📋 Step 16: Deleting plans...");
    await prisma.plan.deleteMany({});
    
    console.log("🧪 Step 17: Deleting lab packages...");
    await prisma.labPackage.deleteMany({});
    
    console.log("🏥 Step 18: Deleting clinic specializations...");
    await prisma.clinicSpecialization.deleteMany({});
    
    console.log("🏥 Step 19: Deleting clinics...");
    await prisma.clinic.deleteMany({});
    
    // Reset auto-increment sequences (PostgreSQL)
    console.log("🔄 Resetting auto-increment sequences...");
    await prisma.$executeRawUnsafe(`
      DO $$ 
      DECLARE 
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'ALTER SEQUENCE IF EXISTS "' || r.tablename || '_id_seq" RESTART WITH 1';
        END LOOP;
      END $$;
    `);
    
    console.log("✅ Database cleanup completed successfully!");
    console.log("🗑️  All data has been deleted and sequences reset");
    
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// If this script is run directly
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      console.log("🎉 Database cleanup finished!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Database cleanup failed:", error);
      process.exit(1);
    });
}

module.exports = { cleanDatabase }; 