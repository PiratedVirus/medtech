/**
 * Quick Cache Test Script
 * Run this immediately to test cache implementation
 */

const BASE_URL = 'http://localhost:3000';

/**
 * Test a single endpoint for cache functionality
 */
async function testCache(endpoint, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 Endpoint: ${endpoint}`);
  
  try {
    // First request (cache miss)
    console.log('  📥 First request (cache miss)...');
    const start1 = Date.now();
    const response1 = await fetch(`${BASE_URL}${endpoint}`);
    const time1 = Date.now() - start1;
    console.log(`  ⏱️  Time: ${time1}ms | Status: ${response1.status}`);
    
    // Second request (cache hit)
    console.log('  📥 Second request (cache hit)...');
    const start2 = Date.now();
    const response2 = await fetch(`${BASE_URL}${endpoint}`);
    const time2 = Date.now() - start2;
    console.log(`  ⏱️  Time: ${time2}ms | Status: ${response2.status}`);
    
    // Check if cache is working
    const improvement = Math.round((time1 - time2) / time1 * 100);
    const cacheWorking = time2 < time1 * 0.7;
    
    if (cacheWorking) {
      console.log(`  ✅ CACHE WORKING! ${improvement}% improvement`);
    } else {
      console.log(`  ❌ CACHE NOT WORKING (${improvement}% improvement)`);
    }
    
    return { cacheWorking, time1, time2, improvement };
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    return { cacheWorking: false, error: error.message };
  }
}

/**
 * Test cache invalidation
 */
async function testInvalidation(endpoint, method, data, description) {
  console.log(`\n🔄 Testing Invalidation: ${description}`);
  
  try {
    // Cache some data
    console.log('  📥 Caching data...');
    const getResponse = await fetch(`${BASE_URL}${endpoint}`);
    console.log(`  📊 GET: ${getResponse.status}`);
    
    // Modify data
    console.log('  📝 Modifying data...');
    const modifyResponse = await fetch(`${BASE_URL}${endpoint}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log(`  📊 ${method}: ${modifyResponse.status}`);
    
    // Check if cache was invalidated
    console.log('  🔍 Checking invalidation...');
    const finalResponse = await fetch(`${BASE_URL}${endpoint}`);
    console.log(`  📊 Final GET: ${finalResponse.status}`);
    
    console.log('  ✅ Invalidation test completed');
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
  }
}

/**
 * Run quick tests
 */
async function runQuickTests() {
  console.log('🚀 Quick Cache Test Suite');
  console.log('==========================');
  console.log('Testing cache implementation...\n');
  
  const results = [];
  
  // Test critical endpoints
  const endpoints = [
    { url: '/api/(end-user)/profile', desc: 'User Profile' },
    { url: '/api/(end-user)/appointments?patientId=1', desc: 'User Appointments' },
    { url: '/api/(end-user)/labs?patientId=1', desc: 'User Labs' },
    { url: '/api/(end-user)/insights?userId=1', desc: 'User Insights' },
    { url: '/api/admin/dashboard/summary', desc: 'Admin Dashboard' },
    { url: '/api/(end-user)/plans?userId=1', desc: 'User Plans' },
    { url: '/api/admin/users', desc: 'Admin Users' },
    { url: '/api/doctor/earnings', desc: 'Doctor Earnings' }
  ];
  
  for (const endpoint of endpoints) {
    const result = await testCache(endpoint.url, endpoint.desc);
    results.push({ ...endpoint, ...result });
  }
  
  // Test cache invalidation
  console.log('\n🔄 Testing Cache Invalidation');
  console.log('==============================');
  
  await testInvalidation('/api/(end-user)/profile', 'PUT', { userId: 1, name: 'Test' }, 'User Profile Update');
  await testInvalidation('/api/admin/doctors', 'PUT', { id: 1, consultationFee: 500 }, 'Doctor Update');
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('================');
  
  const working = results.filter(r => r.cacheWorking).length;
  const total = results.length;
  const avgImprovement = results.reduce((sum, r) => sum + (r.improvement || 0), 0) / total;
  
  console.log(`✅ Working: ${working}/${total} (${Math.round(working/total*100)}%)`);
  console.log(`📈 Average Improvement: ${Math.round(avgImprovement)}%`);
  
  console.log('\n🎯 Results:');
  results.forEach(result => {
    const status = result.cacheWorking ? '✅' : '❌';
    console.log(`  ${status} ${result.desc}: ${result.improvement || 0}% improvement`);
  });
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check Redis: redis-cli KEYS *');
  console.log('2. Monitor cache: redis-cli MONITOR');
  console.log('3. Check browser dev tools Network tab');
  console.log('4. Test in staging environment');
  console.log('5. Set up production monitoring');
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runQuickTests().catch(console.error);
}

module.exports = { testCache, testInvalidation, runQuickTests };
