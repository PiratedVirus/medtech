const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateLabAnalysisSchema() {
  try {
    console.log('Starting LabReportAnalysis schema migration...');

    // Step 0: Check current database state
    console.log('Step 0: Checking current database state...');
    try {
      const result = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'LabReportAnalysis' 
        ORDER BY ordinal_position
      `;
      console.log('Current columns:', result);
    } catch (error) {
      console.log('Could not check columns:', error.message);
    }

    // Step 1: Drop the existing unique constraint on labBookingId if it exists
    console.log('Step 1: Dropping unique constraint on labBookingId...');
    try {
      await prisma.$executeRaw`ALTER TABLE "LabReportAnalysis" DROP CONSTRAINT IF EXISTS "LabReportAnalysis_labBookingId_key"`;
      console.log('Successfully dropped labBookingId unique constraint');
    } catch (error) {
      console.log('Note: labBookingId unique constraint was already dropped or didn\'t exist');
    }
    
    // Step 2: Add the new labResultIndex column if it doesn't exist
    console.log('Step 2: Adding labResultIndex column...');
    try {
      await prisma.$executeRaw`ALTER TABLE "LabReportAnalysis" ADD COLUMN "labResultIndex" INTEGER NOT NULL DEFAULT 0`;
      console.log('Successfully added labResultIndex column');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Note: labResultIndex column already exists');
      } else {
        throw error;
      }
    }
    
    // Step 3: Create the new composite unique constraint if it doesn't exist
    console.log('Step 3: Creating composite unique constraint...');
    try {
      await prisma.$executeRaw`ALTER TABLE "LabReportAnalysis" ADD CONSTRAINT "LabReportAnalysis_labBookingId_labResultIndex_key" UNIQUE ("labBookingId", "labResultIndex")`;
      console.log('Successfully created composite unique constraint');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('Note: Composite unique constraint already exists');
      } else {
        throw error;
      }
    }
    
    // Step 4: Update existing records to have labResultIndex = 0
    console.log('Step 4: Updating existing records...');
    try {
      const updateResult = await prisma.$executeRaw`UPDATE "LabReportAnalysis" SET "labResultIndex" = 0 WHERE "labResultIndex" IS NULL`;
      console.log(`Updated ${updateResult} records`);
    } catch (error) {
      console.log('Note: No records needed updating or error occurred:', error.message);
    }
    
    // Step 5: Verify the final state
    console.log('Step 5: Verifying final database state...');
    try {
      const finalResult = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'LabReportAnalysis' 
        ORDER BY ordinal_position
      `;
      console.log('Final columns:', finalResult);
      
      const constraintResult = await prisma.$queryRaw`
        SELECT constraint_name, constraint_type
        FROM information_schema.table_constraints 
        WHERE table_name = 'LabReportAnalysis'
      `;
      console.log('Final constraints:', constraintResult);
    } catch (error) {
      console.log('Could not verify final state:', error.message);
    }
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateLabAnalysisSchema()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
