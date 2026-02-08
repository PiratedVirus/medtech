import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';
import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';

/**
 * Test endpoint for triggering notifications manually
 * 
 * Usage examples:
 * 
 * 1. Send appointment reminder:
 *    POST /api/test/notifications
 *    Body: { type: 'APPOINTMENT_REMINDER', appointmentId: 123 }
 * 
 * 2. Send custom notification to a patient:
 *    POST /api/test/notifications
 *    Body: { type: 'CUSTOM', patientId: 1, title: 'Test', message: 'This is a test' }
 * 
 * 3. Send all notification types to a patient (for testing UI):
 *    POST /api/test/notifications
 *    Body: { type: 'ALL', patientId: 1 }
 */

export async function POST(request: NextRequest) {
  try {
    // Only allow in development or with proper authentication
    if (process.env.NODE_ENV === 'production') {
      // In production, require admin authentication
      const cookieStore = await request.cookies;
      const token = cookieStore.get('adminToken')?.value;
      
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Authentication required in production' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    const { type, patientId, appointmentId, ...customData } = body;

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Notification type is required' },
        { status: 400 }
      );
    }

    // If patientId not provided, try to get first patient
    let targetPatientId = patientId;
    if (!targetPatientId) {
      const firstPatient = await prisma.user.findFirst({
        where: { role: 'PATIENT' },
        select: { id: true },
      });
      
      if (!firstPatient) {
        return NextResponse.json(
          { success: false, error: 'No patient found. Please provide patientId' },
          { status: 404 }
        );
      }
      targetPatientId = firstPatient.id;
    }

    const results: any[] = [];

    // Send all notification types for testing UI
    if (type === 'ALL') {
      const notificationTypes: Array<{ type: NotificationType; method: string; params: any[] }> = [
        {
          type: 'APPOINTMENT_REMINDER',
          method: 'sendAppointmentReminder',
          params: appointmentId ? [appointmentId] : [],
        },
        {
          type: 'APPOINTMENT_CONFIRMED',
          method: 'sendAppointmentConfirmed',
          params: appointmentId ? [appointmentId] : [],
        },
        {
          type: 'APPOINTMENT_CANCELLED',
          method: 'sendAppointmentCancelled',
          params: appointmentId ? [appointmentId, 'Test cancellation'] : [],
        },
        {
          type: 'DIET_PLAN_READY',
          method: 'sendDietPlanReady',
          params: [targetPatientId, 'Dr. Test Dietician', 1],
        },
        {
          type: 'DIET_PLAN_REQUEST_STATUS',
          method: 'sendDietPlanRequestStatus',
          params: [targetPatientId, 'APPROVED', 'Dr. Test Dietician'],
        },
        {
          type: 'LAB_RESULTS_READY',
          method: 'sendLabResultsReady',
          params: [targetPatientId, 'Complete Blood Count', false],
        },
        {
          type: 'LAB_SAMPLE_COLLECTION',
          method: 'sendLabSampleCollection',
          params: [targetPatientId, 'John Phlebotomist', '30 minutes'],
        },
        {
          type: 'PRESCRIPTION_READY',
          method: 'sendPrescriptionReady',
          params: [targetPatientId, 'Dr. Test Doctor', 1],
        },
        {
          type: 'MEDICINE_REMINDER',
          method: 'sendMedicineReminder',
          params: [targetPatientId, 'Paracetamol', '500mg', '10:00 AM'],
        },
        {
          type: 'PLAN_EXPIRY_WARNING',
          method: 'sendPlanExpiryWarning',
          params: [targetPatientId, 'Premium Plan', 7],
        },
        {
          type: 'PLAN_RENEWED',
          method: 'sendPlanRenewed',
          params: [targetPatientId, 'Premium Plan', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()],
        },
        {
          type: 'PLAN_SUBSCRIBED',
          method: 'sendPlanSubscribed',
          params: [targetPatientId, 'Premium Plan'],
        },
        {
          type: 'CONSULTATION_REMINDER',
          method: 'sendConsultationReminder',
          params: [targetPatientId, new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), 'Doctor Consultation'],
        },
        {
          type: 'HEALTH_ALERT',
          method: 'sendHealthAlert',
          params: [targetPatientId, 'Blood Sugar', '180 mg/dL', 'high'],
        },
        {
          type: 'AI_SUMMARY_READY',
          method: 'sendAISummaryReady',
          params: [targetPatientId, 'Monthly Health'],
        },
        {
          type: 'PAYMENT_SUCCESS',
          method: 'sendPaymentSuccess',
          params: [targetPatientId, 5000, 'Premium Plan'],
        },
        {
          type: 'PAYMENT_FAILED',
          method: 'sendPaymentFailed',
          params: [targetPatientId, 5000, 'Premium Plan', 'Insufficient funds'],
        },
        {
          type: 'LAB_BOOKING_CONFIRMED',
          method: 'sendLabBookingConfirmed',
          params: [targetPatientId, 'Complete Blood Count', new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()],
        },
        {
          type: 'FOLLOW_UP_APPOINTMENT',
          method: 'sendFollowUpAppointment',
          params: [targetPatientId, 'Dr. Test Doctor'],
        },
        {
          type: 'FOLLOW_UP_LAB_TEST',
          method: 'sendFollowUpLabTest',
          params: [targetPatientId, 'Complete Blood Count'],
        },
      ];

      for (const notif of notificationTypes) {
        try {
          // Skip appointment-related notifications if no appointmentId
          if (notif.type.includes('APPOINTMENT') && !appointmentId) {
            continue;
          }

          // @ts-ignore - Dynamic method call
          await NotificationService[notif.method](...notif.params);
          results.push({ type: notif.type, status: 'success' });
        } catch (error) {
          results.push({
            type: notif.type,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Sent ${results.filter(r => r.status === 'success').length} notifications`,
        results,
      });
    }

    // Handle specific notification types
    switch (type) {
      case 'APPOINTMENT_REMINDER':
        if (!appointmentId) {
          return NextResponse.json(
            { success: false, error: 'appointmentId is required for APPOINTMENT_REMINDER' },
            { status: 400 }
          );
        }
        await NotificationService.sendAppointmentReminder(appointmentId);
        break;

      case 'APPOINTMENT_CONFIRMED':
        if (!appointmentId) {
          return NextResponse.json(
            { success: false, error: 'appointmentId is required for APPOINTMENT_CONFIRMED' },
            { status: 400 }
          );
        }
        await NotificationService.sendAppointmentConfirmed(appointmentId);
        break;

      case 'APPOINTMENT_CANCELLED':
        if (!appointmentId) {
          return NextResponse.json(
            { success: false, error: 'appointmentId is required for APPOINTMENT_CANCELLED' },
            { status: 400 }
          );
        }
        await NotificationService.sendAppointmentCancelled(appointmentId, customData.reason);
        break;

      case 'DIET_PLAN_READY':
        await NotificationService.sendDietPlanReady(
          targetPatientId,
          customData.dieticianName || 'Dr. Test Dietician',
          customData.dietPlanId || 1
        );
        break;

      case 'DIET_PLAN_REQUEST_STATUS':
        await NotificationService.sendDietPlanRequestStatus(
          targetPatientId,
          customData.status || 'APPROVED',
          customData.dieticianName || 'Dr. Test Dietician'
        );
        break;

      case 'LAB_RESULTS_READY':
        await NotificationService.sendLabResultsReady(
          targetPatientId,
          customData.labPackageName || 'Complete Blood Count',
          customData.hasAbnormalResults || false
        );
        break;

      case 'LAB_SAMPLE_COLLECTION':
        await NotificationService.sendLabSampleCollection(
          targetPatientId,
          customData.phlebotomistName || 'John Phlebotomist',
          customData.estimatedTime || '30 minutes'
        );
        break;

      case 'PRESCRIPTION_READY':
        await NotificationService.sendPrescriptionReady(
          targetPatientId,
          customData.doctorName || 'Dr. Test Doctor',
          customData.prescriptionId || 1
        );
        break;

      case 'MEDICINE_REMINDER':
        await NotificationService.sendMedicineReminder(
          targetPatientId,
          customData.medicineName || 'Paracetamol',
          customData.dosage || '500mg',
          customData.time || '10:00 AM'
        );
        break;

      case 'PLAN_EXPIRY_WARNING':
        await NotificationService.sendPlanExpiryWarning(
          targetPatientId,
          customData.planName || 'Premium Plan',
          customData.daysLeft || 7
        );
        break;

      case 'PLAN_RENEWED':
        await NotificationService.sendPlanRenewed(
          targetPatientId,
          customData.planName || 'Premium Plan',
          customData.newEndDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        );
        break;

      case 'PLAN_SUBSCRIBED':
        await NotificationService.sendPlanSubscribed(
          targetPatientId,
          customData.planName || 'Premium Plan'
        );
        break;

      case 'CONSULTATION_REMINDER':
        await NotificationService.sendConsultationReminder(
          targetPatientId,
          customData.consultationDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          customData.consultationType || 'Doctor Consultation'
        );
        break;

      case 'HEALTH_ALERT':
        await NotificationService.sendHealthAlert(
          targetPatientId,
          customData.metricName || 'Blood Sugar',
          customData.value || '180 mg/dL',
          customData.status || 'high'
        );
        break;

      case 'AI_SUMMARY_READY':
        await NotificationService.sendAISummaryReady(
          targetPatientId,
          customData.summaryType || 'Monthly Health'
        );
        break;

      case 'PAYMENT_SUCCESS':
        await NotificationService.sendPaymentSuccess(
          targetPatientId,
          customData.amount || 5000,
          customData.service || 'Premium Plan'
        );
        break;

      case 'PAYMENT_FAILED':
        await NotificationService.sendPaymentFailed(
          targetPatientId,
          customData.amount || 5000,
          customData.service || 'Premium Plan',
          customData.reason
        );
        break;

      case 'LAB_BOOKING_CONFIRMED':
        await NotificationService.sendLabBookingConfirmed(
          targetPatientId,
          customData.labPackageName || 'Complete Blood Count',
          customData.labDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        );
        break;

      case 'FOLLOW_UP_APPOINTMENT':
        await NotificationService.sendFollowUpAppointment(
          targetPatientId,
          customData.doctorName || 'Dr. Test Doctor'
        );
        break;

      case 'FOLLOW_UP_LAB_TEST':
        await NotificationService.sendFollowUpLabTest(
          targetPatientId,
          customData.labPackageName || 'Complete Blood Count'
        );
        break;

      case 'CUSTOM':
        if (!customData.title || !customData.message) {
          return NextResponse.json(
            { success: false, error: 'title and message are required for CUSTOM notifications' },
            { status: 400 }
          );
        }
        await NotificationService.sendBulkNotification(
          [targetPatientId],
          customData.notificationType || 'HEALTH_ALERT',
          customData.title,
          customData.message,
          customData.data
        );
        break;

      default:
        return NextResponse.json(
          { success: false, error: `Unknown notification type: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Notification ${type} sent successfully to patient ${targetPatientId}`,
      patientId: targetPatientId,
      type,
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send notification',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to list available notification types and examples
 */
export async function GET() {
  const examples = {
    message: 'Use POST to send test notifications',
    availableTypes: [
      'APPOINTMENT_REMINDER',
      'APPOINTMENT_CONFIRMED',
      'APPOINTMENT_CANCELLED',
      'DIET_PLAN_READY',
      'DIET_PLAN_REQUEST_STATUS',
      'LAB_RESULTS_READY',
      'LAB_SAMPLE_COLLECTION',
      'PRESCRIPTION_READY',
      'MEDICINE_REMINDER',
      'PLAN_EXPIRY_WARNING',
      'PLAN_RENEWED',
      'PLAN_SUBSCRIBED',
      'CONSULTATION_REMINDER',
      'HEALTH_ALERT',
      'AI_SUMMARY_READY',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED',
      'LAB_BOOKING_CONFIRMED',
      'FOLLOW_UP_APPOINTMENT',
      'FOLLOW_UP_LAB_TEST',
      'CUSTOM',
      'ALL', // Sends all notification types for UI testing
    ],
    examples: {
      sendSingleNotification: {
        method: 'POST',
        url: '/api/test/notifications',
        body: {
          type: 'APPOINTMENT_REMINDER',
          appointmentId: 123,
        },
      },
      sendToSpecificPatient: {
        method: 'POST',
        url: '/api/test/notifications',
        body: {
          type: 'LAB_RESULTS_READY',
          patientId: 1,
          labPackageName: 'Complete Blood Count',
          hasAbnormalResults: false,
        },
      },
      sendAllNotifications: {
        method: 'POST',
        url: '/api/test/notifications',
        body: {
          type: 'ALL',
          patientId: 1, // Optional, will use first patient if not provided
        },
      },
      sendCustomNotification: {
        method: 'POST',
        url: '/api/test/notifications',
        body: {
          type: 'CUSTOM',
          patientId: 1,
          title: 'Custom Test Notification',
          message: 'This is a custom test notification',
          notificationType: 'HEALTH_ALERT',
          data: { customField: 'customValue' },
        },
      },
    },
  };

  return NextResponse.json(examples);
}




