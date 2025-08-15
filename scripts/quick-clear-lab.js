const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickClearLabData() {
  try {
    console.log('🚀 Quick Clear Lab Data Script');
    console.log('================================');
    
    // Get current counts
    const labBookingsCount = await prisma.labBooking.count();
    const labReportAnalysesCount = await prisma.labReportAnalysis.count();
    const reportTrendDataCount = await prisma.reportTrendData.count();
    const labAssignmentsCount = await prisma.labAssignment.count();
    const testResultsCount = await prisma.testResult.count();
    
    console.log(`📊 Current Data:`);
    console.log(`   Lab Bookings: ${labBookingsCount}`);
    console.log(`   Lab Report Analyses: ${labReportAnalysesCount}`);
    console.log(`   Report Trend Data: ${reportTrendDataCount}`);
    console.log(`   Lab Assignments: ${labAssignmentsCount}`);
    console.log(`   Test Results: ${testResultsCount}`);
    
    if (labBookingsCount === 0 && labReportAnalysesCount === 0 && reportTrendDataCount === 0 && labAssignmentsCount === 0 && testResultsCount === 0) {
      console.log('✅ No lab data to clear.');
      return;
    }
    
    // Check command line arguments
    const mode = process.argv[2];
    
    if (mode === '--soft') {
      console.log('\n🔄 Performing SOFT DELETE...');
      
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
      
    } else if (mode === '--hard') {
      console.log('\n🗑️  Performing HARD DELETE...');
      
      // Delete in correct order due to foreign key constraints
      // 1. First delete TestResult (references LabAssignment)
      const testResultsResult = await prisma.testResult.deleteMany({});
      console.log(`   ✅ Deleted ${testResultsResult.count} test results`);
      
      // 2. Then delete ReportTrendData (references LabBooking and LabReportAnalysis)
      const trendDataResult = await prisma.reportTrendData.deleteMany({});
      console.log(`   ✅ Deleted ${trendDataResult.count} report trend data entries`);
      
      // 3. Then delete LabReportAnalysis (references LabBooking)
      const analysesResult = await prisma.labReportAnalysis.deleteMany({});
      console.log(`   ✅ Deleted ${analysesResult.count} lab report analyses`);
      
      // 4. Then delete LabAssignment (references LabBooking)
      const assignmentsResult = await prisma.labAssignment.deleteMany({});
      console.log(`   ✅ Deleted ${assignmentsResult.count} lab assignments`);
      
      // 5. Finally delete LabBooking
      const bookingsResult = await prisma.labBooking.deleteMany({});
      console.log(`   ✅ Deleted ${bookingsResult.count} lab bookings`);
      
      console.log('   ⚠️  All lab data has been permanently removed!');
      
    } else {
      console.log('\n❌ Please specify deletion mode:');
      console.log('   node scripts/quick-clear-lab.js --soft  (mark as deleted)');
      console.log('   node scripts/quick-clear-lab.js --hard  (permanently remove)');
      console.log('\n💡 Use --soft for safer deletion (data can be restored)');
      console.log('💡 Use --hard for complete removal (data cannot be recovered)');
      return;
    }
    
    // Verify deletion
    const remainingBookings = await prisma.labBooking.count();
    const remainingAnalyses = await prisma.labReportAnalysis.count();
    const remainingTrendData = await prisma.reportTrendData.count();
    const remainingAssignments = await prisma.labAssignment.count();
    const remainingTestResults = await prisma.testResult.count();
    
    console.log(`\n📊 Remaining Data:`);
    console.log(`   Lab Bookings: ${remainingBookings}`);
    console.log(`   Lab Report Analyses: ${remainingAnalyses}`);
    console.log(`   Report Trend Data: ${remainingTrendData}`);
    console.log(`   Lab Assignments: ${remainingAssignments}`);
    console.log(`   Test Results: ${remainingTestResults}`);
    
    console.log('\n✅ Operation completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
quickClearLabData()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
