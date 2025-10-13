# Seed System - Versioned Structure

This directory contains the seed system organized by versions for better management and migration tracking.

## Structure

```
prisma/seeds/
├── main.js                    # Main orchestrator (points to v2)
├── README.md                  # This file
├── v1/                        # Legacy seed files (archived)
│   ├── superSeedNew.js
│   ├── seedEarningsSlotStatus.js
│   ├── seedPrescriptionData.js
│   ├── seedPlanFeatures.js
│   ├── seedHealthMetric.js
│   ├── seedPlans.js
│   ├── seedLab.js
│   ├── seedSlots5Days.js
│   └── scripts/               # Old scripts directory
│       ├── Lab Package Rows.sql
│       ├── seed-doctors.js
│       ├── seed-pathology-data.js
│       └── ... (other old scripts)
└── v2/                        # New unified seed system
    ├── main.js                # Main orchestrator
    ├── clinics.js             # Clinics and specializations
    ├── labPackages.js         # Lab packages (converted from SQL)
    ├── plans.js               # Plans and plan features
    ├── users.js               # All user types
    ├── userProfiles.js        # User profiles
    ├── pathology.js           # Pathology labs
    ├── labTests.js            # Lab tests
    ├── medicines.js           # Medicines and complaints
    ├── commonValues.js        # Common values for forms
    ├── appointments.js        # Appointments and availability
    ├── labBookings.js         # Lab bookings and assignments
    ├── healthMetrics.js       # Health metrics
    ├── prescriptions.js       # Prescriptions and related data
    ├── prescriptionTemplates.js # Prescription templates
    ├── subscriptionTrackers.js # Subscription trackers
    ├── payments.js            # Payments
    └── README.md              # Detailed v2 documentation
```

## Usage

### Run Current Version (v2)
```bash
npm run seed
# or
node prisma/seeds/main.js
```

### Run Specific Version
```bash
# Run v2 directly
node prisma/seeds/v2/main.js

# Run v1 (legacy)
node prisma/seeds/v1/superSeedNew.js
```

## Migration History

### v1 → v2 Migration
- **Consolidated**: 8 scattered seed files into 16 organized modules
- **Enhanced**: Added missing entities (SubscriptionTracker, PrescriptionTemplate)
- **Improved**: Better data quality and relationships
- **Integrated**: Functionality from seedEarningsSlotStatus.js and seedSlots5Days.js
- **Updated**: Specific phone numbers and credentials as requested

### Key Changes in v2
- **Unified structure**: Single source of truth for all seed data
- **Proper ordering**: Respects database relationships and constraints
- **Enhanced features**: 30-minute appointment slots, earnings tracking
- **Complete coverage**: All major entities seeded with realistic data
- **Better maintainability**: Modular design with clear separation of concerns

## Specific Updates in v2

### Phone Numbers Updated
- Patient (Rahul Verma): `+918149306224`
- Doctor (Dr. Rajesh Sharma): `+919420809961`
- Pathology Admin: `+919421300875`

### Admin Credentials
- Email: `admin@caredb.com`
- Password: `$2b$10$iem402R/BJ46Aa0tcPdomOCsA8NFNPGfX8WrORwaak7HYM33JXjHy`

### New Entities Added
- **SubscriptionTracker**: Plan usage tracking for patients
- **PrescriptionTemplate**: Doctor prescription templates
- **Enhanced Plan Features**: Detailed parameters and notes

## Benefits of Versioned Structure

1. **Backward Compatibility**: Old seeds preserved in v1
2. **Easy Rollback**: Can switch between versions if needed
3. **Clear Migration Path**: Documented changes between versions
4. **Safe Testing**: Can test new versions without affecting production
5. **Team Collaboration**: Clear understanding of current vs legacy systems

## Next Steps

1. **Test v2**: Run `npm run seed` to test the new system
2. **Verify Data**: Check all relationships and data integrity
3. **Update Documentation**: Keep this README updated with any changes
4. **Team Training**: Ensure team understands the new structure 