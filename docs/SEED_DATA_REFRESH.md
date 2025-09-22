# Seed Data Refresh Solution

## 🎯 Problem Statement

Your seed data contains many time-sensitive entries that become irrelevant for testing once certain dates pass. This affects:

- **Appointments**: Past appointments don't show in "upcoming" notifications
- **Lab Bookings**: Old bookings don't trigger "pending collection" alerts
- **Subscriptions**: Expired subscriptions don't show "expiring soon" warnings
- **Payments**: Old failed payments don't appear in recent notifications
- **User Signups**: Old users don't trigger "new signup" alerts
- **Analysis Data**: Old processing errors don't show in system alerts

## 🚀 Solution Overview

Instead of deleting data, we provide **date refresh utilities** that update all time-sensitive dates to be relative to the current date, making your test data always relevant.

## 📁 Files Created

### 1. `scripts/update-seed-dates.js`
**Simple utility** that updates all dates to be relative to current date.

### 2. `scripts/refresh-seed-data.js`
**Advanced utility** with granular control and realistic data distribution.

### 3. `docs/SEED_DATA_REFRESH.md`
**This documentation** explaining the solution.

## 🛠️ Usage

### Quick Refresh (Simple)
```bash
npm run update-seed-dates
```

### Advanced Refresh (Recommended)
```bash
npm run refresh-seed
```

### Manual Execution
```bash
node scripts/refresh-seed-data.js
node scripts/update-seed-dates.js
```

## 📊 What Gets Updated

### 1. **Appointments & Doctor Availability**
- **30%** upcoming appointments (next 7 days)
- **70%** recent appointments (last 30 days)
- Random times between 9 AM - 5 PM
- 15-minute intervals (9:00, 9:15, 9:30, 9:45, etc.)

### 2. **Lab Bookings**
- **20%** today's pending collections
- **80%** upcoming bookings (next 14 days)
- Creation dates spread over last 7 days

### 3. **Subscription Trackers**
- **30%** expiring soon (within 7 days)
- **70%** active subscriptions (30-90 days duration)
- Start dates within last 60 days

### 4. **Payments**
- **20%** failed payments (last 24 hours)
- **80%** successful payments
- All recent for notification relevance

### 5. **Users**
- **20%** new signups (last 24 hours)
- **80%** existing users (last 90 days)
- Triggers "new signup" notifications

### 6. **Analysis Data**
- **10%** failed lab analysis (last 24 hours)
- **10%** failed prescription analysis (last 24 hours)
- **80%** completed analysis
- Triggers system error notifications

### 7. **Diet Plan Requests**
- **30%** pending requests (last 14 days)
- **70%** completed requests
- Triggers "pending approval" notifications

## 🎯 Benefits

### ✅ **No Data Loss**
- All existing relationships preserved
- No deletion of valuable test data
- Maintains data integrity

### ✅ **Always Relevant**
- Notifications show meaningful alerts
- Test scenarios remain valid
- Development workflow uninterrupted

### ✅ **Realistic Distribution**
- Mix of different states (pending, completed, failed)
- Realistic time distributions
- Triggers various notification types

### ✅ **Easy to Use**
- Simple npm commands
- One-click refresh
- Detailed progress logging
- **Transaction-based** for data consistency

## 🔄 Workflow Integration

### **Daily Development**
```bash
# Start your day
npm run refresh-seed
npm run dev
```

### **Before Testing Notifications**
```bash
# Ensure notifications are relevant
npm run refresh-seed
# Test your notification system
```

### **After Schema Changes**
```bash
# Reset and reseed
npm run db:reset
npm run seed
npm run refresh-seed
```

## 📈 Advanced Features

### **Smart Distribution**
The advanced script creates realistic data distributions:
- **Upcoming appointments** for "next 2 hours" notifications
- **Today's lab bookings** for "pending collection" alerts
- **Expiring subscriptions** for "expiring soon" warnings
- **Recent failed payments** for revenue alerts
- **New signups** for user growth notifications

### **Status Management**
- Automatically sets appropriate statuses
- Creates mix of pending/completed/failed states
- Ensures notifications trigger correctly

### **Time Realism**
- Business hours for appointments (9 AM - 5 PM)
- Realistic processing times for analysis
- Proper date relationships maintained

## 🚨 Important Notes

### **Backup Before First Run**
```bash
# Optional: Backup your current data
pg_dump your_database > backup_$(date +%Y%m%d).sql
```

### **Environment Safety**
- Scripts are safe for development environments
- No destructive operations
- All updates are reversible
- **Transaction-based** - if any update fails, all changes are rolled back

### **Performance**
- Processes data in batches
- Uses efficient Prisma queries
- Minimal database load
- **Atomic operations** - all updates succeed or all fail together

## 🔧 Customization

### **Adjusting Distributions**
Edit `scripts/refresh-seed-data.js` to change percentages:

```javascript
// Example: More upcoming appointments
const isUpcoming = Math.random() > 0.5; // 50% upcoming instead of 30%

// Example: More failed payments
const isFailed = Math.random() > 0.5; // 50% failed instead of 20%
```

### **Adding New Entities**
To refresh new entity types, add methods to the `SeedDataRefresher` class:

```javascript
async refreshNewEntity() {
  const entities = await prisma.newEntity.findMany();
  
  for (const entity of entities) {
    const newDate = new Date(this.today);
    newDate.setDate(newDate.getDate() - Math.floor(Math.random() * 30));
    
    await prisma.newEntity.update({
      where: { id: entity.id },
      data: {
        createdAt: newDate,
        updatedAt: this.now
      }
    });
  }
}
```

## 🎉 Result

After running the refresh script:

1. **Your notifications system** will show relevant alerts
2. **Test scenarios** will work with current dates
3. **Development workflow** remains uninterrupted
4. **No data loss** - all relationships preserved
5. **Realistic data** for comprehensive testing

## 📞 Support

If you encounter issues:

1. Check the console output for detailed logs
2. Verify database connectivity
3. Ensure Prisma schema is up to date
4. Run `npm run db:push` if needed

The refresh scripts are designed to be safe and informative, providing detailed feedback on what's being updated.
