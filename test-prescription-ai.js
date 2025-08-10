const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

// Test data
const testPatientId = 8; // Replace with actual patient ID from your database

async function testAISummaryAPI() {
  console.log('🧪 Testing AI Summary API...');
  
  try {
    // Test GET endpoint
    console.log('\n📋 Testing GET /api/prescription/ai-summary/[patientId]...');
    const getResponse = await fetch(`${BASE_URL}/api/prescription/ai-summary/${testPatientId}`);
    const getData = await getResponse.json();
    
    console.log('GET Response Status:', getResponse.status);
    console.log('GET Response Data:', JSON.stringify(getData, null, 2));
    
    // Test POST endpoint (regenerate summary)
    console.log('\n🔄 Testing POST /api/prescription/ai-summary/[patientId]...');
    const postResponse = await fetch(`${BASE_URL}/api/prescription/ai-summary/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ force: true })
    });
    const postData = await postResponse.json();
    
    console.log('POST Response Status:', postResponse.status);
    console.log('POST Response Data:', JSON.stringify(postData, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing AI Summary API:', error.message);
  }
}

async function testPrescriptionProcess() {
  console.log('\n📄 Testing Prescription Process API...');
  
  try {
    const mockData = {
      appointmentId: '1',
      pdfUrl: 'https://example.com/test.pdf',
      patientId: testPatientId.toString(),
      prescriptionId: '1'
    };
    
    const response = await fetch(`${BASE_URL}/api/prescription/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData)
    });
    const data = await response.json();
    
    console.log('Process Response Status:', response.status);
    console.log('Process Response Data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing Prescription Process API:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Prescription AI Processing Tests...\n');
  
  await testAISummaryAPI();
  await testPrescriptionProcess();
  
  console.log('\n✅ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testAISummaryAPI,
  testPrescriptionProcess
};
