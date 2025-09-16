/**
 * Standardized Enums for the CareDB Application
 * 
 * This file defines all enum-like values used throughout the application
 * to ensure consistency across the database, API, and frontend.
 */

// ============================================================================
// APPOINTMENT STATUS
// ============================================================================
export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED', 
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  RESCHEDULED = 'RESCHEDULED'
}

// ============================================================================
// CONSULTATION TYPES
// ============================================================================
export enum ConsultationType {
  VIDEO = 'VIDEO',
  PHYSICAL = 'PHYSICAL',
  CLINIC = 'CLINIC'
}

// ============================================================================
// PAYMENT METHODS
// ============================================================================
export enum PaymentMethod {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE', 
  CLINIC = 'CLINIC',
  PLAN = 'PLAN',
  CASH = 'CASH',
  CARD = 'CARD'
}

// ============================================================================
// DOCTOR AVAILABILITY STATUS
// ============================================================================
export enum DoctorAvailabilityStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED = 'BOOKED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED'
}

// ============================================================================
// LAB BOOKING STATUS
// ============================================================================
export enum LabBookingStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PHLEBOTOMIST_LEFT = 'PHLEBOTOMIST_LEFT',
  SAMPLE_COLLECTED = 'SAMPLE_COLLECTED',
  IN_LAB = 'IN_LAB',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

// ============================================================================
// PROCESSING STATUS
// ============================================================================
export enum ProcessingStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// ============================================================================
// USER STATUS
// ============================================================================
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED'
}

// ============================================================================
// DIET PLAN REQUEST STATUS
// ============================================================================
export enum DietPlanRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED'
}

// ============================================================================
// REPORT STATUS
// ============================================================================
export enum ReportStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

// ============================================================================
// COMPLAINT SEVERITY
// ============================================================================
export enum ComplaintSeverity {
  PERFECT = 'PERFECT',
  GOOD = 'GOOD',
  MODERATE = 'MODERATE',
  RISK = 'RISK',
  CRITICAL = 'CRITICAL'
}

// ============================================================================
// TREND SEVERITY
// ============================================================================
export enum TrendSeverity {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert legacy status values to standardized enum values
 */
export const normalizeAppointmentStatus = (status: string): AppointmentStatus => {
  const normalized = status.toUpperCase().trim();
  
  switch (normalized) {
    case 'SCHEDULED':
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

/**
 * Convert legacy consultation types to standardized enum values
 */
export const normalizeConsultationType = (type: string): ConsultationType => {
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

/**
 * Convert legacy payment methods to standardized enum values
 */
export const normalizePaymentMethod = (method: string): PaymentMethod => {
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

/**
 * Convert legacy doctor availability status to standardized enum values
 */
export const normalizeDoctorAvailabilityStatus = (status: string): DoctorAvailabilityStatus => {
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

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Get human-readable display text for appointment status
 */
export const getAppointmentStatusDisplay = (status: AppointmentStatus): string => {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return 'Scheduled';
    case AppointmentStatus.CONFIRMED:
      return 'Confirmed';
    case AppointmentStatus.IN_PROGRESS:
      return 'In Progress';
    case AppointmentStatus.COMPLETED:
      return 'Completed';
    case AppointmentStatus.CANCELLED:
      return 'Cancelled';
    case AppointmentStatus.NO_SHOW:
      return 'No Show';
    case AppointmentStatus.RESCHEDULED:
      return 'Rescheduled';
    default:
      return 'Unknown';
  }
};

/**
 * Get human-readable display text for consultation type
 */
export const getConsultationTypeDisplay = (type: ConsultationType): string => {
  switch (type) {
    case ConsultationType.VIDEO:
      return 'Video Consultation';
    case ConsultationType.PHYSICAL:
      return 'Physical Visit';
    case ConsultationType.CLINIC:
      return 'Clinic Visit';
    default:
      return 'Unknown';
  }
};

/**
 * Get human-readable display text for payment method
 */
export const getPaymentMethodDisplay = (method: PaymentMethod): string => {
  switch (method) {
    case PaymentMethod.ONLINE:
      return 'Online Payment';
    case PaymentMethod.OFFLINE:
      return 'Offline Payment';
    case PaymentMethod.CLINIC:
      return 'Clinic Payment';
    case PaymentMethod.PLAN:
      return 'Subscription Plan';
    case PaymentMethod.CASH:
      return 'Cash Payment';
    case PaymentMethod.CARD:
      return 'Card Payment';
    default:
      return 'Unknown';
  }
};
