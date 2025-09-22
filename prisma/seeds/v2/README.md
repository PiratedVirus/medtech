# Unified Seed System

This directory contains a comprehensive, unified seed system for the CareDiabetics database. All seed files have been consolidated and organized to eliminate redundancy and ensure data consistency.

## Structure

```
prisma/seeds/
├── main.js                 # Main orchestrator file
├── clinics.js              # Clinics and specializations
├── labPackages.js          # Lab packages (converted from SQL)
├── plans.js                # Plans and plan features
├── users.js                # All user types (doctors, patients, etc.)
├── userProfiles.js         # User profiles (doctor, patient, etc.)
├── pathology.js            # Pathology labs
├── labTests.js             # Lab tests
├── medicines.js            # Medicines and complaints
├── commonValues.js         # Common values for forms
├── appointments.js         # Appointments and availability
├── labBookings.js          # Lab bookings and assignments
├── healthMetrics.js        # Health metrics
├── prescriptions.js        # Prescriptions and related data
├── mealTimings.js          # Meal timing templates for dieticians
├── payments.js             # Payments
└── README.md               # This file
```

## Features

### ✅ Unified Data Management
- Single source of truth for all seed data
- Eliminates redundancy across multiple scripts
- Consistent data relationships and constraints

### ✅ Proper Ordering
- Seeding follows database relationship constraints
- Auto-increment IDs are properly handled
- Foreign key relationships are maintained

### ✅ Comprehensive Coverage
- **Clinics**: 4 clinics with specializations
- **Lab Packages**: 5 packages (Care+, Basic, Blood glucose, Care, SAL panel)
- **Plans**: 6 subscription plans with features
- **Users**: 20+ users across all roles
- **Profiles**: Complete profile data for all user types
- **Pathology**: Lab infrastructure
- **Lab Tests**: 25+ lab tests with parameters
- **Medicines**: 10+ medicines with categories
- **Complaints**: 30+ common complaints
- **Appointments**: Sample appointments with 30-minute availability slots
- **Lab Bookings**: Sample lab bookings and assignments
- **Health Metrics**: Historical health data
- **Prescriptions**: Complete prescription data
- **Meal Timings**: Default meal timing templates for dieticians
- **Payments**: Sample payment records with earnings tracking

### ✅ Data Quality
- Realistic, healthcare-focused data
- Proper categorization and relationships
- Consistent naming conventions
- Appropriate severity levels and medical terminology

## Usage

### Run Complete Seed
```bash
npm run seed
# or
npx prisma db seed
```

### Run Individual Seed Files
```bash
node prisma/seeds/main.js
```

## Data Highlights

### Lab Packages (from SQL conversion)
- **Care+**: Comprehensive package (₹1999) - CBC, LFT, KFT, Thyroid, Lipid, Blood Sugar, Urine Panel, Vitamins
- **Basic**: Diabetes essentials (₹499) - FBS, HbA1C, PPBS
- **Blood glucose**: Basic glucose test (₹149)
- **Care**: Standard package (₹1499) - Similar to Care+ without vitamins
- **SAL panel**: Advanced package (₹2850) - Care+ with Amylase, Lipase

### User Roles
- **Doctors**: 7 doctors with various specialties
- **Patients**: 5 patients with different medical histories
- **Dieticians**: 2 dieticians with specializations
- **Lab Techs**: 2 lab technicians
- **Phlebotomists**: 3 phlebotomists
- **Pathology Admin**: 1 admin
- **System Admin**: 1 admin

### Plans
- **Basic**: 6/12 months (₹2599/₹4999)
- **CARE**: 6/12 months (₹5999/₹9999)
- **CARE+**: 6/12 months (₹9999/₹17999)

## Migration from Old System

The old seed files in `scripts/` directory have been consolidated:
- `seed-doctors.js` → `users.js` + `userProfiles.js`
- `seed-pathology-data.js` → `pathology.js` + `labTests.js`
- `seedPlans.js` → `plans.js`
- `seedLab.js` → `labPackages.js`
- `Lab Package Rows.sql` → `labPackages.js` (converted to Prisma format)

### Additional Integrations from Existing Seeds:
- `seedEarningsSlotStatus.js` → Integrated into `appointments.js` and `payments.js`
- `seedSlots5Days.js` → Integrated into `appointments.js` (30-minute slot generation)

## Notes

- All seed functions use `upsert` to prevent duplicates on re-runs
- Data is realistic and healthcare-focused
- Relationships are properly maintained
- Auto-increment constraints are respected
- The system can be run multiple times safely 