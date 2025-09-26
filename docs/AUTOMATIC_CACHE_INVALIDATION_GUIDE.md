# Automatic Cache Invalidation System

## Overview
This system automatically invalidates user profile cache whenever data changes, ensuring users always see up-to-date information without any manual intervention.

## Problem Solved
- **Subscription changes**: When users subscribe to plans, profile cache is automatically invalidated
- **Profile updates**: When users update their profile, cache is automatically refreshed
- **Appointment changes**: When appointments are created/updated, related caches are cleared
- **Lab results**: When lab results are updated, cache is automatically invalidated
- **No manual intervention**: Users never need to manually refresh or clear cache

## Implementation

### 1. Core Cache Invalidation System
- **File**: `lib/cache-invalidation.ts`
- **Functions**:
  - `invalidateUserProfileCache()` - Clears user profile cache
  - `invalidateSubscriptionCache()` - Clears subscription-related cache
  - `invalidateAppointmentCache()` - Clears appointment cache
  - `invalidateLabResultsCache()` - Clears lab results cache
  - `invalidateAllUserCaches()` - Clears all user-related caches

### 2. Middleware System
- **File**: `lib/cache-middleware.ts`
- **Middleware**:
  - `withCacheInvalidation()` - General cache invalidation
  - `withSubscriptionCacheInvalidation()` - Subscription-specific
  - `withProfileCacheInvalidation()` - Profile-specific

### 3. Endpoints with Automatic Cache Invalidation

#### ✅ **Already Implemented**
- **Subscription Purchase**: `app/api/(end-user)/plans/confirmPurchase/route.ts`
- **Profile Updates**: `app/api/(end-user)/profile/route.ts`
- **Appointment Creation**: `app/api/(end-user)/appointments/route.ts`

#### 🔄 **Need Implementation**
- **Admin User Updates**: `app/api/admin/optimized/users/route.ts`
- **Doctor Profile Updates**: `app/api/admin/doctors/route.ts`
- **Lab Results Updates**: `app/api/pathology/lab-tests/[testId]/update-results/route.ts`
- **Lab Assignment Updates**: `app/api/pathology/lab-assignments/[assignmentId]/status/route.ts`
- **Prescription Updates**: `app/api/doctor/prescription/route.ts`

## How to Add Cache Invalidation

### Method 1: Direct Import (Recommended)
```typescript
// At the end of your endpoint, before returning response
try {
  const { invalidateAllUserCaches, getUserPhoneNumber } = await import('@/lib/cache-invalidation');
  const phoneNumber = await getUserPhoneNumber(userId);
  await invalidateAllUserCaches(userId, phoneNumber || undefined);
  console.log(`[ENDPOINT] Cache invalidated for user ${userId}`);
} catch (cacheError) {
  console.error('[ENDPOINT] Error invalidating cache:', cacheError);
  // Don't fail the request if cache invalidation fails
}
```

### Method 2: Middleware Wrapper
```typescript
import { withCacheInvalidation } from '@/lib/cache-middleware';

export const POST = withCacheInvalidation(async (request: Request) => {
  // Your endpoint logic here
  return NextResponse.json({ success: true });
});
```

## Cache Invalidation Triggers

### User Profile Changes
- Name, email, phone number updates
- Role or status changes
- Patient profile updates (weight, height, medical history)

### Subscription Changes
- Plan purchases
- Subscription status updates
- Plan feature changes

### Appointment Changes
- Appointment creation
- Appointment status updates
- Appointment cancellations

### Lab Results Changes
- Lab result updates
- Lab assignment status changes
- Lab report uploads

## Automatic Behavior

### 1. Subscription Purchase
- User subscribes to a plan
- Cache is automatically invalidated
- Profile immediately shows updated subscription status
- No user action required

### 2. Profile Updates
- User updates profile information
- Cache is automatically refreshed
- Changes are immediately visible
- No manual refresh needed

### 3. Appointment Creation
- User creates an appointment
- Cache is automatically updated
- Appointment appears in profile instantly
- No manual intervention required

## Monitoring Cache Invalidation

### Console Logs
Look for these log messages:
- `[CACHE-INVALIDATION] Successfully invalidated cache for user X`
- `[SUBSCRIPTION] Cache invalidated for user X after subscription update`
- `[PROFILE] Cache invalidated for user X after profile update`
- `[APPOINTMENT] Cache invalidated for user X after appointment creation`

### Error Handling
- Cache invalidation failures don't break the main operation
- Errors are logged but don't affect user experience
- Graceful degradation ensures system stability

## Benefits

### For Users
- **Immediate updates**: See changes instantly without manual refresh
- **Consistent data**: Always see up-to-date information
- **Better UX**: No need to manually clear cache or refresh

### For Developers
- **Automatic**: No manual cache management needed
- **Reliable**: Consistent cache invalidation across all endpoints
- **Maintainable**: Centralized cache invalidation logic

### For System
- **Performance**: Reduced cache misses and stale data
- **Reliability**: Consistent data across all components
- **Scalability**: Centralized cache management

## Future Enhancements

### Real-time Updates
- WebSocket-based cache invalidation
- Real-time profile updates
- Live subscription status changes

### Advanced Caching
- Selective cache invalidation
- Cache warming strategies
- Cache preloading for critical data

### Monitoring
- Cache hit/miss ratios
- Invalidation success rates
- Performance metrics

## Troubleshooting

### Cache Not Invalidating
1. Check console logs for error messages
2. Verify Redis connection
3. Ensure user ID is correctly passed
4. Check if endpoint is calling invalidation function

### Performance Issues
1. Monitor Redis performance
2. Check for excessive cache invalidation
3. Optimize invalidation frequency
4. Consider batch invalidation for bulk operations

### Data Inconsistency
1. Verify all relevant endpoints have cache invalidation
2. Check for missing invalidation triggers
3. Ensure proper error handling
4. Monitor cache invalidation logs
