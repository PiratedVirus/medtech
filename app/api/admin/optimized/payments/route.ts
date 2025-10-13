import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId, createUserClinicFilter } from "@/lib/admin-clinic-middleware";

// Optimized payments API with single aggregated query for earnings
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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search") || "";

    // Create clinic filter for payments
    const userClinicFilter = createUserClinicFilter(clinicId);
    const paymentFilter = {
      OR: [
        { appointment: { doctor: userClinicFilter.user } },
        { subscription: { user: userClinicFilter.user } },
        { labBooking: { patient: userClinicFilter.user } }
      ]
    };

    // Build where clause with clinic filtering
    const whereClause = {
      ...paymentFilter,
      deletedAt: null,
      ...(status && { paymentStatus: status }),
      ...(search && {
        OR: [
          { razorpayPaymentId: { contains: search, mode: 'insensitive' } },
          { razorpayOrderId: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Single optimized query for both payments and earnings
    const [paymentsWithEarnings] = await prisma.$queryRaw<Array<{
      payments: any[];
      total_count: bigint;
      lab_earnings: bigint | null;
      appointment_earnings: bigint | null;
      subscription_earnings: bigint | null;
      total_earnings: bigint | null;
    }>>`
      WITH filtered_payments AS (
        SELECT 
          p.*,
          CASE WHEN p."appointmentId" IS NOT NULL THEN 'appointment'
               WHEN p."labBookingId" IS NOT NULL THEN 'lab'
               WHEN p."subscriptionId" IS NOT NULL THEN 'subscription'
               ELSE 'unknown' END as payment_type
        FROM "Payment" p
        WHERE p."deletedAt" IS NULL
        ${status ? `AND p."paymentStatus" = '${status}'` : ''}
        ${search ? `AND (p."razorpayPaymentId" ILIKE '%${search}%' OR p."razorpayOrderId" ILIKE '%${search}%')` : ''}
      ),
      paginated_payments AS (
        SELECT *
        FROM filtered_payments
        ORDER BY "createdAt" DESC
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      )
      SELECT 
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', p.id,
            'amount', p.amount,
            'currency', p.currency,
            'paymentStatus', p."paymentStatus",
            'paymentMethod', p."paymentMethod",
            'razorpayOrderId', p."razorpayOrderId",
            'razorpayPaymentId', p."razorpayPaymentId",
            'createdAt', p."createdAt",
            'appointmentId', p."appointmentId",
            'labBookingId', p."labBookingId",
            'subscriptionId', p."subscriptionId",
            'paymentType', p.payment_type
          )
        ) as payments,
        (SELECT COUNT(*) FROM filtered_payments) as total_count,
        (SELECT COALESCE(SUM(amount), 0) FROM filtered_payments WHERE payment_type = 'lab') as lab_earnings,
        (SELECT COALESCE(SUM(amount), 0) FROM filtered_payments WHERE payment_type = 'appointment') as appointment_earnings,
        (SELECT COALESCE(SUM(amount), 0) FROM filtered_payments WHERE payment_type = 'subscription') as subscription_earnings,
        (SELECT COALESCE(SUM(amount), 0) FROM filtered_payments) as total_earnings
      FROM paginated_payments p
    `;

    const result = paymentsWithEarnings;
    const payments = result.payments || [];
    const totalCount = Number(result.total_count || 0);

    const earnings = {
      lab: Number(result.lab_earnings || 0),
      appointment: Number(result.appointment_earnings || 0),
      subscription: Number(result.subscription_earnings || 0),
      total: Number(result.total_earnings || 0),
    };

    return NextResponse.json({
      data: payments,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      earnings,
    });
  } catch (error) {
    console.error("Optimized payments query error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      appointmentId,
      labBookingId,
      subscriptionId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      currency = "INR",
      paymentStatus,
      paymentMethod
    } = data;

    const payment = await prisma.payment.create({
      data: {
        appointmentId,
        labBookingId,
        subscriptionId,
        razorpayOrderId,
        razorpayPaymentId,
        amount,
        currency,
        paymentStatus,
        paymentMethod,
      },
    });

    return NextResponse.json({ 
      data: payment, 
      message: "Payment created successfully" 
    });
  } catch (error) {
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const data = await request.json();
    const { id, ids } = data;

    if (ids && Array.isArray(ids)) {
      // Bulk delete
      await prisma.payment.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() }
      });
      return NextResponse.json({ message: `${ids.length} payments deleted successfully` });
    } else if (id) {
      // Single delete
      await prisma.payment.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
      return NextResponse.json({ message: "Payment deleted successfully" });
    } else {
      return NextResponse.json({ error: "Payment ID is required" }, { status: 400 });
    }
  } catch (error) {
    console.error("Payment deletion error:", error);
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 });
  }
}
