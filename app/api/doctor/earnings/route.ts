import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const phoneNumber = decoded.plusAddedPhoneNumber as string | undefined;
    if (!phoneNumber) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findFirst({
      where: { phoneNumber },
      include: { doctorProfile: true },
    });

    if (!user?.doctorProfile?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const doctorId = user.id;

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
          paymentMethod: "cash",
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
          paymentMethod: "online",
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
      payments: simplified,
      earnings: { 
        paid: paidEarnings, 
        pending: pendingEarnings, 
        cashCount: cashEarnings, 
        onlineCount: onlineEarnings,
        total: paidEarnings + pendingEarnings 
      },
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
