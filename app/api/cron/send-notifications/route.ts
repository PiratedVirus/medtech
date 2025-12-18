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
      const appointmentTime = new Date(appointment.doctorAvailability.date);
      const [hours] = appointment.doctorAvailability.startTime.split(':').map(Number);
      appointmentTime.setHours(hours, 0, 0, 0);
      
      const timeDiff = appointmentTime.getTime() - now.getTime();
      const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);
      const currentHour = now.getHours();
      
      // Send morning notification at 8 AM (between 8:00 and 8:59)
      if (currentHour === 8) {
        // Check if we already sent morning notification today
        const existingMorningNotification = await prisma.patientNotification.findFirst({
          where: {
            patientId: appointment.patientId,
            type: 'APPOINTMENT_REMINDER',
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
            },
            data: {
              path: ['appointmentId'],
              equals: appointment.id,
            },
          },
        });

        if (!existingMorningNotification) {
          await NotificationService.sendSameDayAppointmentMorning(
            appointment.patientId,
            appointment.doctor.name,
            appointment.doctorAvailability.startTime,
            appointment.id
          );
        }
      }
      
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
      // Check doctor consultation dates
      for (const consultationDate of subscription.doctorConsultationDates) {
        const consultationDateTime = new Date(consultationDate);
        const daysDiff = Math.ceil((consultationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate booking window: 5 days before to 10 days after consultation date
        const bookingWindowStart = new Date(consultationDateTime);
        bookingWindowStart.setDate(consultationDateTime.getDate() - 5);
        const bookingWindowEnd = new Date(consultationDateTime);
        bookingWindowEnd.setDate(consultationDateTime.getDate() + 10);
        
        // Check if today is the first day of booking window (5 days before)
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const windowStartDate = new Date(bookingWindowStart.getFullYear(), bookingWindowStart.getMonth(), bookingWindowStart.getDate());
        
        if (todayStart.getTime() === windowStartDate.getTime()) {
          // Check if notification already sent for this consultation date
          const existingNotification = await prisma.patientNotification.findFirst({
            where: {
              patientId: subscription.patientId,
              type: 'CONSULTATION_REMINDER',
              data: {
                path: ['consultationDate'],
                equals: consultationDate,
              },
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
              },
            },
          });

          if (!existingNotification) {
            await NotificationService.sendPlanBookingWindowOpen(
              subscription.patientId,
              'Doctor Consultation',
              consultationDate,
              subscription.plan.name
            );
          }
        }
        
        // Send reminder 3 days before consultation date
        if (daysDiff === 3) {
          await NotificationService.sendConsultationReminder(
            subscription.patientId,
            consultationDate,
            'Doctor'
          );
        }
      }

      // Check dietician consultation dates
      for (const consultationDate of subscription.dieticianConsultationDates) {
        const consultationDateTime = new Date(consultationDate);
        const daysDiff = Math.ceil((consultationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        const bookingWindowStart = new Date(consultationDateTime);
        bookingWindowStart.setDate(consultationDateTime.getDate() - 5);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const windowStartDate = new Date(bookingWindowStart.getFullYear(), bookingWindowStart.getMonth(), bookingWindowStart.getDate());
        
        if (todayStart.getTime() === windowStartDate.getTime()) {
          const existingNotification = await prisma.patientNotification.findFirst({
            where: {
              patientId: subscription.patientId,
              type: 'CONSULTATION_REMINDER',
              data: {
                path: ['consultationDate'],
                equals: consultationDate,
              },
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
              },
            },
          });

          if (!existingNotification) {
            await NotificationService.sendPlanBookingWindowOpen(
              subscription.patientId,
              'Dietician Consultation',
              consultationDate,
              subscription.plan.name
            );
          }
        }
        
        if (daysDiff === 3) {
          await NotificationService.sendConsultationReminder(
            subscription.patientId,
            consultationDate,
            'Dietician'
          );
        }
      }

      // Check lab test dates
      for (const consultationDate of subscription.labTestsDates) {
        const consultationDateTime = new Date(consultationDate);
        const daysDiff = Math.ceil((consultationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        const bookingWindowStart = new Date(consultationDateTime);
        bookingWindowStart.setDate(consultationDateTime.getDate() - 5);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const windowStartDate = new Date(bookingWindowStart.getFullYear(), bookingWindowStart.getMonth(), bookingWindowStart.getDate());
        
        if (todayStart.getTime() === windowStartDate.getTime()) {
          const existingNotification = await prisma.patientNotification.findFirst({
            where: {
              patientId: subscription.patientId,
              type: 'CONSULTATION_REMINDER',
              data: {
                path: ['consultationDate'],
                equals: consultationDate,
              },
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
              },
            },
          });

          if (!existingNotification) {
            await NotificationService.sendPlanBookingWindowOpen(
              subscription.patientId,
              'Lab Test',
              consultationDate,
              subscription.plan.name
            );
          }
        }
        
        if (daysDiff === 3) {
          await NotificationService.sendConsultationReminder(
            subscription.patientId,
            consultationDate,
            'Lab Test'
          );
        }
      }

      // Check ophthalmologist consultation dates
      for (const consultationDate of subscription.ophthalmologistConsultationDates) {
        const consultationDateTime = new Date(consultationDate);
        const daysDiff = Math.ceil((consultationDateTime.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        const bookingWindowStart = new Date(consultationDateTime);
        bookingWindowStart.setDate(consultationDateTime.getDate() - 5);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const windowStartDate = new Date(bookingWindowStart.getFullYear(), bookingWindowStart.getMonth(), bookingWindowStart.getDate());
        
        if (todayStart.getTime() === windowStartDate.getTime()) {
          const existingNotification = await prisma.patientNotification.findFirst({
            where: {
              patientId: subscription.patientId,
              type: 'CONSULTATION_REMINDER',
              data: {
                path: ['consultationDate'],
                equals: consultationDate,
              },
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
              },
            },
          });

          if (!existingNotification) {
            await NotificationService.sendPlanBookingWindowOpen(
              subscription.patientId,
              'Ophthalmologist Consultation',
              consultationDate,
              subscription.plan.name
            );
          }
        }
        
        if (daysDiff === 3) {
          await NotificationService.sendConsultationReminder(
            subscription.patientId,
            consultationDate,
            'Ophthalmologist'
          );
        }
      }
    }

    // 3. Enhanced Plan expiry warnings (7, 3, 1 days before, and last day)
    console.log('⚠️ Checking for plan expiry warnings...');
    const activeSubscriptionsForExpiry = await prisma.subscriptionTracker.findMany({
      where: {
        isActive: true,
        endDate: {
          not: null,
          gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
        deletedAt: null,
      },
      include: {
        user: true,
        plan: true,
      },
    });

    for (const subscription of activeSubscriptionsForExpiry) {
      if (subscription.endDate) {
        const endDate = new Date(subscription.endDate);
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endDateStart = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
        
        const daysLeft = Math.ceil((endDateStart.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
        
        // Check if notification already sent for this day
        const existingNotification = await prisma.patientNotification.findFirst({
          where: {
            patientId: subscription.patientId,
            type: 'PLAN_EXPIRY_WARNING',
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0),
            },
            data: {
              path: ['daysLeft'],
              equals: daysLeft,
            },
          },
        });

        if (existingNotification) continue;

        // Send notification at 7, 3, 1 days before, and on the last day
        if (daysLeft === 7 || daysLeft === 3) {
          await NotificationService.sendPlanExpiryWarning(
            subscription.patientId,
            subscription.plan.name,
            daysLeft
          );
        } else if (daysLeft === 1 || daysLeft === 0) {
          await NotificationService.sendPlanExpiryFinalWarning(
            subscription.patientId,
            subscription.plan.name,
            daysLeft === 0
          );
        }
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
      // Check if we already sent notification for this diet plan
      const existingNotification = await prisma.patientNotification.findFirst({
        where: {
          patientId: dietPlan.patientId,
          type: 'DIET_PLAN_READY',
          data: {
            path: ['dietPlanId'],
            equals: dietPlan.id,
          },
        },
      });

      if (!existingNotification) {
        await NotificationService.sendDietPlanReady(
          dietPlan.patientId,
          dietPlan.dietician.name,
          dietPlan.id
        );
      }
    }

    console.log('✅ Scheduled notification job completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled notifications sent successfully',
      processed: {
        todayAppointments: todayAppointments.length,
        activeSubscriptions: activeSubscriptions.length,
        expiringSubscriptions: activeSubscriptionsForExpiry.length,
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
