/**
 * TypeScript types for standardized enums
 * 
 * This file provides type definitions for all enum-like values
 * used throughout the application.
 */

// Re-export all enums from the constants file
export {
  AppointmentStatus,
  ConsultationType,
  PaymentMethod,
  DoctorAvailabilityStatus,
  LabBookingStatus,
  ProcessingStatus,
  UserStatus,
  DietPlanRequestStatus,
  ReportStatus,
  ComplaintSeverity,
  TrendSeverity,
  normalizeAppointmentStatus,
  normalizeConsultationType,
  normalizePaymentMethod,
  normalizeDoctorAvailabilityStatus,
  getAppointmentStatusDisplay,
  getConsultationTypeDisplay,
  getPaymentMethodDisplay
} from '../lib/constants/enums';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Type for appointment status values
 */
export type AppointmentStatusType = keyof typeof import('../lib/constants/enums').AppointmentStatus;

/**
 * Type for consultation type values
 */
export type ConsultationTypeType = keyof typeof import('../lib/constants/enums').ConsultationType;

/**
 * Type for payment method values
 */
export type PaymentMethodType = keyof typeof import('../lib/constants/enums').PaymentMethod;

/**
 * Type for doctor availability status values
 */
export type DoctorAvailabilityStatusType = keyof typeof import('../lib/constants/enums').DoctorAvailabilityStatus;

/**
 * Type for lab booking status values
 */
export type LabBookingStatusType = keyof typeof import('../lib/constants/enums').LabBookingStatus;

/**
 * Type for processing status values
 */
export type ProcessingStatusType = keyof typeof import('../lib/constants/enums').ProcessingStatus;

/**
 * Type for user status values
 */
export type UserStatusType = keyof typeof import('../lib/constants/enums').UserStatus;

/**
 * Type for diet plan request status values
 */
export type DietPlanRequestStatusType = keyof typeof import('../lib/constants/enums').DietPlanRequestStatus;

/**
 * Type for report status values
 */
export type ReportStatusType = keyof typeof import('../lib/constants/enums').ReportStatus;

/**
 * Type for complaint severity values
 */
export type ComplaintSeverityType = keyof typeof import('../lib/constants/enums').ComplaintSeverity;

/**
 * Type for trend severity values
 */
export type TrendSeverityType = keyof typeof import('../lib/constants/enums').TrendSeverity;

// ============================================================================
// INTERFACE DEFINITIONS
// ============================================================================

/**
 * Interface for appointment with standardized status
 */
export interface StandardizedAppointment {
  id: number;
  status: AppointmentStatusType;
  consultationType: ConsultationTypeType;
  patientId: number;
  userId: number;
  // ... other appointment fields
}

/**
 * Interface for payment with standardized method
 */
export interface StandardizedPayment {
  id: number;
  paymentMethod: PaymentMethodType;
  amount: number;
  // ... other payment fields
}

/**
 * Interface for doctor availability with standardized status
 */
export interface StandardizedDoctorAvailability {
  id: number;
  status: DoctorAvailabilityStatusType;
  userId: number;
  date: Date;
  // ... other availability fields
}

/**
 * Interface for lab booking with standardized status
 */
export interface StandardizedLabBooking {
  id: number;
  status: LabBookingStatusType;
  patientId: number;
  // ... other lab booking fields
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Utility type to extract enum values as union types
 */
export type EnumValues<T> = T[keyof T];

/**
 * Utility type for status fields that can be any of the standardized statuses
 */
export type AnyStatus = 
  | AppointmentStatusType
  | DoctorAvailabilityStatusType
  | LabBookingStatusType
  | ProcessingStatusType
  | UserStatusType
  | DietPlanRequestStatusType
  | ReportStatusType;

/**
 * Utility type for severity fields
 */
export type AnySeverity = 
  | ComplaintSeverityType
  | TrendSeverityType;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

import { AppointmentStatus, ConsultationType, PaymentMethod, DoctorAvailabilityStatus } from '../lib/constants/enums';

/**
 * Check if a string is a valid appointment status
 */
export const isValidAppointmentStatus = (status: string): status is AppointmentStatusType => {
  return Object.values(AppointmentStatus).includes(status as any);
};

/**
 * Check if a string is a valid consultation type
 */
export const isValidConsultationType = (type: string): type is ConsultationTypeType => {
  return Object.values(ConsultationType).includes(type as any);
};

/**
 * Check if a string is a valid payment method
 */
export const isValidPaymentMethod = (method: string): method is PaymentMethodType => {
  return Object.values(PaymentMethod).includes(method as any);
};

/**
 * Check if a string is a valid doctor availability status
 */
export const isValidDoctorAvailabilityStatus = (status: string): status is DoctorAvailabilityStatusType => {
  return Object.values(DoctorAvailabilityStatus).includes(status as any);
};
