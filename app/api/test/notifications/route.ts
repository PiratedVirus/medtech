import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/notification-service';

export async function POST(request: NextRequest) {
  try {
    const { type, patientId, data } = await request.json();

    if (!type || !patientId) {
      return NextResponse.json(
        { success: false, error: 'Type and patientId are required' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'appointment_reminder':
        result = await NotificationService.sendAppointmentReminder(data.appointmentId);
        break;
      case 'appointment_confirmed':
        result = await NotificationService.sendAppointmentConfirmed(data.appointmentId);
        break;
      case 'appointment_cancelled':
        result = await NotificationService.sendAppointmentCancelled(data.appointmentId, data.reason);
        break;
      case 'diet_plan_ready':
        result = await NotificationService.sendDietPlanReady(patientId, data.dieticianName, data.dietPlanId);
        break;
      case 'diet_plan_request_status':
        result = await NotificationService.sendDietPlanRequestStatus(patientId, data.status, data.dieticianName);
        break;
      case 'lab_booking_confirmed':
        result = await NotificationService.sendLabBookingConfirmed(patientId, data.labPackageName, data.labDate);
        break;
      case 'lab_sample_collection':
        result = await NotificationService.sendLabSampleCollection(patientId, data.phlebotomistName, data.estimatedTime);
        break;
      case 'lab_results_ready':
        result = await NotificationService.sendLabResultsReady(patientId, data.labPackageName, data.hasAbnormalResults);
        break;
      case 'prescription_ready':
        result = await NotificationService.sendPrescriptionReady(patientId, data.doctorName, data.prescriptionId);
        break;
      case 'medicine_reminder':
        result = await NotificationService.sendMedicineReminder(patientId, data.medicineName, data.dosage, data.time);
        break;
      case 'plan_expiry_warning':
        result = await NotificationService.sendPlanExpiryWarning(patientId, data.planName, data.daysLeft);
        break;
      case 'plan_renewed':
        result = await NotificationService.sendPlanRenewed(patientId, data.planName, data.newEndDate);
        break;
      case 'consultation_reminder':
        result = await NotificationService.sendConsultationReminder(patientId, data.consultationDate, data.consultationType);
        break;
      case 'health_alert':
        result = await NotificationService.sendHealthAlert(patientId, data.metricName, data.value, data.status);
        break;
      case 'ai_summary_ready':
        result = await NotificationService.sendAISummaryReady(patientId, data.summaryType);
        break;
      case 'payment_success':
        result = await NotificationService.sendPaymentSuccess(patientId, data.amount, data.service);
        break;
      case 'payment_failed':
        result = await NotificationService.sendPaymentFailed(patientId, data.amount, data.service, data.reason);
        break;
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: `Notification sent successfully`,
      type,
      patientId,
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}
