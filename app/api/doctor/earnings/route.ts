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

    const doctorId = user.doctorProfile.id;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const payments = await prisma.payment.findMany({
      where: {
        appointment: {
          doctorId,
          ...(search
            ? {
                OR: [
                  {
                    patient: {
                      name: { contains: search, mode: "insensitive" },
                    },
                  },
                  {
                    appointmentFor: {
                      contains: search,
                      mode: "insensitive",
                    },
                  },
                  {
                    id: isNaN(Number(search)) ? undefined : Number(search),
                  },
                ],
              }
            : {}),
        },
      },
      include: {
        appointment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const appointmentEarnings = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalEarnings = appointmentEarnings;

    const simplified = payments.map((p) => ({
      id: p.id,
      appointmentId: p.appointmentId!,
      amount: p.amount,
      paymentMethod: p.paymentMethod || "",
      paymentStatus: p.paymentStatus,
      createdAt: p.createdAt,
    }));

    return NextResponse.json({
      payments: simplified,
      earnings: { appointment: appointmentEarnings, total: totalEarnings },
    });
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
