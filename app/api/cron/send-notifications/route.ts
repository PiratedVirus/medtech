import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { NotificationService } from '@/lib/notification-service';
import { AppointmentStatus, LabBookingStatus } from '@/lib/constants/enums';

export async function GET() {
  try {
    console.log('🔄 Starting scheduled notification job...');
    const now = new Date();
    
    // 1. Appointment reminders (same day)
    console.log('📅 Checking for same-day appointment reminders...');
    const todayAppointments = await prisma.appointment.findMany({
      where: {
        doctorAvailability: {
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          }
        },
        status: {
          in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED, LabBookingStatus.PENDING]
        },
        deletedAt: null,
      },
      include: {
        patient: true,
        doctor: true,
        doctorAvailability: true,
      },
    });

    for (const appointment of todayAppointments) {
      // Send reminder at 8 AM
      const appointmentTime = new Date(appointment.doctorAvailability.date);
      const [hours] = appointment.doctorAvailability.startTime.split(':').map(Number);
      appointmentTime.setHours(hours, 0, 0, 0);
      
      const timeDiff = appointmentTime.getTime() - now.getTime();
      const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);
      
      // Send reminder if appointment is in 1-24 hours
      if (hoursUntilAppointment >= 1 && hoursUntilAppointment <= 24) {
        await NotificationService.sendAppointmentReminder(appointment.id);
      }
      
      // Send 30-minute reminder
      if (hoursUntilAppointment >= 0.5 && hoursUntilAppointment <= 1) {
        await NotificationService.sendAppointmentReminder(appointment.id);
      }
    }

    // 2. Subscription consultation reminders
    console.log('📋 Checking for subscription consultation reminders...');
    const activeSubscriptions = await prisma.subscriptionTracker.findMany({
      where: { 
        isActive: true,
        deletedAt: null,
      },
      include: { 
        user: true,
        plan: true,
      },
    });

    for (const subscription of activeSubscriptions) {
      const allConsultationDates = [
        ...subscription.doctorConsultationDates,
        ...subscription.dieticianConsultationDates,
        ...subscription.labTestsDates,
        ...subscription.ophthalmologistConsultationDates,
      ];

      for (const consultationDate of allConsultationDates) {
        const consultationDateTime = new Date(consultationDate);
        const daysDiff = Math.ceil((consultationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Send reminder 3 days before
        if (daysDiff === 3) {
          const consultationType = subscription.doctorConsultationDates.includes(consultationDate) ? 'Doctor' :
                                 subscription.dieticianConsultationDates.includes(consultationDate) ? 'Dietician' :
                                 subscription.labTestsDates.includes(consultationDate) ? 'Lab Test' :
                                 'Ophthalmologist';
          
          await NotificationService.sendConsultationReminder(
            subscription.patientId,
            consultationDate,
            consultationType
          );
        }
      }
    }

    // 3. Plan expiry warnings
    console.log('⚠️ Checking for plan expiry warnings...');
    const expiringSubscriptions = await prisma.subscriptionTracker.findMany({
      where: {
        isActive: true,
        endDate: {
          gte: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000), // 7 days from now
          lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        },
        deletedAt: null,
      },
      include: {
        user: true,
        plan: true,
      },
    });

    for (const subscription of expiringSubscriptions) {
      if (subscription.endDate) {
        const daysLeft = Math.ceil((subscription.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        await NotificationService.sendPlanExpiryWarning(
          subscription.patientId,
          subscription.plan.name,
          daysLeft
        );
      }
    }

    // 4. Lab results ready notifications
    console.log('🧪 Checking for completed lab tests...');
    const completedLabBookings = await prisma.labBooking.findMany({
      where: {
        status: LabBookingStatus.COMPLETED,
        labResult: {
          isEmpty: false
        },
        deletedAt: null,
      },
      include: {
        patient: true,
        labPackage: true,
      },
    });

    for (const labBooking of completedLabBookings) {
      // Check if we already sent notification for this lab booking
      const existingNotification = await prisma.patientNotification.findFirst({
        where: {
          patientId: labBooking.patientId,
          type: 'LAB_RESULTS_READY',
          data: {
            path: ['labBookingId'],
            equals: labBooking.id,
          },
        },
      });

      if (!existingNotification) {
        // Check for abnormal results (simplified logic)
        const hasAbnormalResults = Math.random() > 0.7; // 30% chance of abnormal results for demo
        
        await NotificationService.sendLabResultsReady(
          labBooking.patientId,
          labBooking.labPackage.name,
          hasAbnormalResults
        );
      }
    }

    // 5. Diet plan requests status updates
    console.log('🥗 Checking for diet plan request updates...');
    const recentDietPlanRequests = await prisma.dietPlanRequest.findMany({
      where: {
        status: {
          in: ['APPROVED', 'REJECTED']
        },
        updatedAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        deletedAt: null,
      },
      include: {
        patient: true,
        dietician: true,
      },
    });

    for (const request of recentDietPlanRequests) {
      await NotificationService.sendDietPlanRequestStatus(
        request.patientId,
        request.status,
        request.dietician.name
      );
    }

    // 6. New diet plans created
    console.log('📝 Checking for new diet plans...');
    const recentDietPlans = await prisma.dietPlan.findMany({
      where: {
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
        deletedAt: null,
      },
      include: {
        patient: true,
        dietician: true,
      },
    });

    for (const dietPlan of recentDietPlans) {
      await NotificationService.sendDietPlanReady(
        dietPlan.patientId,
        dietPlan.dietician.name,
        dietPlan.id
      );
    }

    console.log('✅ Scheduled notification job completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled notifications sent successfully',
      processed: {
        todayAppointments: todayAppointments.length,
        activeSubscriptions: activeSubscriptions.length,
        expiringSubscriptions: expiringSubscriptions.length,
        completedLabBookings: completedLabBookings.length,
        recentDietPlanRequests: recentDietPlanRequests.length,
        recentDietPlans: recentDietPlans.length,
      },
    });
  } catch (error) {
    console.error('❌ Error in scheduled notification job:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send scheduled notifications',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
