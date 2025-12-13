/**
 * Complete Event-Driven Cache Invalidation System
 * Covers both Redis (server-side) and React Query (client-side)
 */

import { QueryClient } from '@tanstack/react-query';
import { SmartCacheInvalidation } from './cache-dependencies';
import { cacheUtils } from './redis';

/**
 * Cache Event Types
 * Defines all possible cache invalidation events in the application
 */
export enum CacheEventType {
  // Doctor Events
  DOCTOR_CREATED = 'doctor.created',
  DOCTOR_UPDATED = 'doctor.updated',
  DOCTOR_DELETED = 'doctor.deleted',
  DOCTOR_STATUS_CHANGED = 'doctor.status_changed',
  DOCTOR_FEE_CHANGED = 'doctor.fee_changed',
  
  // User Events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_SUBSCRIPTION_CHANGED = 'user.subscription_changed',
  
  // Appointment Events
  APPOINTMENT_CREATED = 'appointment.created',
  APPOINTMENT_UPDATED = 'appointment.updated',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  
  // Lab Events
  LAB_BOOKING_CREATED = 'lab.booking_created',
  LAB_RESULT_UPDATED = 'lab.result_updated',
  LAB_ANALYSIS_COMPLETED = 'lab.analysis_completed',
  
  // Prescription Events
  PRESCRIPTION_CREATED = 'prescription.created',
  PRESCRIPTION_UPDATED = 'prescription.updated',
  PRESCRIPTION_DELETED = 'prescription.deleted',
  
  // Analytics Events
  INSIGHTS_UPDATED = 'insights.updated',
  METRICS_TRACKED = 'metrics.tracked',
  NOTIFICATION_SENT = 'notification.sent'
}

/**
 * Cache Event Data Interface
 */
export interface CacheEventData {
  eventType: CacheEventType;
  entityId: number;
  entityType: 'doctor' | 'user' | 'appointment' | 'lab' | 'prescription' | 'insights';
  changes?: Record<string, any>;
  clinicId?: number;
  patientId?: number;
  doctorId?: number;
}

/**
 * Unified Cache Event System
 * Handles both Redis and React Query invalidation
 */
export class CacheEventSystem {
  private static queryClient: QueryClient | null = null;

  /**
   * Initialize the cache event system with React Query client
   */
  static initialize(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  /**
   * Emit a cache invalidation event
   * Automatically handles both Redis and React Query invalidation
   */
  static async emit(eventData: CacheEventData): Promise<void> {
    try {
      console.log(`[CACHE-EVENT] Emitting event: ${eventData.eventType}`, eventData);
      
      // Handle Redis (server-side) invalidation
      await this.handleRedisInvalidation(eventData);
      
      // Handle React Query (client-side) invalidation
      await this.handleReactQueryInvalidation(eventData);
      
      console.log(`[CACHE-EVENT] Successfully processed event: ${eventData.eventType}`);
    } catch (error) {
      console.error(`[CACHE-EVENT] Error processing event ${eventData.eventType}:`, error);
    }
  }

  /**
   * Handle Redis (server-side) cache invalidation
   */
  private static async handleRedisInvalidation(eventData: CacheEventData): Promise<void> {
    const { eventType, entityId, changes, clinicId, patientId, doctorId } = eventData;

    switch (eventType) {
      // Doctor Events
      case CacheEventType.DOCTOR_CREATED:
      case CacheEventType.DOCTOR_UPDATED:
        await SmartCacheInvalidation.onDoctorUpdate(entityId, changes || {}, clinicId);
        break;
        
      case CacheEventType.DOCTOR_DELETED:
        await SmartCacheInvalidation.onDoctorUpdate(entityId, { deleted: true }, clinicId);
        break;
        
      case CacheEventType.DOCTOR_FEE_CHANGED:
        await SmartCacheInvalidation.onDoctorUpdate(entityId, { consultationFee: changes?.consultationFee }, clinicId);
        break;

      // User Events
      case CacheEventType.USER_CREATED:
      case CacheEventType.USER_UPDATED:
        await SmartCacheInvalidation.onUserUpdate(entityId, changes || {});
        break;
        
      case CacheEventType.USER_SUBSCRIPTION_CHANGED:
        await SmartCacheInvalidation.onUserUpdate(entityId, { subscription: changes?.subscription });
        break;

      // Appointment Events
      case CacheEventType.APPOINTMENT_CREATED:
      case CacheEventType.APPOINTMENT_UPDATED:
      case CacheEventType.APPOINTMENT_CANCELLED:
      case CacheEventType.APPOINTMENT_COMPLETED:
        if (patientId) {
          await SmartCacheInvalidation.onAppointmentUpdate(patientId, doctorId);
        }
        break;

      // Lab Events
      case CacheEventType.LAB_BOOKING_CREATED:
      case CacheEventType.LAB_RESULT_UPDATED:
      case CacheEventType.LAB_ANALYSIS_COMPLETED:
        if (patientId) {
          await SmartCacheInvalidation.onLabResultUpdate(patientId);
        }
        break;

      // Insights Events
      case CacheEventType.INSIGHTS_UPDATED:
      case CacheEventType.METRICS_TRACKED:
        if (patientId) {
          await cacheUtils.invalidate(`insights:${patientId}`);
        }
        break;
    }
  }

  /**
   * Handle React Query (client-side) cache invalidation
   */
  private static async handleReactQueryInvalidation(eventData: CacheEventData): Promise<void> {
    if (!this.queryClient) {
      console.warn('[CACHE-EVENT] React Query client not initialized');
      return;
    }

    const { eventType, entityId, patientId, doctorId } = eventData;

    switch (eventType) {
      // Doctor Events
      case CacheEventType.DOCTOR_CREATED:
      case CacheEventType.DOCTOR_UPDATED:
      case CacheEventType.DOCTOR_DELETED:
      case CacheEventType.DOCTOR_FEE_CHANGED:
        // Invalidate doctor-related queries
        await this.queryClient.invalidateQueries({ queryKey: ['doctors'] });
        await this.queryClient.invalidateQueries({ queryKey: ['doctor', entityId] });
        await this.queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
        break;

      // User Events
      case CacheEventType.USER_CREATED:
      case CacheEventType.USER_UPDATED:
      case CacheEventType.USER_DELETED:
      case CacheEventType.USER_SUBSCRIPTION_CHANGED:
        // Invalidate user-related queries
        await this.queryClient.invalidateQueries({ queryKey: ['userProfile'] });
        await this.queryClient.invalidateQueries({ queryKey: ['user', entityId] });
        await this.queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        break;

      // Appointment Events
      case CacheEventType.APPOINTMENT_CREATED:
      case CacheEventType.APPOINTMENT_UPDATED:
      case CacheEventType.APPOINTMENT_CANCELLED:
      case CacheEventType.APPOINTMENT_COMPLETED:
        // Invalidate appointment-related queries
        await this.queryClient.invalidateQueries({ queryKey: ['appointments'] });
        await this.queryClient.invalidateQueries({ queryKey: ['upcomingAppointment'] });
        await this.queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        if (patientId) {
          await this.queryClient.invalidateQueries({ queryKey: ['appointments', patientId] });
        }
        if (doctorId) {
          await this.queryClient.invalidateQueries({ queryKey: ['doctor-appointments', doctorId] });
        }
        break;

      // Lab Events
      case CacheEventType.LAB_BOOKING_CREATED:
      case CacheEventType.LAB_RESULT_UPDATED:
      case CacheEventType.LAB_ANALYSIS_COMPLETED:
        // Invalidate lab-related queries
        await this.queryClient.invalidateQueries({ queryKey: ['labResults'] });
        await this.queryClient.invalidateQueries({ queryKey: ['labs'] });
        if (patientId) {
          await this.queryClient.invalidateQueries({ queryKey: ['labResults', patientId] });
        }
        break;

      // Insights Events
      case CacheEventType.INSIGHTS_UPDATED:
      case CacheEventType.METRICS_TRACKED:
        // Invalidate insights-related queries
        await this.queryClient.invalidateQueries({ queryKey: ['insights'] });
        await this.queryClient.invalidateQueries({ queryKey: ['insightsPanel'] });
        await this.queryClient.invalidateQueries({ queryKey: ['health-insights'] });
        if (patientId) {
          await this.queryClient.invalidateQueries({ queryKey: ['insights', patientId] });
        }
        break;

      // Notification Events
      case CacheEventType.NOTIFICATION_SENT:
        // Invalidate notification queries
        await this.queryClient.invalidateQueries({ queryKey: ['notifications'] });
        await this.queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
        break;
    }
  }
}

/**
 * Convenience functions for common cache events
 */
export class CacheEvents {
  /**
   * Emit doctor-related events
   */
  static async doctorCreated(doctorId: number, clinicId?: number) {
    await CacheEventSystem.emit({
      eventType: CacheEventType.DOCTOR_CREATED,
      entityId: doctorId,
      entityType: 'doctor',
      clinicId
    });
  }

  static async doctorUpdated(doctorId: number, changes: Record<string, any>, clinicId?: number) {
    await CacheEventSystem.emit({
      eventType: CacheEventType.DOCTOR_UPDATED,
      entityId: doctorId,
      entityType: 'doctor',
      changes,
      clinicId
    });
  }

  static async doctorFeeChanged(doctorId: number, newFee: number, clinicId?: number) {
    await CacheEventSystem.emit({
      eventType: CacheEventType.DOCTOR_FEE_CHANGED,
      entityId: doctorId,
      entityType: 'doctor',
      changes: { consultationFee: newFee },
      clinicId
    });
  }

  /**
   * Emit user-related events
   */
  static async userUpdated(userId: number, changes: Record<string, any>) {
    await CacheEventSystem.emit({
      eventType: CacheEventType.USER_UPDATED,
      entityId: userId,
      entityType: 'user',
      changes
    });
  }

  static async userSubscriptionChanged(userId: number, subscriptionData: any) {
    await CacheEventSystem.emit({
      eventType: CacheEventType.USER_SUBSCRIPTION_CHANGED,
      entityId: userId,
      entityType: 'user',
      changes: { subscription: subscriptionData }
    });
  }

  /**
   * Emit appointment-related events
   */
  static async appointmentCreated(patientId: number, doctorId?: number) {
    await CacheEventSystem.emit({
      eventType: CacheEventType.APPOINTMENT_CREATED,
      entityId: patientId,
      entityType: 'appointment',
      patientId,
      doctorId
    });
  }

  static async appointmentCompleted(patientId: number, doctorId?: number) {
    await CacheEventSystem.emit({
      eventType: CacheEventType.APPOINTMENT_COMPLETED,
      entityId: patientId,
      entityType: 'appointment',
      patientId,
      doctorId
    });
  }

  /**
   * Emit lab-related events
   */
  static async labResultUpdated(patientId: number) {
    await CacheEventSystem.emit({
      eventType: CacheEventType.LAB_RESULT_UPDATED,
      entityId: patientId,
      entityType: 'lab',
      patientId
    });
  }

  /**
   * Emit insights-related events
   */
  static async insightsUpdated(patientId: number) {
    await CacheEventSystem.emit({
      eventType: CacheEventType.INSIGHTS_UPDATED,
      entityId: patientId,
      entityType: 'insights',
      patientId
    });
  }
}
