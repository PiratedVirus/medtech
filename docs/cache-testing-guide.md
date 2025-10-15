# 🧪 Cache Implementation Testing Guide

## **📋 Testing Strategy Overview**

### **1. Automated Testing (Recommended)**
- **Unit Tests**: Test individual cache functions
- **Integration Tests**: Test cache middleware
- **Performance Tests**: Test cache hit rates and response times
- **Invalidation Tests**: Test event-driven cache invalidation

### **2. Manual Testing (Immediate)**
- **Browser Dev Tools**: Check Network tab for response times
- **Redis CLI**: Monitor cache keys and TTL
- **API Testing**: Use Postman/curl to test endpoints
- **Performance Monitoring**: Measure before/after improvements

### **3. Production Testing (Deployment)**
- **A/B Testing**: Compare cached vs non-cached performance
- **Monitoring**: Set up cache performance dashboards
- **Alerting**: Monitor cache hit rates and errors

## **🚀 Quick Start Testing**

### **Step 1: Run Manual Test Script**
```bash
# Navigate to project directory
cd /Users/saurabhkulkarni/Desktop/caredb

# Run the manual test script
node scripts/test-cache-manual.js
```

### **Step 2: Test Individual Endpoints**
```bash
# Test specific endpoint
node -e "
const { quickTest } = require('./scripts/test-cache-manual.js');
quickTest('/api/(end-user)/profile');
"
```

### **Step 3: Check Redis Cache**
```bash
# Connect to Redis
redis-cli

# Check cache keys
KEYS *

# Check specific cache key
GET user:profile:1

# Check TTL
TTL user:profile:1

# Monitor cache activity
MONITOR
```

## **🔍 Detailed Testing Procedures**

### **1. Cache Hit Testing**

#### **Browser Dev Tools Method**
1. Open browser dev tools (F12)
2. Go to **Network** tab
3. Make the same API request twice
4. Compare response times:
   - **First request**: Should be slower (cache miss)
   - **Second request**: Should be faster (cache hit)

#### **Expected Results**
- **Cache Hit Rate**: 80-95%
- **Response Time Improvement**: 50-80%
- **Cache TTL**: 5-15 minutes (depending on endpoint)

### **2. Cache Invalidation Testing**

#### **Test Event-Driven Invalidation**
1. **Cache some data**:
   ```bash
   curl -X GET "http://localhost:3000/api/(end-user)/profile"
   ```

2. **Modify the data**:
   ```bash
   curl -X PUT "http://localhost:3000/api/(end-user)/profile" \
        -H "Content-Type: application/json" \
        -d '{"userId": 1, "name": "Updated Name"}'
   ```

3. **Check if cache was invalidated**:
   ```bash
   curl -X GET "http://localhost:3000/api/(end-user)/profile"
   ```

#### **Expected Results**
- Cache should be invalidated automatically
- Fresh data should be returned
- Related caches should also be invalidated

### **3. Redis Cache Testing**

#### **Check Cache Keys**
```bash
# Connect to Redis
redis-cli

# List all cache keys
KEYS *

# Check specific cache key
GET user:profile:1

# Check cache TTL
TTL user:profile:1

# Check cache size
DBSIZE
```

#### **Expected Cache Keys**
```
user:profile:*
user:subscription:*
user:appointments:*
user:labs:*
user:insights:*
doctor:profile:*
admin:dashboard:*
pathology:appointments
```

### **4. Performance Testing**

#### **Response Time Testing**
```bash
# Test response time
time curl -X GET "http://localhost:3000/api/(end-user)/profile"

# Test multiple requests
for i in {1..10}; do
  time curl -X GET "http://localhost:3000/api/(end-user)/profile" > /dev/null
done
```

#### **Expected Performance**
- **First Request**: 200-500ms (cache miss)
- **Subsequent Requests**: 50-150ms (cache hit)
- **Cache Hit Rate**: 80-95%
- **Database Load**: 80% reduction

### **5. Error Testing**

#### **Test Fallback Mechanisms**
1. **Disable Redis**: Test if app works without cache
2. **Invalid Data**: Test with malformed requests
3. **Network Issues**: Test with network failures
4. **Cache Expiration**: Test TTL expiration

#### **Expected Behavior**
- App should work even if cache fails
- Fallback to database queries
- Graceful error handling
- No data loss

## **📊 Testing Checklist**

### **✅ Priority 0 Endpoints (Must Have Cache)**
- [ ] `/api/(end-user)/appointments` - Cache hit rate > 80%
- [ ] `/api/(end-user)/profile` - Cache hit rate > 80%
- [ ] `/api/auth/get-user-profile` - Cache hit rate > 80%
- [ ] `/api/(end-user)/labs` - Cache hit rate > 80%
- [ ] `/api/(end-user)/insights` - Cache hit rate > 80%
- [ ] `/api/admin/dashboard/summary` - Cache hit rate > 80%
- [ ] `/api/(end-user)/plans` - Cache hit rate > 80%
- [ ] `/api/pathology/upcoming-appointments` - Cache hit rate > 80%

### **✅ Priority 1 Endpoints (Should Have Cache)**
- [ ] `/api/admin/users` - Cache hit rate > 70%
- [ ] `/api/doctor/appointments/upcoming` - Cache hit rate > 70%
- [ ] `/api/doctor/earnings` - Cache hit rate > 70%
- [ ] `/api/superadmin/dashboard/stats` - Cache hit rate > 70%
- [ ] `/api/admin/patients` - Cache hit rate > 70%
- [ ] `/api/(end-user)/dieticians/diet` - Cache hit rate > 70%

### **✅ Priority 2 Endpoints (Nice to Have Cache)**
- [ ] `/api/patient/[patientId]/all-values` - Cache hit rate > 60%
- [ ] `/api/doctor/clinic-info` - Cache hit rate > 60%
- [ ] `/api/superadmin/admins` - Cache hit rate > 60%
- [ ] `/api/doctor/diet-plans` - Cache hit rate > 60%
- [ ] `/api/superadmin/analytics` - Cache hit rate > 60%
- [ ] `/api/admin/standalone-reports` - Cache hit rate > 60%
- [ ] `/api/(end-user)/plans/planUsage` - Cache hit rate > 60%
- [ ] `/api/admin/plans` - Cache hit rate > 60%

### **✅ Cache Invalidation Testing**
- [ ] Doctor update invalidates doctor caches
- [ ] User update invalidates user caches
- [ ] Appointment creation invalidates appointment caches
- [ ] Lab result update invalidates lab caches
- [ ] Insights update invalidates insights caches

### **✅ Performance Testing**
- [ ] Response time improvement > 50%
- [ ] Cache hit rate > 80%
- [ ] Database load reduction > 80%
- [ ] Memory usage within limits
- [ ] No memory leaks

## **🐛 Troubleshooting Common Issues**

### **Issue 1: Cache Not Working**
**Symptoms**: Second request not faster than first
**Solutions**:
1. Check if Redis is running: `redis-cli ping`
2. Check cache keys: `redis-cli KEYS *`
3. Check middleware implementation
4. Check TTL values

### **Issue 2: Cache Not Invalidating**
**Symptoms**: Stale data after updates
**Solutions**:
1. Check event-driven invalidation
2. Check dependency mapping
3. Check cache key patterns
4. Check middleware configuration

### **Issue 3: High Memory Usage**
**Symptoms**: Redis memory usage too high
**Solutions**:
1. Check TTL values (reduce if too high)
2. Check cache key patterns
3. Implement cache eviction policies
4. Monitor cache size

### **Issue 4: Slow Response Times**
**Symptoms**: Cached requests still slow
**Solutions**:
1. Check Redis performance
2. Check network latency
3. Check cache key size
4. Optimize cache queries

## **📈 Performance Monitoring**

### **Key Metrics to Monitor**
1. **Cache Hit Rate**: Should be > 80%
2. **Response Time**: Should be < 200ms for cached requests
3. **Memory Usage**: Should be within Redis limits
4. **Error Rate**: Should be < 1%
5. **Database Load**: Should be reduced by 80%

### **Monitoring Tools**
1. **Redis CLI**: `redis-cli --stat`
2. **Redis Monitor**: `redis-cli MONITOR`
3. **Application Logs**: Check cache-related logs
4. **Performance Tools**: New Relic, DataDog, etc.

### **Alerting Thresholds**
- Cache hit rate < 70%
- Response time > 500ms
- Memory usage > 80%
- Error rate > 5%
- Database load > 50%

## **🎯 Testing Results Expectations**

### **Before Cache Implementation**
- **Cache Hit Rate**: 0%
- **Average Response Time**: 500ms
- **Database Queries**: 100% of requests
- **Memory Usage**: Low
- **Error Rate**: Variable

### **After Cache Implementation**
- **Cache Hit Rate**: 80-95%
- **Average Response Time**: 150ms
- **Database Queries**: 20% of requests
- **Memory Usage**: Moderate (Redis)
- **Error Rate**: < 1%

### **Performance Improvements**
- **Response Time**: 70% improvement
- **Database Load**: 80% reduction
- **User Experience**: 90% faster page loads
- **Scalability**: 5x more concurrent users
- **Cost**: 60% reduction in database costs

## **🚀 Next Steps After Testing**

1. **Deploy to Staging**: Test in staging environment
2. **Performance Testing**: Load testing with realistic data
3. **Monitoring Setup**: Set up cache performance monitoring
4. **Production Deployment**: Deploy with monitoring
5. **Optimization**: Fine-tune based on real usage patterns

## **📞 Support**

If you encounter issues during testing:
1. Check the troubleshooting section above
2. Review the implementation logs
3. Test individual components
4. Contact the development team
5. Check Redis and application logs

**Happy Testing! 🎉**
