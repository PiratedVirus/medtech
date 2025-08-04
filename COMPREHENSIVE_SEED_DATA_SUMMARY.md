# Comprehensive Seed Data Summary

## Overview

This document provides a complete overview of all the seeded data for the centralized lab booking system, including the initial seed and additional appointments.

## 📊 Total Seeded Data

### 🏥 Pathology Infrastructure
- **1 Pathology Lab**: CareDiabetics Pathology Lab
- **1 Pathology Admin**: pathology@carediabetics.com
- **4 Phlebotomists**: Rajesh Kumar, Priya Sharma, Amit Patel, Sneha Verma

### 🧪 Lab Packages & Tests
- **6 Lab Packages**: Basic Diabetes Panel, Complete Lipid Profile, Kidney & Liver Combo, Complete Blood Count, Thyroid Profile, Cardiac Markers
- **4 Individual Tests**: Blood Glucose Random, Hemoglobin Test, Vitamin D Test, PSA Test
- **10 Lab Tests**: FBS, HbA1c, Total Cholesterol, HDL, LDL, Triglycerides, Creatinine, Urea, ALT, AST

### 👥 Patients
- **4 Patients**: Rahul Sharma, Priya Patel, Amit Kumar, Neha Singh

## 📅 Appointment Distribution

### 🔮 Upcoming Appointments (10)
**Status**: PENDING or ASSIGNED
**Date Range**: 2-11 days from today
**Distribution**:
- **PENDING**: 5 appointments (awaiting phlebotomist assignment)
- **ASSIGNED**: 5 appointments (phlebotomist assigned, ready to start)

**Details**:
1. Rahul Sharma - Basic Diabetes Panel - PENDING
2. Priya Patel - Complete Lipid Profile - ASSIGNED
3. Amit Kumar - Kidney & Liver Combo - PENDING
4. Neha Singh - Complete Blood Count - ASSIGNED
5. Rahul Sharma - Thyroid Profile - PENDING
6. Priya Patel - Cardiac Markers - ASSIGNED
7. Amit Kumar - Basic Diabetes Panel - PENDING
8. Neha Singh - Complete Lipid Profile - ASSIGNED
9. Rahul Sharma - Kidney & Liver Combo - PENDING
10. Priya Patel - Complete Blood Count - ASSIGNED

### 🔄 Ongoing Appointments (5)
**Status**: SAMPLE_COLLECTED, IN_LAB, or ANALYZING
**Date Range**: 1-5 days ago
**Distribution**:
- **SAMPLE_COLLECTED**: 2 appointments
- **IN_LAB**: 2 appointments
- **ANALYZING**: 1 appointment

**Details**:
1. Amit Kumar - Kidney & Liver Combo - SAMPLE_COLLECTED
2. Neha Singh - Complete Blood Count - IN_LAB
3. Rahul Sharma - Thyroid Profile - ANALYZING
4. Priya Patel - Cardiac Markers - SAMPLE_COLLECTED
5. Amit Kumar - Basic Diabetes Panel - IN_LAB

### ✅ Completed Appointments (8)
**Status**: COMPLETED
**Date Range**: 7-9 days ago (from initial seed) + 7-9 days ago (from additional seed)
**Distribution**:
- **Initial Seed**: 5 completed appointments
- **Additional Seed**: 3 completed appointments with test results

**Details**:
1. Rahul Sharma - Basic Diabetes Panel - COMPLETED (with test results)
2. Priya Patel - Complete Lipid Profile - COMPLETED (with test results)
3. Amit Kumar - Kidney & Liver Combo - COMPLETED (with test results)
4. Neha Singh - Complete Blood Count - COMPLETED (with test results)
5. Vikram Malhotra - Thyroid Profile - COMPLETED (with test results)
6. Neha Singh - Thyroid Profile - COMPLETED (with test results)
7. Rahul Sharma - Cardiac Markers - COMPLETED (with test results)
8. Priya Patel - Basic Diabetes Panel - COMPLETED (with test results)

## 💰 Payment Distribution

### Payment Methods
- **Online**: 8 appointments
- **Clinic**: 8 appointments
- **Plan**: 7 appointments

### Lab Package Distribution
- **Basic Diabetes Panel**: 6 bookings
- **Complete Lipid Profile**: 5 bookings
- **Kidney & Liver Combo**: 4 bookings
- **Complete Blood Count**: 4 bookings
- **Thyroid Profile**: 4 bookings
- **Cardiac Markers**: 3 bookings

## 🕐 Time Distribution

### Appointment Times
- **8:00 AM**: 2 appointments
- **9:00 AM**: 3 appointments
- **10:00 AM**: 3 appointments
- **11:00 AM**: 2 appointments
- **12:00 PM**: 2 appointments
- **1:00 PM**: 2 appointments
- **2:00 PM**: 2 appointments
- **3:00 PM**: 2 appointments
- **4:00 PM**: 2 appointments
- **5:00 PM**: 2 appointments

## 📍 Location Distribution

### Patient Addresses
- **Upcoming Addresses**: 10 different addresses in Mumbai
- **Ongoing Addresses**: 5 different addresses in Mumbai
- **Completed Addresses**: 8 different addresses in Mumbai
- **Original Addresses**: 5 different addresses in Mumbai

## 🧪 Test Results

### Completed Appointments with Test Results
- **8 appointments** have test results
- **Average 3-4 test results** per completed appointment
- **Test types**: FBS, HbA1c, Total Cholesterol, HDL, LDL, Triglycerides, Creatinine, Urea, ALT, AST
- **Abnormal results**: ~30% chance of abnormal values
- **Follow-up required**: ~30% chance of requiring follow-up

### Report URLs
Each completed appointment has 2-3 report URLs:
- `https://example.com/reports/patient-{id}-lab-{packageId}-report-{number}.pdf`

## 🔐 Test Credentials

### Pathology Admin
- **Phone**: +91-9999999999
- **Email**: pathology@carediabetics.com
- **Role**: PATHOLOGY

### Phlebotomists
- **Rajesh Kumar**: +91-8888888888 (Mumbai Central) - Blood Collection
- **Priya Sharma**: +91-7777777777 (Andheri West) - Sample Collection
- **Amit Patel**: +91-6666666666 (Bandra East) - Home Collection
- **Sneha Verma**: +91-5555555555 (Juhu) - Pediatric Collection

### Patients
- **Rahul Sharma**: +91-1111111111
- **Priya Patel**: +91-2222222222
- **Amit Kumar**: +91-3333333333
- **Neha Singh**: +91-4444444444

## 📈 Statistics Summary

### Total Counts
- **Total Lab Bookings**: 23
- **Total Lab Assignments**: 23
- **Total Test Results**: ~32 (4 per completed appointment)
- **Total Patients**: 4
- **Total Phlebotomists**: 4
- **Total Lab Packages**: 6
- **Total Individual Tests**: 4
- **Total Lab Tests**: 10

### Status Distribution
- **PENDING**: 5 (21.7%)
- **ASSIGNED**: 5 (21.7%)
- **SAMPLE_COLLECTED**: 2 (8.7%)
- **IN_LAB**: 2 (8.7%)
- **ANALYZING**: 1 (4.3%)
- **COMPLETED**: 8 (34.8%)

### Workflow Coverage
The seeded data provides comprehensive coverage of the entire lab booking workflow:
1. **Booking Creation**: All appointments have proper lab bookings
2. **Assignment Process**: Mix of pending and assigned appointments
3. **Sample Collection**: Appointments in various stages of sample collection
4. **Lab Processing**: Appointments in lab and analyzing stages
5. **Completion**: Completed appointments with test results and reports

## 🎯 Testing Scenarios

### Patient Panel Testing
- **View upcoming appointments**: 10 appointments to test
- **View ongoing appointments**: 5 appointments to test
- **View completed appointments**: 8 appointments with reports
- **Status tracking**: All statuses represented

### Pathology Panel Testing
- **Assign phlebotomists**: 5 pending appointments available
- **Update status**: 5 ongoing appointments to manage
- **Upload reports**: 8 completed appointments to add reports
- **View patient details**: Complete patient information available

### Admin Panel Testing
- **View all bookings**: 23 total bookings
- **Track workflow**: All stages represented
- **Monitor phlebotomists**: 4 phlebotomists with various assignments

## 🚀 Ready for Testing

The system now has comprehensive test data covering:
- ✅ All workflow stages
- ✅ Various payment methods
- ✅ Different lab packages
- ✅ Multiple patients and phlebotomists
- ✅ Realistic test results and reports
- ✅ Proper status synchronization
- ✅ Complete patient and booking information

This data provides a robust foundation for testing all aspects of the centralized lab booking system across patient, pathology, and admin panels. 