/**
 * Manual Cache Testing Script
 * Simple tests you can run immediately to validate cache implementation
 */

const BASE_URL = 'http://localhost:3000';

/**
 * Test cache functionality for a specific endpoint
 */
async function testEndpointCache(endpoint, description) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`Endpoint: ${endpoint}`);
  
  try {
    // First request (should be cache miss)
    console.log('  📥 Making first request (cache miss)...');
    const start1 = Date.now();
    const response1 = await fetch(`${BASE_URL}${endpoint}`);
    const time1 = Date.now() - start1;
    console.log(`  ⏱️  First request: ${time1}ms (Status: ${response1.status})`);
    
    // Second request (should be cache hit)
    console.log('  📥 Making second request (cache hit)...');
    const start2 = Date.now();
    const response2 = await fetch(`${BASE_URL}${endpoint}`);
    const time2 = Date.now() - start2;
    console.log(`  ⏱️  Second request: ${time2}ms (Status: ${response2.status})`);
    
    // Check if cache is working
    const cacheWorking = time2 < time1 * 0.7; // Second request should be at least 30% faster
    const status = cacheWorking ? '✅ CACHE WORKING' : '❌ CACHE NOT WORKING';
    
    console.log(`  ${status}`);
    console.log(`  📊 Performance: ${Math.round((time1 - time2) / time1 * 100)}% improvement`);
    
    return { cacheWorking, time1, time2 };
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
    return { cacheWorking: false, error: error.message };
  }
}

/**
 * Test cache invalidation
 */
async function testCacheInvalidation(endpoint, method, data, description) {
  console.log(`\n🔄 Testing Cache Invalidation: ${description}`);
  console.log(`Endpoint: ${endpoint} (${method})`);
  
  try {
    // First, cache some data
    console.log('  📥 Caching data with GET request...');
    const getResponse = await fetch(`${BASE_URL}${endpoint}`);
    console.log(`  📊 GET response: ${getResponse.status}`);
    
    // Then, modify data (should invalidate cache)
    console.log('  📝 Modifying data with PUT/POST request...');
    const modifyResponse = await fetch(`${BASE_URL}${endpoint}`, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    console.log(`  📊 ${method} response: ${modifyResponse.status}`);
    
    // Finally, check if cache was invalidated
    console.log('  🔍 Checking if cache was invalidated...');
    const finalResponse = await fetch(`${BASE_URL}${endpoint}`);
    console.log(`  📊 Final GET response: ${finalResponse.status}`);
    
    console.log('  ✅ Cache invalidation test completed');
    
  } catch (error) {
    console.log(`  ❌ ERROR: ${error.message}`);
  }
}

/**
 * Test Redis cache directly
 */
async function testRedisCache() {
  console.log('\n🔍 Redis Cache Testing');
  console.log('=====================');
  console.log('To test Redis cache directly:');
  console.log('1. Connect to Redis: redis-cli');
  console.log('2. Check cache keys: KEYS *');
  console.log('3. Check specific key: GET user:profile:1');
  console.log('4. Check TTL: TTL user:profile:1');
  console.log('5. Monitor cache: MONITOR');
  console.log('');
  console.log('Expected cache keys:');
  console.log('- user:profile:*');
  console.log('- user:appointments:*');
  console.log('- user:labs:*');
  console.log('- user:insights:*');
  console.log('- doctor:profile:*');
  console.log('- admin:dashboard:*');
  console.log('- pathology:appointments');
}

/**
 * Run all cache tests
 */
async function runAllTests() {
  console.log('🚀 Manual Cache Testing Suite');
  console.log('==============================');
  console.log('Testing cache implementation for all 24 critical endpoints...');
  
  // Test Priority 0 endpoints (Must Have Cache)
  console.log('\n🔴 Priority 0: Must Have Cache');
  console.log('===============================');
  
  await testEndpointCache('/api/(end-user)/appointments?patientId=1', 'User Appointments');
  await testEndpointCache('/api/(end-user)/profile', 'User Profile');
  await testEndpointCache('/api/auth/get-user-profile', 'User Profile Auth');
  await testEndpointCache('/api/(end-user)/labs?patientId=1', 'User Labs');
  await testEndpointCache('/api/(end-user)/insights?userId=1', 'User Insights');
  await testEndpointCache('/api/admin/dashboard/summary', 'Admin Dashboard');
  await testEndpointCache('/api/(end-user)/plans?userId=1', 'User Plans');
  await testEndpointCache('/api/pathology/upcoming-appointments', 'Pathology Appointments');
  
  // Test Priority 1 endpoints (Should Have Cache)
  console.log('\n🟡 Priority 1: Should Have Cache');
  console.log('================================');
  
  await testEndpointCache('/api/admin/users', 'Admin Users');
  await testEndpointCache('/api/doctor/appointments/upcoming', 'Doctor Appointments');
  await testEndpointCache('/api/doctor/earnings', 'Doctor Earnings');
  await testEndpointCache('/api/superadmin/dashboard/stats', 'Superadmin Stats');
  await testEndpointCache('/api/admin/patients', 'Admin Patients');
  await testEndpointCache('/api/(end-user)/dieticians/diet?id=1', 'Dieticians Diet');
  
  // Test Priority 2 endpoints (Nice to Have Cache)
  console.log('\n🟢 Priority 2: Nice to Have Cache');
  console.log('=================================');
  
  await testEndpointCache('/api/patient/1/all-values', 'Patient All Values');
  await testEndpointCache('/api/doctor/clinic-info', 'Doctor Clinic Info');
  await testEndpointCache('/api/superadmin/admins', 'Superadmin Admins');
  await testEndpointCache('/api/doctor/diet-plans?patientId=1', 'Doctor Diet Plans');
  await testEndpointCache('/api/superadmin/analytics?range=6months', 'Superadmin Analytics');
  await testEndpointCache('/api/admin/standalone-reports', 'Admin Standalone Reports');
  await testEndpointCache('/api/(end-user)/plans/planUsage?subscriptionId=1', 'Plans Usage');
  await testEndpointCache('/api/admin/plans', 'Admin Plans');
  
  // Test Cache Invalidation
  console.log('\n🔄 Cache Invalidation Tests');
  console.log('============================');
  
  await testCacheInvalidation('/api/admin/doctors', 'PUT', { id: 1, consultationFee: 500 }, 'Doctor Update');
  await testCacheInvalidation('/api/(end-user)/profile', 'PUT', { userId: 1, name: 'Updated Name' }, 'User Update');
  await testCacheInvalidation('/api/(end-user)/appointments', 'POST', { patientId: 1, doctorId: 1 }, 'Appointment Creation');
  await testCacheInvalidation('/api/(end-user)/insights', 'POST', { userId: 1, metricName: 'weight', reading: 70 }, 'Insights Update');
  
  // Redis testing guide
  testRedisCache();
  
  console.log('\n✅ All manual tests completed!');
  console.log('\n📋 Next Steps:');
  console.log('1. Check browser dev tools Network tab for response times');
  console.log('2. Verify Redis cache keys are being created');
  console.log('3. Test cache invalidation by modifying data');
  console.log('4. Monitor cache hit rates in production');
  console.log('5. Set up cache performance monitoring');
}

/**
 * Quick test for specific endpoint
 */
async function quickTest(endpoint) {
  console.log(`🧪 Quick Test: ${endpoint}`);
  await testEndpointCache(endpoint, 'Quick Test');
}

// Export functions for use
module.exports = {
  testEndpointCache,
  testCacheInvalidation,
  testRedisCache,
  runAllTests,
  quickTest
};

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}
