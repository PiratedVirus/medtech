import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminClinicId } from "@/lib/admin-clinic-middleware";

// Optimized payments API with clinic filtering
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

    // Build where clause with clinic filtering through relations
    // Payment has optional relations: appointment?, labBooking?, subscription?
    // For optional relations, use `is` for the nested filter
    const clinicOR: any[] = [
      // Appointment payments: match clinic by doctor or patient
      { appointment: { is: { doctor: { clinicId } } } },
      { appointment: { is: { patient: { clinicId } } } },
      // Lab bookings: match clinic by lab package or patient
      { labBooking: { is: { labPackage: { clinicId } } } },
      { labBooking: { is: { patient: { clinicId } } } },
      // SubscriptionTracker.user -> PatientProfile (no clinicId), go through PatientProfile.user -> User
      { subscription: { is: { user: { user: { clinicId } } } } },
    ];

    const clinicPaymentFilter: any = {
      deletedAt: null,
      OR: clinicOR,
      ...(status ? { paymentStatus: status } : {}),
    };

    // If search is provided, add it as an AND condition to avoid overriding OR
    if (search) {
      clinicPaymentFilter.AND = [
        {
          OR: [
            { razorpayPaymentId: { contains: search, mode: 'insensitive' } },
            { razorpayOrderId: { contains: search, mode: 'insensitive' } },
          ]
        }
      ];
    }

    // Get total count and payments in parallel
    const [totalCount, payments, earningsData] = await Promise.all([
      prisma.payment.count({ where: clinicPaymentFilter }),
      prisma.payment.findMany({
        where: clinicPaymentFilter,
        include: {
          appointment: {
            select: {
              id: true,
              createdAt: true,
              doctor: {
                select: { id: true, name: true }
              },
              patient: {
                select: { id: true, name: true }
              }
            }
          },
          labBooking: {
            select: {
              id: true,
              labDate: true,
              patient: {
                select: { id: true, name: true }
              },
              labPackage: {
                select: { name: true }
              }
            }
          },
          subscription: {
            select: {
              subscriptionId: true,
              user: {
                select: {
                  id: true,
                  user: {
                    select: { id: true, name: true, clinicId: true }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      // Aggregate earnings by type
      prisma.payment.findMany({
        where: clinicPaymentFilter,
        select: {
          amount: true,
          appointmentId: true,
          labBookingId: true,
          subscriptionId: true,
        }
      }),
    ]);

    // Calculate earnings
    let labEarnings = 0;
    let appointmentEarnings = 0;
    let subscriptionEarnings = 0;
    for (const p of earningsData) {
      if (p.labBookingId) labEarnings += p.amount;
      else if (p.appointmentId) appointmentEarnings += p.amount;
      else if (p.subscriptionId) subscriptionEarnings += p.amount;
    }

    // Transform payments to include useful display info
    const data = payments.map(p => {
      let paymentType = 'unknown';
      let reference = '';
      let patientName = '';
      
      if (p.labBookingId && p.labBooking) {
        paymentType = 'Lab Booking';
        reference = p.labBooking.labPackage?.name || `Lab #${p.labBookingId}`;
        patientName = p.labBooking.patient?.name || '';
      } else if (p.appointmentId && p.appointment) {
        paymentType = 'Appointment';
        reference = `Dr. ${p.appointment.doctor?.name || 'Unknown'}`;
        patientName = p.appointment.patient?.name || '';
      } else if (p.subscriptionId && p.subscription) {
        paymentType = 'Subscription';
        patientName = p.subscription.user?.user?.name || '';
      }

      return {
        id: p.id,
        amount: p.amount,
        currency: p.currency,
        paymentStatus: p.paymentStatus,
        paymentMethod: p.paymentMethod,
        razorpayOrderId: p.razorpayOrderId,
        razorpayPaymentId: p.razorpayPaymentId,
        createdAt: p.createdAt,
        appointmentId: p.appointmentId,
        labBookingId: p.labBookingId,
        subscriptionId: p.subscriptionId,
        paymentType,
        reference,
        patientName,
      };
    });

    return NextResponse.json({
      data,
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      earnings: {
        lab: labEarnings,
        appointment: appointmentEarnings,
        subscription: subscriptionEarnings,
        total: labEarnings + appointmentEarnings + subscriptionEarnings,
      },
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
