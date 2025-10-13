# Database Management Scripts

This directory contains scripts for managing and clearing lab data in the CareDB system.

## 🧪 Lab Data Management Scripts

### Quick Clear Script (`quick-clear-lab.js`)
Fast script for clearing lab data with minimal prompts.

**Usage:**
```bash
# Soft delete (mark as deleted, data preserved)
node scripts/quick-clear-lab.js --soft

# Hard delete (permanently remove)
node scripts/quick-clear-lab.js --hard
```

### Comprehensive Script (`clear-lab-data.js`)
Interactive script with multiple options and safety checks.

**Usage:**
```bash
# Option 1: Soft delete
node scripts/clear-lab-data.js 1

# Option 2: Hard delete  
node scripts/clear-lab-data.js 2

# Option 3: View data before deletion
node scripts/clear-lab-data.js 3

# Add deletedAt column to LabBooking table
node scripts/clear-lab-data.js --add-deleted-at
```

## 🔒 Deletion Modes

### Soft Delete (`--soft`)
- **What it does**: Marks data as deleted but preserves it in the database
- **Benefits**: Data can be restored, safer for testing
- **Use case**: Development, testing, temporary cleanup
- **Data location**: Still in database with `deletedAt` timestamp

### Hard Delete (`--hard`)
- **What it does**: Permanently removes data from the database
- **Benefits**: Frees up database space, clean slate
- **Use case**: Production cleanup, complete reset
- **Data location**: Permanently deleted, cannot be recovered

## 🗂️ Data Types Cleared

The scripts handle these related data types in the correct order:

1. **ReportTrendData** - Trend analysis data (references LabBooking)
2. **LabReportAnalysis** - AI analysis results (references LabBooking)  
3. **LabBooking** - Lab test bookings (main entity)

## ⚠️ Safety Features

- **Foreign Key Order**: Deletes dependent data first
- **Data Counts**: Shows before/after counts
- **Verification**: Confirms deletion was successful
- **Error Handling**: Graceful failure with clear error messages

## 🚀 When to Use

### Use Soft Delete When:
- Testing new features
- Development environment cleanup
- Temporary data removal
- You might need to restore data later

### Use Hard Delete When:
- Production environment cleanup
- Complete system reset
- Database space optimization
- You're certain data won't be needed

## 📊 Example Output

```
🚀 Quick Clear Lab Data Script
================================
📊 Current Data:
   Lab Bookings: 6
   Lab Report Analyses: 0
   Report Trend Data: 32

🗑️  Performing HARD DELETE...
   ✅ Deleted 32 report trend data entries
   ✅ Deleted 0 lab report analyses
   ✅ Deleted 6 lab bookings
   ⚠️  All lab data has been permanently removed!

📊 Remaining Data:
   Lab Bookings: 0
   Lab Report Analyses: 0
   Report Trend Data: 0

✅ Operation completed successfully!
```

## 🔧 Troubleshooting

### Foreign Key Constraint Errors
If you get foreign key errors, the scripts now handle all dependencies automatically.

### Permission Issues
Ensure your database user has DELETE permissions on all related tables.

### Connection Issues
Check your `.env` file has the correct `DATABASE_URL`.

## 📝 Notes

- **Backup First**: Always backup your database before running deletion scripts
- **Test Environment**: Test scripts in development before using in production
- **Dependencies**: Scripts automatically handle all foreign key relationships
- **Recovery**: Hard deleted data cannot be recovered - use with caution
