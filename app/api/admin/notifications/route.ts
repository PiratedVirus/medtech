import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

export async function GET(request: NextRequest) {
  try {
    // Get admin's clinic ID for filtering
    const clinicId = getAdminClinicId(request);
    if (!clinicId) {
      return NextResponse.json({ 
        error: "Unauthorized", 
        message: "Please log out and log back in to access your clinic data" 
      }, { status: 401 });
    }

    const now = new Date();
    // Use UTC to avoid timezone issues
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    
    // Create clinic filter
    const userClinicFilter = createUserClinicFilter(clinicId);
    
    console.log("🔔 Fetching notifications for clinic:", clinicId, { now: now.toISOString(), today: today.toISOString() });
    
    // Get notifications in parallel for better performance
    const [
      upcomingAppointments,
      pendingLabCollections,
      failedPayments,
      expiringSubscriptions,
      suspendedUsers,
      newSignups,
      failedPrescriptionAnalysis,
      failedLabAnalysis,
      criticalLabResults,
      dietPlanRequests
    ] = await Promise.all([
      // Upcoming appointments (next 1 day) - only truly future appointments
      prisma.appointment.findMany({
        where: {
          doctorAvailability: {
            date: {
              gte: today,
              lte: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          },
          status: {
            in: ["SCHEDULED", "Confirmed"]
          },
          doctor: userClinicFilter.user
        },
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
          doctorAvailability: { select: { date: true, startTime: true } }
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching upcoming appointments:", error);
        return [];
      }).then(appointments => {
        // Additional filter to ensure we only show truly upcoming appointments
        const filteredAppointments = appointments.filter(apt => {
          if (!apt.doctorAvailability?.date) return false;
          
          const appointmentDate = new Date(apt.doctorAvailability.date);
          const appointmentTime = apt.doctorAvailability.startTime;
          
          // Parse the time
          const [hours, minutes] = appointmentTime.split(':').map(Number);
          appointmentDate.setHours(hours, minutes, 0, 0);
          
          // Only include if appointment is in the future
          return appointmentDate > now;
        });
        
        return filteredAppointments;
      }),

      // Pending lab collections today
      prisma.labBooking.findMany({
        where: {
          labDate: today,
          status: "PENDING",
          patient: userClinicFilter.user
        },
        include: {
          patient: { select: { name: true } },
          labPackage: { select: { name: true } }
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching pending lab collections:", error);
        return [];
      }),

      // Failed payments (last 24 hours)
      prisma.payment.findMany({
        where: {
          paymentStatus: "FAILED",
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          },
          OR: [
            { appointment: { doctor: userClinicFilter.user } },
            { subscription: { user: userClinicFilter.user } },
            { labBooking: { patient: userClinicFilter.user } }
          ]
        },
        include: {
          appointment: { include: { patient: { select: { name: true } } } },
          labBooking: { include: { patient: { select: { name: true } } } }
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching failed payments:", error);
        return [];
      }),

      // Expiring subscriptions (within 7 days)
      prisma.subscriptionTracker.findMany({
        where: {
          endDate: {
            gte: today,
            lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          isActive: true,
          user: userClinicFilter.user
        },
        include: {
          user: {
            include: {
              user: { select: { name: true } }
            }
          },
          plan: { select: { name: true } }
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching expiring subscriptions:", error);
        return [];
      }),

      // Suspended users (last 24 hours)
      prisma.user.findMany({
        where: {
          status: "SUSPENDED",
          updatedAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          },
          clinicId: clinicId
        },
        select: {
          id: true,
          name: true,
          role: true,
          updatedAt: true
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching suspended users:", error);
        return [];
      }),

      // New signups (last 24 hours)
      prisma.user.findMany({
        where: {
          role: "PATIENT",
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          },
          clinicId: clinicId
        },
        select: {
          id: true,
          name: true,
          createdAt: true
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching new signups:", error);
        return [];
      }),

      // Failed prescription analysis (last 24 hours)
      prisma.prescriptionText.findMany({
        where: {
          processingStatus: "FAILED",
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          },
          patient: userClinicFilter.user
        },
        include: {
          patient: { select: { name: true } }
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching failed prescription analysis:", error);
        return [];
      }),

      // Failed lab analysis (last 24 hours)
      prisma.labReportAnalysis.findMany({
        where: {
          processingStatus: "FAILED",
          createdAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          },
          labBooking: {
            patient: userClinicFilter.user
          }
        },
        include: {
          labBooking: {
            include: {
              patient: { select: { name: true } }
            }
          }
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching failed lab analysis:", error);
        return [];
      }),

      // Critical lab results (last 24 hours)
      prisma.labReportAnalysis.findMany({
        where: {
          processedAt: {
            gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
          },
          labBooking: {
            patient: userClinicFilter.user
          }
        },
        include: {
          labBooking: {
            include: {
              patient: { select: { name: true } }
            }
          }
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching critical lab results:", error);
        return [];
      }),

      // Pending diet plan requests
      prisma.dietPlanRequest.findMany({
        where: {
          status: "PENDING",
          patient: userClinicFilter.user
        },
        include: {
          patient: { select: { name: true } },
          dietician: { select: { name: true } }
        },
        take: 5
      }).catch(error => {
        console.error("Error fetching diet plan requests:", error);
        return [];
      })
    ]);

    console.log("📊 Notification data fetched:", {
      upcomingAppointments: upcomingAppointments.length,
      pendingLabCollections: pendingLabCollections.length,
      failedPayments: failedPayments.length,
      expiringSubscriptions: expiringSubscriptions.length,
      suspendedUsers: suspendedUsers.length,
      newSignups: newSignups.length,
      failedPrescriptionAnalysis: failedPrescriptionAnalysis.length,
      failedLabAnalysis: failedLabAnalysis.length,
      criticalLabResults: criticalLabResults.length,
      dietPlanRequests: dietPlanRequests.length
    });

    // Helper function to create detailed descriptions
    const createDetailedDescription = (items: any[], type: string) => {
      if (items.length === 0) return null;
      
      switch (type) {
        case 'appointments':
          const uniqueAppointments = items.reduce((acc, item) => {
            const key = `${item.patient?.name || 'Unknown'} → Dr. ${item.doctor?.name || 'Unknown'}`;
            if (!acc.includes(key)) {
              acc.push(key);
            }
            return acc;
          }, [] as string[]);
          return uniqueAppointments.join(', ');
        
        case 'labCollections':
          return items.map(item => 
            `${item.patient?.name || 'Unknown'} - ${item.labPackage?.name || 'Lab Test'}`
          ).join(', ');
        
        case 'failedPayments':
          return items.map(item => 
            `${item.appointment?.patient?.name || item.labBooking?.patient?.name || 'Unknown'}`
          ).join(', ');
        
        case 'expiringSubscriptions':
          return items.map(item => 
            `${item.user?.user?.name || 'Unknown'} - ${item.plan?.name || 'Plan'}`
          ).join(', ');
        
        case 'suspendedUsers':
          return items.map(item => 
            `${item.name} (${item.role})`
          ).join(', ');
        
        case 'newSignups':
          const uniqueSignups = items.reduce((acc, item) => {
            if (!acc.includes(item.name)) {
              acc.push(item.name);
            }
            return acc;
          }, [] as string[]);
          return uniqueSignups.join(', ');
        
        case 'failedPrescriptionAnalysis':
          return items.map(item => 
            `${item.patient?.name || 'Unknown'}`
          ).join(', ');
        
        case 'failedLabAnalysis':
          return items.map(item => 
            `${item.labBooking?.patient?.name || 'Unknown'}`
          ).join(', ');
        
        case 'criticalLabResults':
          return items.map(item => 
            `${item.labBooking?.patient?.name || 'Unknown'}`
          ).join(', ');
        
        case 'dietPlanRequests':
          const uniqueRequests = items.reduce((acc, item) => {
            const key = `${item.patient?.name || 'Unknown'} → ${item.dietician?.name || 'Unknown'}`;
            if (!acc.includes(key)) {
              acc.push(key);
            }
            return acc;
          }, [] as string[]);
          return uniqueRequests.join(', ');
        
        default:
          return `${items.length} item${items.length > 1 ? 's' : ''}`;
      }
    };

    // Build notification objects
    const notifications = {
      highPriority: [
        // Critical lab results - individual notifications
        ...(criticalLabResults.length > 0 ? criticalLabResults.map((result, index) => {
          const resultDate = new Date(result.processedAt || result.createdAt);
          const formattedDate = resultDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          return {
            id: `critical-lab-result-${result.id}`,
            type: 'lab' as const,
            title: 'Critical Lab Result',
            description: `${result.labBooking?.patient?.name || 'Patient'} has critical lab result from ${formattedDate}`,
            count: 1,
            priority: 'high' as const,
            icon: 'AlertTriangle',
            color: '#EF4444',
            bgColor: 'rgba(239,68,68,0.1)',
            timestamp: now.toISOString(),
            isRead: false,
            data: result
          };
        }) : []),

        // Failed payments - individual notifications
        ...(failedPayments.length > 0 ? failedPayments.map((payment, index) => {
          const paymentDate = new Date(payment.createdAt);
          const formattedDate = paymentDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          const patientName = payment.appointment?.patient?.name || payment.labBooking?.patient?.name || 'Patient';
          
          return {
            id: `failed-payment-${payment.id}`,
            type: 'payment' as const,
            title: 'Payment Failed',
            description: `${patientName}'s payment failed on ${formattedDate}`,
            count: 1,
            priority: 'high' as const,
            icon: 'CreditCard',
            color: '#EF4444',
            bgColor: 'rgba(239,68,68,0.1)',
            timestamp: now.toISOString(),
            isRead: false,
            data: payment
          };
        }) : []),

        // System errors - individual notifications
        ...(failedPrescriptionAnalysis.length > 0 ? failedPrescriptionAnalysis.map((analysis, index) => {
          const errorDate = new Date(analysis.createdAt);
          const formattedDate = errorDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          return {
            id: `failed-prescription-analysis-${analysis.id}`,
            type: 'system' as const,
            title: 'Prescription Analysis Failed',
            description: `${analysis.patient?.name || 'Patient'}'s prescription analysis failed on ${formattedDate}`,
            count: 1,
            priority: 'high' as const,
            icon: 'AlertCircle',
            color: '#EF4444',
            bgColor: 'rgba(239,68,68,0.1)',
            timestamp: now.toISOString(),
            isRead: false,
            data: analysis
          };
        }) : []),
        
        ...(failedLabAnalysis.length > 0 ? failedLabAnalysis.map((analysis, index) => {
          const errorDate = new Date(analysis.createdAt);
          const formattedDate = errorDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          return {
            id: `failed-lab-analysis-${analysis.id}`,
            type: 'system' as const,
            title: 'Lab Analysis Failed',
            description: `${analysis.labBooking?.patient?.name || 'Patient'}'s lab analysis failed on ${formattedDate}`,
            count: 1,
            priority: 'high' as const,
            icon: 'AlertCircle',
            color: '#EF4444',
            bgColor: 'rgba(239,68,68,0.1)',
            timestamp: now.toISOString(),
            isRead: false,
            data: analysis
          };
        }) : [])
      ],

      mediumPriority: [
        // Upcoming appointments - individual notifications
        ...(upcomingAppointments.length > 0 ? upcomingAppointments.map((appointment, index) => {
          const appointmentDate = new Date(appointment.doctorAvailability.date);
          const appointmentTime = appointment.doctorAvailability.startTime;
          const formattedDateTime = new Date(appointmentDate.getTime() + 
            parseInt(appointmentTime.split(':')[0]) * 60 * 60 * 1000 + 
            parseInt(appointmentTime.split(':')[1]) * 60 * 1000
          ).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
          
          return {
            id: `upcoming-appointment-${appointment.id}`,
            type: 'appointment' as const,
            title: 'Upcoming Appointment',
            description: `${appointment.patient?.name || 'Patient'} has appointment with ${appointment.doctor?.name || 'Doctor'} on ${formattedDateTime}`,
            count: 1,
            priority: 'medium' as const,
            icon: 'Calendar',
            color: '#F28A2E',
            bgColor: 'rgba(242,138,46,0.1)',
            timestamp: now.toISOString(),
            isRead: false,
            data: appointment
          };
        }) : []),

        // Pending lab collections - individual notifications
        ...(pendingLabCollections.length > 0 ? pendingLabCollections.map((labBooking, index) => {
          const labDate = new Date(labBooking.labDate);
          const formattedDate = labDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          
          return {
            id: `pending-lab-collection-${labBooking.id}`,
            type: 'lab' as const,
            title: 'Lab Sample Pending Collection',
            description: `${labBooking.patient?.name || 'Patient'} has ${labBooking.labPackage?.name || 'lab test'} pending collection on ${formattedDate}`,
            count: 1,
            priority: 'medium' as const,
            icon: 'FlaskConical',
            color: '#F28A2E',
            bgColor: 'rgba(242,138,46,0.1)',
            timestamp: now.toISOString(),
            isRead: false,
            data: labBooking
          };
        }) : []),

        // Expiring subscriptions - individual notifications
        ...(expiringSubscriptions.length > 0 ? expiringSubscriptions.map((subscription, index) => ({
          id: `expiring-subscription-${subscription.user?.id || index}`,
          type: 'subscription' as const,
          title: 'Subscription Expiring Soon',
          description: `${subscription.user?.user?.name || 'Patient'}'s ${subscription.plan?.name || 'subscription'} expires on ${subscription.endDate ? new Date(subscription.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown'}`,
          count: 1,
          priority: 'medium' as const,
          icon: 'Clock',
          color: '#F28A2E',
          bgColor: 'rgba(242,138,46,0.1)',
          timestamp: now.toISOString(),
          isRead: false,
          data: subscription
        })) : []),

        // Diet plan requests - individual notifications
        ...(dietPlanRequests.length > 0 ? dietPlanRequests.map((request, index) => {
          const requestDate = new Date(request.createdAt);
          const formattedDate = requestDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          
          return {
            id: `diet-plan-request-${request.id}`,
            type: 'diet' as const,
            title: 'Diet Plan Request',
            description: `${request.patient?.name || 'Patient'} requested diet plan from ${request.dietician?.name || 'Dietician'} on ${formattedDate}`,
            count: 1,
            priority: 'medium' as const,
            icon: 'Utensils',
            color: '#F28A2E',
            bgColor: 'rgba(242,138,46,0.1)',
            timestamp: now.toISOString(),
            isRead: false,
            data: request
          };
        }) : [])
      ],

      lowPriority: [
        // New signups - individual notifications
        ...(newSignups.length > 0 ? newSignups.map((user, index) => {
          const signupDate = new Date(user.createdAt);
          const formattedDate = signupDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          return {
            id: `new-signup-${user.id}`,
            type: 'user' as const,
            title: 'New Patient Signup',
            description: `${user.name} registered on ${formattedDate}`,
            count: 1,
            priority: 'low' as const,
            icon: 'UserPlus',
            color: '#56A67C',
            bgColor: 'rgba(86,166,124,0.1)',
            timestamp: now.toISOString(),
            isRead: false,
            data: user
          };
        }) : []),

        // Suspended users - individual notifications
        ...(suspendedUsers.length > 0 ? suspendedUsers.map((user, index) => {
          const suspendDate = new Date(user.updatedAt);
          const formattedDate = suspendDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          });
          
          return {
            id: `suspended-user-${user.id}`,
            type: 'user' as const,
            title: 'User Account Suspended',
            description: `${user.name} (${user.role}) was suspended on ${formattedDate}`,
            count: 1,
            priority: 'low' as const,
            icon: 'Users',
            color: '#56A67C',
            bgColor: 'rgba(86,166,124,0.1)',
            timestamp: now.toISOString(),
            isRead: false,
            data: user
          };
        }) : [])
      ]
    };

    const summary = {
      total: notifications.highPriority.length + notifications.mediumPriority.length + notifications.lowPriority.length,
      highPriority: notifications.highPriority.length,
      mediumPriority: notifications.mediumPriority.length,
      lowPriority: notifications.lowPriority.length,
      unread: notifications.highPriority.length + notifications.mediumPriority.length + notifications.lowPriority.length
    };

    console.log("✅ Notifications processed successfully:", summary);

    return NextResponse.json({
      notifications,
      summary
    });

  } catch (error) {
    console.error("❌ Failed to fetch notifications:", error);
    return NextResponse.json({ 
      error: "Failed to fetch notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
