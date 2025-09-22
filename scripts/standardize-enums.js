#!/usr/bin/env node

/**
 * Enum Standardization Script
 * 
 * This script standardizes all enum-like values in the database
 * to ensure consistency across the application.
 * 
 * Usage: node scripts/standardize-enums.js
 */

const { PrismaClient } = require('@prisma/client');

// Define enums directly in the script since we can't import TypeScript modules
const AppointmentStatus = {
  SCHEDULED: 'SCHEDULED',
  CONFIRMED: 'CONFIRMED', 
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  NO_SHOW: 'NO_SHOW',
  RESCHEDULED: 'RESCHEDULED'
};

const ConsultationType = {
  VIDEO: 'VIDEO',
  PHYSICAL: 'PHYSICAL',
  CLINIC: 'CLINIC'
};

const PaymentMethod = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE', 
  CLINIC: 'CLINIC',
  PLAN: 'PLAN',
  CASH: 'CASH',
  CARD: 'CARD'
};

const DoctorAvailabilityStatus = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED'
};

// Normalization functions
const normalizeAppointmentStatus = (status) => {
  const normalized = status.toUpperCase().trim();
  
  switch (normalized) {
    case 'SCHEDULED':
      return AppointmentStatus.SCHEDULED;
    case 'CONFIRMED':
      return AppointmentStatus.CONFIRMED;
    case 'IN_PROGRESS':
    case 'INPROGRESS':
      return AppointmentStatus.IN_PROGRESS;
    case 'COMPLETED':
      return AppointmentStatus.COMPLETED;
    case 'CANCELLED':
      return AppointmentStatus.CANCELLED;
    case 'NO_SHOW':
    case 'NOSHOW':
      return AppointmentStatus.NO_SHOW;
    case 'RESCHEDULED':
      return AppointmentStatus.RESCHEDULED;
    default:
      console.warn(`Unknown appointment status: ${status}, defaulting to SCHEDULED`);
      return AppointmentStatus.SCHEDULED;
  }
};

const normalizeConsultationType = (type) => {
  const normalized = type.toUpperCase().trim();
  
  switch (normalized) {
    case 'VIDEO':
      return ConsultationType.VIDEO;
    case 'PHYSICAL':
      return ConsultationType.PHYSICAL;
    case 'CLINIC':
      return ConsultationType.CLINIC;
    default:
      console.warn(`Unknown consultation type: ${type}, defaulting to PHYSICAL`);
      return ConsultationType.PHYSICAL;
  }
};

const normalizePaymentMethod = (method) => {
  const normalized = method.toUpperCase().trim();
  
  switch (normalized) {
    case 'ONLINE':
      return PaymentMethod.ONLINE;
    case 'OFFLINE':
      return PaymentMethod.OFFLINE;
    case 'CLINIC':
      return PaymentMethod.CLINIC;
    case 'PLAN':
      return PaymentMethod.PLAN;
    case 'CASH':
      return PaymentMethod.CASH;
    case 'CARD':
      return PaymentMethod.CARD;
    default:
      console.warn(`Unknown payment method: ${method}, defaulting to ONLINE`);
      return PaymentMethod.ONLINE;
  }
};

const normalizeDoctorAvailabilityStatus = (status) => {
  const normalized = status.toUpperCase().trim();
  
  switch (normalized) {
    case 'AVAILABLE':
      return DoctorAvailabilityStatus.AVAILABLE;
    case 'BOOKED':
      return DoctorAvailabilityStatus.BOOKED;
    case 'BLOCKED':
      return DoctorAvailabilityStatus.BLOCKED;
    case 'CANCELLED':
      return DoctorAvailabilityStatus.CANCELLED;
    default:
      console.warn(`Unknown doctor availability status: ${status}, defaulting to AVAILABLE`);
      return DoctorAvailabilityStatus.AVAILABLE;
  }
};

const prisma = new PrismaClient();

async function standardizeEnums() {
  console.log('🚀 Starting enum standardization process...');
  
  try {
    // ============================================================================
    // APPOINTMENT STATUS STANDARDIZATION
    // ============================================================================
    console.log('📋 Standardizing appointment statuses...');
    
    const appointments = await prisma.appointment.findMany({
      select: { id: true, status: true, consultationType: true }
    });
    
    for (const appointment of appointments) {
      const normalizedStatus = normalizeAppointmentStatus(appointment.status);
      const normalizedConsultationType = normalizeConsultationType(appointment.consultationType);
      
      if (appointment.status !== normalizedStatus || appointment.consultationType !== normalizedConsultationType) {
        await prisma.appointment.update({
          where: { id: appointment.id },
          data: {
            status: normalizedStatus,
            consultationType: normalizedConsultationType
          }
        });
        console.log(`✅ Updated appointment ${appointment.id}: ${appointment.status} → ${normalizedStatus}, ${appointment.consultationType} → ${normalizedConsultationType}`);
      }
    }
    
    // ============================================================================
    // DOCTOR AVAILABILITY STATUS STANDARDIZATION
    // ============================================================================
    console.log('📅 Standardizing doctor availability statuses...');
    
    const availabilities = await prisma.doctorAvailability.findMany({
      select: { id: true, status: true }
    });
    
    for (const availability of availabilities) {
      const normalizedStatus = normalizeDoctorAvailabilityStatus(availability.status);
      
      if (availability.status !== normalizedStatus) {
        await prisma.doctorAvailability.update({
          where: { id: availability.id },
          data: { status: normalizedStatus }
        });
        console.log(`✅ Updated availability ${availability.id}: ${availability.status} → ${normalizedStatus}`);
      }
    }
    
    // ============================================================================
    // PAYMENT METHOD STANDARDIZATION
    // ============================================================================
    console.log('💳 Standardizing payment methods...');
    
    const payments = await prisma.payment.findMany({
      select: { id: true, paymentMethod: true }
    });
    
    for (const payment of payments) {
      const normalizedMethod = normalizePaymentMethod(payment.paymentMethod);
      
      if (payment.paymentMethod !== normalizedMethod) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { paymentMethod: normalizedMethod }
        });
        console.log(`✅ Updated payment ${payment.id}: ${payment.paymentMethod} → ${normalizedMethod}`);
      }
    }
    
    // ============================================================================
    // LAB BOOKING STATUS STANDARDIZATION
    // ============================================================================
    console.log('🧪 Standardizing lab booking statuses...');
    
    try {
      const labBookings = await prisma.labBooking.findMany({
        select: { id: true, status: true }
      });
      
      for (const labBooking of labBookings) {
        const normalizedStatus = labBooking.status.toUpperCase();
        
        if (labBooking.status !== normalizedStatus) {
          await prisma.labBooking.update({
            where: { id: labBooking.id },
            data: { status: normalizedStatus }
          });
          console.log(`✅ Updated lab booking ${labBooking.id}: ${labBooking.status} → ${normalizedStatus}`);
        }
      }
    } catch (error) {
      console.log('⚠️ LabBooking model not found, skipping...');
    }
    
    // ============================================================================
    // PROCESSING STATUS STANDARDIZATION
    // ============================================================================
    console.log('⚙️ Standardizing processing statuses...');
    
    try {
      const prescriptionTexts = await prisma.prescriptionText.findMany({
        select: { id: true, processingStatus: true }
      });
      
      for (const prescriptionText of prescriptionTexts) {
        const normalizedStatus = prescriptionText.processingStatus.toUpperCase();
        
        if (prescriptionText.processingStatus !== normalizedStatus) {
          await prisma.prescriptionText.update({
            where: { id: prescriptionText.id },
            data: { processingStatus: normalizedStatus }
          });
          console.log(`✅ Updated prescription text ${prescriptionText.id}: ${prescriptionText.processingStatus} → ${normalizedStatus}`);
        }
      }
    } catch (error) {
      console.log('⚠️ PrescriptionText model not found, skipping...');
    }
    
    // ============================================================================
    // USER STATUS STANDARDIZATION
    // ============================================================================
    console.log('👤 Standardizing user statuses...');
    
    try {
      const users = await prisma.user.findMany({
        select: { id: true, status: true }
      });
      
      for (const user of users) {
        const normalizedStatus = user.status.toUpperCase();
        
        if (user.status !== normalizedStatus) {
          await prisma.user.update({
            where: { id: user.id },
            data: { status: normalizedStatus }
          });
          console.log(`✅ Updated user ${user.id}: ${user.status} → ${normalizedStatus}`);
        }
      }
    } catch (error) {
      console.log('⚠️ User model not found, skipping...');
    }
    
    // ============================================================================
    // DIET PLAN REQUEST STATUS STANDARDIZATION
    // ============================================================================
    console.log('🍎 Standardizing diet plan request statuses...');
    
    try {
      const dietPlanRequests = await prisma.dietPlanRequest.findMany({
        select: { id: true, status: true }
      });
      
      for (const dietPlanRequest of dietPlanRequests) {
        const normalizedStatus = dietPlanRequest.status.toUpperCase();
        
        if (dietPlanRequest.status !== normalizedStatus) {
          await prisma.dietPlanRequest.update({
            where: { id: dietPlanRequest.id },
            data: { status: normalizedStatus }
          });
          console.log(`✅ Updated diet plan request ${dietPlanRequest.id}: ${dietPlanRequest.status} → ${normalizedStatus}`);
        }
      }
    } catch (error) {
      console.log('⚠️ DietPlanRequest model not found, skipping...');
    }
    
    // ============================================================================
    // REPORT STATUS STANDARDIZATION
    // ============================================================================
    console.log('📊 Standardizing report statuses...');
    
    try {
      const reports = await prisma.standaloneReport.findMany({
        select: { id: true, status: true }
      });
      
      for (const report of reports) {
        const normalizedStatus = report.status.toUpperCase();
        
        if (report.status !== normalizedStatus) {
          await prisma.standaloneReport.update({
            where: { id: report.id },
            data: { status: normalizedStatus }
          });
          console.log(`✅ Updated report ${report.id}: ${report.status} → ${normalizedStatus}`);
        }
      }
    } catch (error) {
      console.log('⚠️ StandaloneReport model not found, skipping...');
    }
    
    // ============================================================================
    // COMPLAINT SEVERITY STANDARDIZATION
    // ============================================================================
    console.log('⚠️ Standardizing complaint severities...');
    
    try {
      const complaints = await prisma.prescriptionComplaint.findMany({
        select: { id: true, severity: true }
      });
      
      for (const complaint of complaints) {
        const normalizedSeverity = complaint.severity.toUpperCase();
        
        if (complaint.severity !== normalizedSeverity) {
          await prisma.prescriptionComplaint.update({
            where: { id: complaint.id },
            data: { severity: normalizedSeverity }
          });
          console.log(`✅ Updated complaint ${complaint.id}: ${complaint.severity} → ${normalizedSeverity}`);
        }
      }
    } catch (error) {
      console.log('⚠️ PrescriptionComplaint model not found, skipping...');
    }
    
    // ============================================================================
    // TREND SEVERITY STANDARDIZATION
    // ============================================================================
    console.log('📈 Standardizing trend severities...');
    
    try {
      const trends = await prisma.labTrend.findMany({
        select: { id: true, severity: true }
      });
      
      for (const trend of trends) {
        const normalizedSeverity = trend.severity.toUpperCase();
        
        if (trend.severity !== normalizedSeverity) {
          await prisma.labTrend.update({
            where: { id: trend.id },
            data: { severity: normalizedSeverity }
          });
          console.log(`✅ Updated trend ${trend.id}: ${trend.severity} → ${normalizedSeverity}`);
        }
      }
    } catch (error) {
      console.log('⚠️ LabTrend model not found, skipping...');
    }
    
    console.log('🎉 Enum standardization completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during enum standardization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the standardization if this script is executed directly
if (require.main === module) {
  standardizeEnums()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { standardizeEnums };
