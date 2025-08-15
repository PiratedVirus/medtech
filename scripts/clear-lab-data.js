const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearLabData() {
  try {
    console.log('🔍 Checking current database state...');
    
    // Get current counts
    const labBookingsCount = await prisma.labBooking.count();
    const labReportAnalysesCount = await prisma.labReportAnalysis.count();
    const activeLabReportAnalysesCount = await prisma.labReportAnalysis.count({
      where: { deletedAt: null }
    });
    const reportTrendDataCount = await prisma.reportTrendData.count();
    const labAssignmentsCount = await prisma.labAssignment.count();
    const testResultsCount = await prisma.testResult.count();
    
    console.log(`📊 Current Data Counts:`);
    console.log(`   Lab Bookings: ${labBookingsCount}`);
    console.log(`   Lab Report Analyses (Total): ${labReportAnalysesCount}`);
    console.log(`   Lab Report Analyses (Active): ${activeLabReportAnalysesCount}`);
    console.log(`   Report Trend Data: ${reportTrendDataCount}`);
    console.log(`   Lab Assignments: ${labAssignmentsCount}`);
    console.log(`   Test Results: ${testResultsCount}`);
    
    if (labBookingsCount === 0 && labReportAnalysesCount === 0 && reportTrendDataCount === 0 && labAssignmentsCount === 0 && testResultsCount === 0) {
      console.log('✅ No lab data found to clear.');
      return;
    }
    
    // Safety confirmation
    console.log('\n⚠️  WARNING: This will permanently delete lab data!');
    console.log('Choose an option:');
    console.log('1. Soft delete (mark as deleted but keep in database)');
    console.log('2. Hard delete (permanently remove from database)');
    console.log('3. View data before deletion');
    console.log('4. Cancel');
    
    // In a real script, you'd use readline or similar for user input
    // For now, we'll use a command line argument
    const option = process.argv[2] || '1';
    
    console.log(`\nSelected option: ${option}`);
    
    switch (option) {
      case '1':
        await softDeleteLabData();
        break;
      case '2':
        await hardDeleteLabData();
        break;
      case '3':
        await viewLabData();
        break;
      case '4':
        console.log('❌ Operation cancelled.');
        return;
      default:
        console.log('❌ Invalid option. Using soft delete (option 1).');
        await softDeleteLabData();
    }
    
    console.log('\n✅ Operation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function softDeleteLabData() {
  console.log('\n🔄 Starting soft delete...');
  
  // Soft delete in correct order due to foreign key constraints
  // 1. First soft delete TestResult (references LabAssignment)
  const testResultsResult = await prisma.testResult.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: new Date() }
  });
  console.log(`   ✅ Soft deleted ${testResultsResult.count} test results`);
  
  // 2. Then soft delete LabAssignment (references LabBooking)
  const assignmentsResult = await prisma.labAssignment.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: new Date() }
  });
  console.log(`   ✅ Soft deleted ${assignmentsResult.count} lab assignments`);
  
  // 3. Then soft delete LabReportAnalysis (references LabBooking)
  const analysesResult = await prisma.labReportAnalysis.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: new Date() }
  });
  console.log(`   ✅ Soft deleted ${analysesResult.count} lab report analyses`);
  
  // 4. Finally soft delete LabBooking
  const bookingsResult = await prisma.labBooking.updateMany({
    where: { deletedAt: null },
    data: { deletedAt: new Date() }
  });
  console.log(`   ✅ Soft deleted ${bookingsResult.count} lab bookings`);
  
  console.log('   💡 Data is marked as deleted but preserved in database');
  console.log('   💡 To view soft-deleted data, use: WHERE deletedAt IS NOT NULL');
  console.log('   💡 To restore soft-deleted data, set deletedAt to NULL');
}

async function hardDeleteLabData() {
  console.log('\n🗑️  Starting hard delete...');
  
  // Delete in correct order due to foreign key constraints
  // 1. First delete TestResult (references LabAssignment)
  const testResultsResult = await prisma.testResult.deleteMany({});
  console.log(`   ✅ Deleted ${testResultsResult.count} test results`);
  
  // 2. Then delete ReportTrendData (references LabBooking and LabReportAnalysis)
  const trendDataResult = await prisma.reportTrendData.deleteMany({});
  console.log(`   ✅ Deleted ${trendDataResult.count} report trend data entries`);
  
  // 3. Then delete lab report analyses
  const analysesResult = await prisma.labReportAnalysis.deleteMany({});
  console.log(`   ✅ Deleted ${analysesResult.count} lab report analyses`);
  
  // 4. Then delete LabAssignment (references LabBooking)
  const assignmentsResult = await prisma.labAssignment.deleteMany({});
  console.log(`   ✅ Deleted ${assignmentsResult.count} lab assignments`);
  
  // 3. Finally delete lab bookings
  const bookingsResult = await prisma.labBooking.deleteMany({});
  console.log(`   ✅ Deleted ${bookingsResult.count} lab bookings`);
  
  console.log('   ⚠️  All lab data has been permanently removed!');
}

async function viewLabData() {
  console.log('\n📋 Viewing lab data...');
  
  // Get sample lab bookings
  const sampleBookings = await prisma.labBooking.findMany({
    take: 5,
    include: {
      labPackage: true,
      patient: { select: { name: true, email: true } }
    }
  });
  
  console.log('\n📋 Sample Lab Bookings:');
  sampleBookings.forEach((booking, index) => {
    console.log(`   ${index + 1}. ID: ${booking.id}`);
    console.log(`      Package: ${booking.labPackage?.name || 'Unknown'}`);
    console.log(`      Patient: ${booking.patient?.name || 'Unknown'} (${booking.patient?.email || 'No email'})`);
    console.log(`      Date: ${booking.labDate}`);
    console.log(`      Results: ${Array.isArray(booking.labResult) ? booking.labResult.length : 'Single'}`);
    console.log('');
  });
  
  // Get sample analyses
  const sampleAnalyses = await prisma.labReportAnalysis.findMany({
    take: 5,
    where: { deletedAt: null },
    include: {
      labBooking: {
        include: { labPackage: true }
      }
    }
  });
  
  console.log('📋 Sample Lab Report Analyses:');
  sampleAnalyses.forEach((analysis, index) => {
    console.log(`   ${index + 1}. ID: ${analysis.id}`);
    console.log(`      Lab Booking: ${analysis.labBookingId}`);
    console.log(`      Package: ${analysis.labBooking?.labPackage?.name || 'Unknown'}`);
    console.log(`      Result Index: ${analysis.labResultIndex}`);
    console.log(`      Status: ${analysis.processingStatus}`);
    console.log(`      Created: ${analysis.createdAt}`);
    console.log('');
  });
  
  // Get sample lab assignments
  const sampleAssignments = await prisma.labAssignment.findMany({
    take: 5,
    include: {
      lab: { select: { name: true } },
      patient: { select: { name: true } },
      phlebotomist: { select: { name: true } }
    }
  });
  
  console.log('\n📋 Sample Lab Assignments:');
  sampleAssignments.forEach((assignment, index) => {
    console.log(`   ${index + 1}. ID: ${assignment.id}`);
    console.log(`      Lab: ${assignment.lab?.name || 'Unknown'}`);
    console.log(`      Patient: ${assignment.patient?.name || 'Unknown'}`);
    console.log(`      Phlebotomist: ${assignment.phlebotomist?.name || 'Unknown'}`);
    console.log(`      Status: ${assignment.status}`);
    console.log(`      Date: ${assignment.assignedDate}`);
    console.log('');
  });
  
  // Get sample test results
  const sampleTestResults = await prisma.testResult.findMany({
    take: 5,
    include: {
      labTest: { select: { name: true, code: true } },
      labAssignment: {
        include: {
          patient: { select: { name: true } }
        }
      }
    }
  });
  
  console.log('📋 Sample Test Results:');
  sampleTestResults.forEach((result, index) => {
    console.log(`   ${index + 1}. ID: ${result.id}`);
    console.log(`      Test: ${result.labTest?.name || 'Unknown'} (${result.labTest?.code || 'No code'})`);
    console.log(`      Patient: ${result.labAssignment?.patient?.name || 'Unknown'}`);
    console.log(`      Result: ${result.result || 'Pending'}`);
    console.log(`      Abnormal: ${result.isAbnormal ? 'Yes' : 'No'}`);
    console.log(`      Reported: ${result.reportedAt || 'Not reported'}`);
    console.log('');
  });
  
  if (sampleBookings.length === 0 && sampleAnalyses.length === 0 && sampleAssignments.length === 0 && sampleTestResults.length === 0) {
    console.log('   ℹ️  No lab data found to display.');
  }
}

// Helper function to add deletedAt field to LabBooking if needed
async function addDeletedAtToLabBookings() {
  try {
    console.log('\n🔧 Adding deletedAt field to LabBooking table...');
    
    // Check if column exists
    const columns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'LabBooking' AND column_name = 'deletedAt'
    `;
    
    if (columns.length === 0) {
      await prisma.$executeRaw`ALTER TABLE "LabBooking" ADD COLUMN "deletedAt" TIMESTAMP`;
      console.log('   ✅ Added deletedAt column to LabBooking table');
    } else {
      console.log('   ℹ️  deletedAt column already exists in LabBooking table');
    }
  } catch (error) {
    console.log('   ⚠️  Could not add deletedAt column:', error.message);
  }
}

// Main execution
if (require.main === module) {
  const option = process.argv[2];
  
  if (option === '--add-deleted-at') {
    addDeletedAtToLabBookings()
      .then(() => {
        console.log('✅ Column addition completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Failed to add column:', error);
        process.exit(1);
      });
  } else {
    clearLabData()
      .then(() => {
        console.log('✅ Script completed successfully');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { clearLabData, softDeleteLabData, hardDeleteLabData, viewLabData };
