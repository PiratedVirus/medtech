import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { withUnifiedCache, getCacheConfig } from "@/lib/cache-middleware-unified";
import { requireDoctorAuth } from "@/lib/clinic-auth";

const getEarningsHandler = async (request: Request) => {
  try {
    // Use centralized authentication with multi-tenancy validation
    const auth = await requireDoctorAuth();
    
    if (!auth.success) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.errorCode === 'CLINIC_MISMATCH' ? 403 : 401 }
      );
    }

    if (!auth.userId || !auth.clinicId) {
      return NextResponse.json(
        { error: "Invalid authentication context" },
        { status: 401 }
      );
    }

    const doctorId = auth.userId;

    // Calculate earnings by status and payment method
    const [paidPayments, pendingPayments, cashPaymentsCount, onlinePaymentsCount] = await prisma.$transaction([
      // Paid payments
      prisma.payment.findMany({
        where: {
          appointment: {
            userId: doctorId,
          },
          paymentStatus: "PAID",
        },
        include: {
          appointment: {
            include: {
              patient: {
                select: { name: true }
              }
            }
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Pending payments
      prisma.payment.findMany({
        where: {
          appointment: {
            userId: doctorId,
          },
          paymentStatus: "PENDING",
        },
        include: {
          appointment: {
            include: {
              patient: {
                select: { name: true }
              }
            }
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Cash payments count (PAID only)
      prisma.payment.findMany({
        where: {
          appointment: {
            userId: doctorId,
          },
          paymentMethod: { in: ["cash", "Cash", "CASH"] },
          paymentStatus: "PAID",        },
        include: {
          appointment: {
            include: {
              patient: {
                select: { name: true }
              }
            }
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Online payments count (PAID only)
      prisma.payment.findMany({
        where: {
          appointment: {
            userId: doctorId,
          },
          paymentMethod: { in: ["online", "Online", "ONLINE", "upi", "UPI", "card", "Card", "CARD"] },
          paymentStatus: "PAID",        },
        include: {
          appointment: {
            include: {
              patient: {
                select: { name: true }
              }
            }
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Calculate totals
    const paidEarnings = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingEarnings = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    const cashEarnings = cashPaymentsCount.reduce((sum, p) => sum + p.amount, 0);
    const onlineEarnings = onlinePaymentsCount.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate counts for cash and online payments
    const cashCount = cashPaymentsCount.length;
    const onlineCount = onlinePaymentsCount.length;

    // Combine all payments for table display
    const allPayments = [...paidPayments, ...pendingPayments];

    const simplified = allPayments.map((p) => ({
      id: p.id,
      appointmentId: p.appointmentId!,
      patientName: p.appointment?.patient?.name || "Unknown",
      amount: p.amount,
      paymentMethod: p.paymentMethod || "",
      paymentStatus: p.paymentStatus,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        payments: simplified,
        earnings: { 
          paid: paidEarnings, 
          pending: pendingEarnings, 
          cash: cashEarnings,
          online: onlineEarnings,
          cashCount: cashCount,
          onlineCount: onlineCount,
          total: paidEarnings + pendingEarnings 
        },
      }
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};

// ✅ UNIFIED CACHE: Apply cache middleware to GET endpoint
export const GET = withUnifiedCache(getCacheConfig('/api/doctor/earnings'))(getEarningsHandler);
