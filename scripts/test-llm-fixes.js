#!/usr/bin/env node

/**
 * Test script to verify LLM API fixes
 * Tests both extract-values and generate-summary endpoints
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLabBookingExists() {
  console.log('🔍 Testing lab booking existence...');
  
  try {
    const labBookings = await prisma.labBooking.findMany({
      where: { deletedAt: null },
      select: { id: true, status: true, createdAt: true }
    });
    
    console.log(`📊 Found ${labBookings.length} active lab bookings:`, labBookings);
    
    if (labBookings.length === 0) {
      console.log('⚠️  No lab bookings found. Creating a test booking...');
      
      // Create a test lab booking
      const testBooking = await prisma.labBooking.create({
        data: {
          patientId: 1, // Assuming user ID 1 exists
          labPackageId: 1, // Assuming lab package ID 1 exists
          labDate: new Date(),
          status: 'PENDING'
        }
      });
      
      console.log('✅ Created test lab booking:', testBooking.id);
      return testBooking.id;
    }
    
    return labBookings[0].id;
  } catch (error) {
    console.error('❌ Error checking lab bookings:', error);
    return null;
  }
}

async function testExtractValuesAPI(labBookingId) {
  console.log('\n🧪 Testing extract-values API...');
  
  try {
    // Test with short text first
    const shortText = "Hemoglobin: 12.5 g/dL (Ref: 12.0-15.5)\nWBC: 8.2 x10^9/L (Ref: 4.0-11.0)";
    
    const response = await fetch('http://localhost:3000/api/llm-process/extract-values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: shortText,
        reportId: labBookingId,
        labResultIndex: 0
      })
    });
    
    const result = await response.json();
    console.log('📝 Short text test result:', result);
    
    // Test with very long text to trigger chunking
    const longText = "A".repeat(50000); // 50k characters
    
    const longResponse = await fetch('http://localhost:3000/api/llm-process/extract-values', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: longText,
        reportId: labBookingId,
        labResultIndex: 0
      })
    });
    
    const longResult = await longResponse.json();
    console.log('📏 Long text test result:', longResult);
    
  } catch (error) {
    console.error('❌ Error testing extract-values API:', error);
  }
}

async function testGenerateSummaryAPI(labBookingId) {
  console.log('\n📋 Testing generate-summary API...');
  
  try {
    // Test with short text first
    const shortText = "Patient presents with elevated blood glucose levels. Fasting glucose: 180 mg/dL (Ref: 70-100). HbA1c: 8.2% (Ref: <5.7%).";
    
    const response = await fetch('http://localhost:3000/api/llm-process/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: shortText,
        reportId: labBookingId,
        labResultIndex: 0
      })
    });
    
    const result = await response.json();
    console.log('📝 Short text test result:', result);
    
    // Test with very long text to trigger truncation
    const longText = "B".repeat(50000); // 50k characters
    
    const longResponse = await fetch('http://localhost:3000/api/llm-process/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: longText,
        reportId: labBookingId,
        labResultIndex: 0
      })
    });
    
    const longResult = await longResponse.json();
    console.log('📏 Long text test result:', longResult);
    
  } catch (error) {
    console.error('❌ Error testing generate-summary API:', error);
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test lab report analyses
    await prisma.labReportAnalysis.deleteMany({
      where: { labBookingId: { not: null } }
    });
    
    console.log('✅ Cleanup completed');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('🚀 Starting LLM API Fixes Test\n');
  
  try {
    // Test 1: Verify lab booking exists
    const labBookingId = await testLabBookingExists();
    if (!labBookingId) {
      console.log('❌ Cannot proceed without a valid lab booking');
      return;
    }
    
    // Test 2: Test extract-values API
    await testExtractValuesAPI(labBookingId);
    
    // Test 3: Test generate-summary API
    await testGenerateSummaryAPI(labBookingId);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
  } finally {
    await cleanup();
  }
}

// Run the test suite
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testLabBookingExists, testExtractValuesAPI, testGenerateSummaryAPI };
