import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { AppointmentStatus } from "@/lib/constants/enums";
import { getAdminClinicId } from "@/lib/admin-clinic-middleware";

// Optimized notifications API using single aggregated query instead of 10+ parallel queries
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
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log("🔔 Fetching optimized notifications for clinic:", clinicId, { now: now.toISOString(), today: today.toISOString() });

    // Single optimized query to get all notification data
    const notificationData = await prisma.$queryRaw<Array<{
      type: string;
      count: bigint;
      priority: string;
      sample_data: any;
    }>>`
      SELECT 
        'upcoming_appointments' as type,
        COUNT(*) as count,
        'medium' as priority,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', a.id,
            'patient_name', p.name,
            'doctor_name', d.name,
            'date', da.date,
            'start_time', da."startTime",
            'consultation_type', a."consultationType"
          )
        ) FILTER (WHERE a.id IS NOT NULL) as sample_data
      FROM "Appointment" a
      JOIN "User" p ON a."patientId" = p.id
      JOIN "User" d ON a."userId" = d.id  
      JOIN "DoctorAvailability" da ON a."doctorAvailabilityId" = da.id
      WHERE da.date >= ${today}
        AND da.date <= ${tomorrow}
        AND a.status IN ('${AppointmentStatus.SCHEDULED}', '${AppointmentStatus.CONFIRMED}')
        AND a."deletedAt" IS NULL
        AND d."clinicId" = ${clinicId}

      UNION ALL

      SELECT 
        'pending_lab_collections' as type,
        COUNT(*) as count,
        'medium' as priority,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', lb.id,
            'patient_name', p.name,
            'lab_package', lp.name,
            'lab_date', lb."labDate"
          )
        ) FILTER (WHERE lb.id IS NOT NULL) as sample_data
      FROM "LabBooking" lb
      JOIN "User" p ON lb."patientId" = p.id
      JOIN "LabPackage" lp ON lb."labPackageId" = lp.id
      WHERE lb."labDate" = ${today}
        AND lb.status = 'PENDING'
        AND lb."deletedAt" IS NULL
        AND p."clinicId" = ${clinicId}

      UNION ALL

      SELECT 
        'failed_payments' as type,
        COUNT(*) as count,
        'high' as priority,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pay.id,
            'amount', pay.amount,
            'patient_name', COALESCE(ap.name, lp.name),
            'created_at', pay."createdAt"
          )
        ) FILTER (WHERE pay.id IS NOT NULL) as sample_data
      FROM "Payment" pay
      LEFT JOIN "Appointment" a ON pay."appointmentId" = a.id
      LEFT JOIN "User" ap ON a."patientId" = ap.id
      LEFT JOIN "LabBooking" lb ON pay."labBookingId" = lb.id
      LEFT JOIN "User" lp ON lb."patientId" = lp.id
      WHERE pay."paymentStatus" = 'FAILED'
        AND pay."createdAt" >= ${last24Hours}
        AND pay."deletedAt" IS NULL
        AND (ap."clinicId" = ${clinicId} OR lp."clinicId" = ${clinicId})

      UNION ALL

      SELECT 
        'expiring_subscriptions' as type,
        COUNT(*) as count,
        'medium' as priority,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', st."subscriptionId",
            'patient_name', u.name,
            'plan_name', pl.name,
            'end_date', st."endDate"
          )
        ) FILTER (WHERE st."subscriptionId" IS NOT NULL) as sample_data
      FROM "SubscriptionTracker" st
      JOIN "PatientProfile" pp ON st."patientId" = pp.id
      JOIN "User" u ON pp."userId" = u.id
      JOIN "Plan" pl ON st."planId" = pl.id
      WHERE st."endDate" >= ${today}
        AND st."endDate" <= ${next7Days}
        AND st."isActive" = true
        AND st."deletedAt" IS NULL
        AND u."clinicId" = ${clinicId}

      UNION ALL

      SELECT 
        'new_signups' as type,
        COUNT(*) as count,
        'low' as priority,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', u.id,
            'name', u.name,
            'created_at', u."createdAt"
          )
        ) FILTER (WHERE u.id IS NOT NULL) as sample_data
      FROM "User" u
      WHERE u.role = 'PATIENT'
        AND u."createdAt" >= ${last24Hours}
        AND u."deletedAt" IS NULL
        AND u."clinicId" = ${clinicId}

      UNION ALL

      SELECT 
        'failed_prescription_analysis' as type,
        COUNT(*) as count,
        'high' as priority,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', pt.id,
            'patient_name', u.name,
            'created_at', pt."createdAt"
          )
        ) FILTER (WHERE pt.id IS NOT NULL) as sample_data
      FROM "PrescriptionText" pt
      JOIN "User" u ON pt."patientId" = u.id
      WHERE pt."processingStatus" = 'FAILED'
        AND pt."createdAt" >= ${last24Hours}
        AND u."clinicId" = ${clinicId}

      UNION ALL

      SELECT 
        'failed_lab_analysis' as type,
        COUNT(*) as count,
        'high' as priority,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', lra.id,
            'patient_name', u.name,
            'created_at', lra."createdAt"
          )
        ) FILTER (WHERE lra.id IS NOT NULL) as sample_data
      FROM "LabReportAnalysis" lra
      JOIN "LabBooking" lb ON lra."labBookingId" = lb.id
      JOIN "User" u ON lb."patientId" = u.id
      WHERE lra."processingStatus" = 'FAILED'
        AND lra."createdAt" >= ${last24Hours}
        AND lra."deletedAt" IS NULL
        AND u."clinicId" = ${clinicId}

      UNION ALL

      SELECT 
        'diet_plan_requests' as type,
        COUNT(*) as count,
        'medium' as priority,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', dpr.id,
            'patient_name', p.name,
            'dietician_name', d.name,
            'created_at', dpr."createdAt"
          )
        ) FILTER (WHERE dpr.id IS NOT NULL) as sample_data
      FROM "DietPlanRequest" dpr
      JOIN "User" p ON dpr."patientId" = p.id
      JOIN "User" d ON dpr."dieticianId" = d.id
      WHERE dpr.status = 'PENDING'
        AND dpr."deletedAt" IS NULL
        AND p."clinicId" = ${clinicId}
    `;

    // Process results into notification format
    const notifications = {
      highPriority: [] as any[],
      mediumPriority: [] as any[],
      lowPriority: [] as any[]
    };

    notificationData.forEach((row) => {
      const count = Number(row.count);
      if (count === 0) return;

      const notification = {
        id: `${row.type}-summary`,
        type: row.type,
        title: getNotificationTitle(row.type),
        description: getNotificationDescription(row.type, count, row.sample_data),
        count,
        priority: row.priority,
        icon: getNotificationIcon(row.type),
        color: getNotificationColor(row.priority),
        bgColor: getNotificationBgColor(row.priority),
        timestamp: now.toISOString(),
        isRead: false,
        data: row.sample_data
      };

      if (row.priority === 'high') {
        notifications.highPriority.push(notification);
      } else if (row.priority === 'medium') {
        notifications.mediumPriority.push(notification);
      } else {
        notifications.lowPriority.push(notification);
      }
    });

    const summary = {
      total: notifications.highPriority.length + notifications.mediumPriority.length + notifications.lowPriority.length,
      highPriority: notifications.highPriority.length,
      mediumPriority: notifications.mediumPriority.length,
      lowPriority: notifications.lowPriority.length,
      unread: notifications.highPriority.length + notifications.mediumPriority.length + notifications.lowPriority.length
    };

    console.log("✅ Optimized notifications processed successfully:", summary);

    return NextResponse.json({
      notifications,
      summary
    });

  } catch (error) {
    console.error("❌ Failed to fetch optimized notifications:", error);
    return NextResponse.json({ 
      error: "Failed to fetch notifications",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

function getNotificationTitle(type: string): string {
  const titles = {
    'upcoming_appointments': 'Upcoming Appointments',
    'pending_lab_collections': 'Pending Lab Collections',
    'failed_payments': 'Failed Payments',
    'expiring_subscriptions': 'Expiring Subscriptions',
    'new_signups': 'New Patient Signups',
    'failed_prescription_analysis': 'Failed Prescription Analysis',
    'failed_lab_analysis': 'Failed Lab Analysis',
    'diet_plan_requests': 'Pending Diet Plan Requests'
  };
  return titles[type as keyof typeof titles] || type;
}

function getNotificationDescription(type: string, count: number, sampleData: any[]): string {
  const samples = sampleData?.slice(0, 3) || [];
  const names = samples.map(s => s.patient_name || s.name).filter(Boolean);
  const nameStr = names.length > 0 ? names.join(', ') : 'patients';
  
  return `${count} ${type.replace(/_/g, ' ')} - ${nameStr}${count > 3 ? ' and others' : ''}`;
}

function getNotificationIcon(type: string): string {
  const icons = {
    'upcoming_appointments': 'Calendar',
    'pending_lab_collections': 'FlaskConical',
    'failed_payments': 'CreditCard',
    'expiring_subscriptions': 'Clock',
    'new_signups': 'UserPlus',
    'failed_prescription_analysis': 'AlertCircle',
    'failed_lab_analysis': 'AlertCircle',
    'diet_plan_requests': 'Utensils'
  };
  return icons[type as keyof typeof icons] || 'Bell';
}

function getNotificationColor(priority: string): string {
  const colors = {
    'high': '#EF4444',
    'medium': '#F28A2E', 
    'low': '#56A67C'
  };
  return colors[priority as keyof typeof colors] || '#6B7280';
}

function getNotificationBgColor(priority: string): string {
  const colors = {
    'high': 'rgba(239,68,68,0.1)',
    'medium': 'rgba(242,138,46,0.1)',
    'low': 'rgba(86,166,124,0.1)'
  };
  return colors[priority as keyof typeof colors] || 'rgba(107,114,128,0.1)';
}
