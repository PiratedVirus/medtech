import prisma from '@/lib/prisma';
import { sendNotification } from '@/lib/firebase-admin';
import { NotificationType } from '@prisma/client';

export class NotificationService {
  // Get all active device tokens for a patient
  private static async getPatientDeviceTokens(patientId: number): Promise<string[]> {
    const tokens = await prisma.patientDeviceToken.findMany({
      where: {
        patientId,
        isActive: true,
      },
      select: {
        deviceToken: true,
      },
    });

    return tokens.map(token => token.deviceToken);
  }

  // Save notification to database
  private static async saveNotification(
    patientId: number,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ) {
    return await prisma.patientNotification.create({
      data: {
        patientId,
        type,
        title,
        message,
        data: data || {},
      },
    });
  }

  // Send notification and save to database
  private static async sendAndSave(
    patientId: number,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ) {
    try {
      // Get device tokens
      const deviceTokens = await this.getPatientDeviceTokens(patientId);
      
      // Send push notification
      if (deviceTokens.length > 0) {
        await sendNotification(deviceTokens, {
          title,
          body: message,
          data: {
            type,
            patientId: patientId.toString(),
            ...data,
          },
        });
      }

      // Save to database
      await this.saveNotification(patientId, type, title, message, data);
      
      console.log(`Notification sent to patient ${patientId}: ${title}`);
    } catch (error) {
      console.error(`Error sending notification to patient ${patientId}:`, error);
    }
  }

  // Appointment notifications
  static async sendAppointmentReminder(appointmentId: number) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        doctorAvailability: true,
      },
    });

    if (!appointment) return;

    const appointmentDate = new Date(appointment.doctorAvailability.date);
    const appointmentTime = appointment.doctorAvailability.startTime;
    const doctorName = appointment.doctor.name;

    await this.sendAndSave(
      appointment.patientId,
      'APPOINTMENT_REMINDER',
      'Appointment Reminder',
      `Your appointment with Dr. ${doctorName} is today at ${appointmentTime}`,
      {
        appointmentId: appointment.id,
        action: 'VIEW_APPOINTMENT',
        doctorName,
        appointmentTime,
        appointmentDate: appointmentDate.toISOString(),
      }
    );
  }

  static async sendAppointmentConfirmed(appointmentId: number) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        doctorAvailability: true,
      },
    });

    if (!appointment) return;

    const appointmentDate = new Date(appointment.doctorAvailability.date);
    const appointmentTime = appointment.doctorAvailability.startTime;
    const doctorName = appointment.doctor.name;

    await this.sendAndSave(
      appointment.patientId,
      'APPOINTMENT_CONFIRMED',
      'Appointment Confirmed',
      `Your appointment with Dr. ${doctorName} on ${appointmentDate.toLocaleDateString()} at ${appointmentTime} has been confirmed`,
      {
        appointmentId: appointment.id,
        action: 'VIEW_APPOINTMENT',
        doctorName,
        appointmentTime,
        appointmentDate: appointmentDate.toISOString(),
      }
    );
  }

  static async sendAppointmentCancelled(appointmentId: number, reason?: string) {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        patient: true,
        doctor: true,
        doctorAvailability: true,
      },
    });

    if (!appointment) return;

    const appointmentDate = new Date(appointment.doctorAvailability.date);
    const appointmentTime = appointment.doctorAvailability.startTime;
    const doctorName = appointment.doctor.name;

    await this.sendAndSave(
      appointment.patientId,
      'APPOINTMENT_CANCELLED',
      'Appointment Cancelled',
      `Your appointment with Dr. ${doctorName} on ${appointmentDate.toLocaleDateString()} at ${appointmentTime} has been cancelled${reason ? `. Reason: ${reason}` : ''}`,
      {
        appointmentId: appointment.id,
        action: 'RESCHEDULE_APPOINTMENT',
        doctorName,
        appointmentTime,
        appointmentDate: appointmentDate.toISOString(),
        reason,
      }
    );
  }

  // Diet plan notifications
  static async sendDietPlanReady(patientId: number, dieticianName: string, dietPlanId: number) {
    await this.sendAndSave(
      patientId,
      'DIET_PLAN_READY',
      'Diet Plan Ready!',
      `Your personalized diet plan from ${dieticianName} is ready to view`,
      {
        dietPlanId,
        action: 'VIEW_DIET_PLAN',
        dieticianName,
      }
    );
  }

  static async sendDietPlanRequestStatus(patientId: number, status: string, dieticianName: string) {
    const statusMessage = status === 'APPROVED' 
      ? `Your diet plan request has been approved by ${dieticianName}`
      : `Your diet plan request has been ${status.toLowerCase()} by ${dieticianName}`;

    await this.sendAndSave(
      patientId,
      'DIET_PLAN_REQUEST_STATUS',
      'Diet Plan Request Update',
      statusMessage,
      {
        status,
        action: status === 'APPROVED' ? 'VIEW_DIET_PLAN' : 'REQUEST_DIET_PLAN',
        dieticianName,
      }
    );
  }

  static async sendDietPlanFollowUp(patientId: number, dieticianName: string) {
    await this.sendAndSave(
      patientId,
      'DIET_PLAN_FOLLOW_UP',
      'How\'s Your Diet Journey Going?',
      `Hi! Are you following your diet plan? How's your journey going? Any doubts about your diet? Feel free to reach out!`,
      {
        dieticianName,
        action: 'CONTACT_DIETICIAN',
        priority: 'medium',
      }
    );
  }

  // Lab test notifications
  static async sendLabBookingConfirmed(patientId: number, labPackageName: string, labDate: string) {
    await this.sendAndSave(
      patientId,
      'LAB_BOOKING_CONFIRMED',
      'Lab Test Booked',
      `Your ${labPackageName} test has been booked for ${new Date(labDate).toLocaleDateString()}. Our phlebotomist will reach your location at the specified time - sit back and relax!`,
      {
        labPackageName,
        labDate,
        action: 'VIEW_LAB_BOOKING',
      }
    );
  }

  static async sendFollowUpAppointment(patientId: number, doctorName: string) {
    await this.sendAndSave(
      patientId,
      'FOLLOW_UP_APPOINTMENT',
      'Appointment Reminder',
      `Your appointment with Dr. ${doctorName} is to be scheduled. Please book your appointment to continue your treatment.`,
      {
        doctorName,
        action: 'BOOK_APPOINTMENT',
        priority: 'medium',
      }
    );
  }

  static async sendFollowUpLabTest(patientId: number, labPackageName: string) {
    await this.sendAndSave(
      patientId,
      'FOLLOW_UP_LAB_TEST',
      'Lab Test Reminder',
      `Your ${labPackageName} test is remaining to be scheduled. Please book your lab test to complete your health checkup.`,
      {
        labPackageName,
        action: 'BOOK_LAB_TEST',
        priority: 'medium',
      }
    );
  }

  static async sendLabSampleCollection(patientId: number, phlebotomistName: string, estimatedTime: string) {
    await this.sendAndSave(
      patientId,
      'LAB_SAMPLE_COLLECTION',
      'Sample Collection',
      `Phlebotomist ${phlebotomistName} is on the way to collect your sample. Estimated arrival: ${estimatedTime}`,
      {
        phlebotomistName,
        estimatedTime,
        action: 'TRACK_COLLECTION',
      }
    );
  }

  static async sendLabResultsReady(patientId: number, labPackageName: string, hasAbnormalResults: boolean = false) {
    const title = hasAbnormalResults ? 'Lab Results - Action Required' : 'Lab Results Ready';
    const message = hasAbnormalResults 
      ? `Your ${labPackageName} test results are ready. Some values are outside normal range - please consult your doctor.`
      : `Your ${labPackageName} test results are ready to view`;

    await this.sendAndSave(
      patientId,
      'LAB_RESULTS_READY',
      title,
      message,
      {
        labPackageName,
        hasAbnormalResults,
        action: 'VIEW_RESULTS',
        priority: hasAbnormalResults ? 'high' : 'normal',
      }
    );
  }

  // Prescription notifications
  static async sendPrescriptionReady(patientId: number, doctorName: string, prescriptionId: number) {
    await this.sendAndSave(
      patientId,
      'PRESCRIPTION_READY',
      'Prescription Ready',
      `Your prescription from Dr. ${doctorName} is ready for download`,
      {
        prescriptionId,
        action: 'VIEW_PRESCRIPTION',
        doctorName,
      }
    );
  }

  static async sendMedicineReminder(patientId: number, medicineName: string, dosage: string, time: string) {
    await this.sendAndSave(
      patientId,
      'MEDICINE_REMINDER',
      'Medicine Reminder',
      `Time to take your ${medicineName} - ${dosage} at ${time}`,
      {
        medicineName,
        dosage,
        time,
        action: 'MARK_TAKEN',
      }
    );
  }

  // Subscription notifications
  static async sendPlanExpiryWarning(patientId: number, planName: string, daysLeft: number) {
    await this.sendAndSave(
      patientId,
      'PLAN_EXPIRY_WARNING',
      'Plan Expiring Soon',
      `Your ${planName} expires in ${daysLeft} days. Renew now to continue your benefits!`,
      {
        planName,
        daysLeft,
        action: 'RENEW_PLAN',
      }
    );
  }

  static async sendPlanRenewed(patientId: number, planName: string, newEndDate: string) {
    await this.sendAndSave(
      patientId,
      'PLAN_RENEWED',
      'Plan Renewed Successfully',
      `Your ${planName} has been renewed successfully! New expiry date: ${new Date(newEndDate).toLocaleDateString()}`,
      {
        planName,
        newEndDate,
        action: 'VIEW_PLAN',
      }
    );
  }

  static async sendPlanSubscribed(patientId: number, planName: string) {
    await this.sendAndSave(
      patientId,
      'PLAN_SUBSCRIBED',
      'Welcome to Your Health Journey! 🎉',
      `Congratulations! Your ${planName} subscription is active. Your healthy journey begins now - get ready for a "NEW YOU"!`,
      {
        planName,
        action: 'VIEW_PLAN',
        priority: 'high',
      }
    );
  }

  static async sendConsultationReminder(patientId: number, consultationDate: string, consultationType: string) {
    await this.sendAndSave(
      patientId,
      'CONSULTATION_REMINDER',
      'Consultation Reminder',
      `You have a ${consultationType} consultation scheduled for ${new Date(consultationDate).toLocaleDateString()}. Book your appointment now!`,
      {
        consultationDate,
        consultationType,
        action: 'BOOK_APPOINTMENT',
      }
    );
  }

  // Health alerts
  static async sendHealthAlert(patientId: number, metricName: string, value: string, status: 'high' | 'low' | 'critical') {
    const statusMessage = status === 'critical' 
      ? 'critical' 
      : status === 'high' 
        ? 'high' 
        : 'low';

    await this.sendAndSave(
      patientId,
      'HEALTH_ALERT',
      'Health Alert',
      `Your ${metricName} reading is ${statusMessage}: ${value}. Please consult your doctor.`,
      {
        metricName,
        value,
        status,
        action: 'CONSULT_DOCTOR',
        priority: 'high',
      }
    );
  }

  // AI Summary notifications
  static async sendAISummaryReady(patientId: number, summaryType: string) {
    await this.sendAndSave(
      patientId,
      'AI_SUMMARY_READY',
      'Health Summary Updated',
      `Your ${summaryType} health summary has been updated with new insights`,
      {
        summaryType,
        action: 'VIEW_SUMMARY',
      }
    );
  }

  // Payment notifications
  static async sendPaymentSuccess(patientId: number, amount: number, service: string) {
    await this.sendAndSave(
      patientId,
      'PAYMENT_SUCCESS',
      'Payment Successful',
      `Payment of ₹${amount} for ${service} has been processed successfully`,
      {
        amount,
        service,
        action: 'VIEW_PAYMENT',
      }
    );
  }

  static async sendPaymentFailed(patientId: number, amount: number, service: string, reason?: string) {
    await this.sendAndSave(
      patientId,
      'PAYMENT_FAILED',
      'Payment Failed',
      `Payment of ₹${amount} for ${service} failed${reason ? `. Reason: ${reason}` : ''}. Please try again.`,
      {
        amount,
        service,
        reason,
        action: 'RETRY_PAYMENT',
      }
    );
  }

  // Bulk notification for multiple patients
  static async sendBulkNotification(
    patientIds: number[],
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ) {
    const promises = patientIds.map(patientId => 
      this.sendAndSave(patientId, type, title, message, data)
    );
    
    await Promise.all(promises);
  }
}
