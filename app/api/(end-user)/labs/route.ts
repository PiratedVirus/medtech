import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ success: false, error: "Missing patientId" }, { status: 400 });
    }

    const bookings = await prisma.labBooking.findMany({
      where: {
        deletedAt: null,
        patientId: parseInt(patientId, 10),
      },
      include: {
        labPackage: true,
        patient: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        labDate: "desc",
      },
    });

    const scheduled = bookings
      .filter(b => b.status === "Scheduled")
      .map((b) => ({
        id: b.id,
        resultDate: b.labDate,
        resultGeneratedBy: "Lab Technician",
        resultName: `${b.patient.name} - ${b.labPackage.name} - ${new Date(b.labDate).toLocaleDateString("en-GB")}`,
        reports: [],
        status: b.status,
      }));

    const completed = bookings
      .filter(b => b.status === "COMPLETED")
      .map((b) => ({
        id: b.id,
        resultDate: b.labDate,
        resultGeneratedBy: "Lab Technician",
        resultName: `${b.patient.name} - ${b.labPackage.name} - ${new Date(b.labDate).toLocaleDateString("en-GB")}`,
        reports: Array.isArray(b.labResult)
          ? b.labResult.map((url) => {
              const raw = decodeURIComponent(url.split("/").pop() || "");
              const cleaned = raw
                .replace(/\.pdf$/, "")
                .replace(/^.*?-lab-\d+-/, "")
                .replace(/[-_]/g, " ")
                .trim();
              return {
                name: cleaned || "Unknown Report",
                pdfUrl: url,
                values: "",
              };
            })
          : [],
        status: b.status,
      }));

    return NextResponse.json({ scheduled, completed });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch lab results" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log("POST /api/lab-bookings called");
    const body = await request.json();
    console.log("Request body:", body);

    const {
      appointmentFor,
      fullName,
      mobile,
      email,
      date,
      address,
      packageId,
      patientId,
      paymentOption,
      razorpayResponse,
      consultationType,
      labPackageFees,
      subscriptionId,
      labTestsDates,
    } = body;

    if (!patientId || !packageId) {
      console.error("Missing required fields", { patientId, packageId });
      return NextResponse.json(
        { success: false, error: "Missing required fields: patientId, packageId" },
        { status: 400 }
      );
    }

    const newLabBooking = await prisma.$transaction(async (tx) => {
      // Create the lab booking
      const booking = await tx.labBooking.create({
        data: {
          patientId,
          labPackageId: packageId,
          appointmentFor,
          fullName,
          mobile,
          email,
          address,
          paymentOption,
          labDate: new Date(date),
          status: "Scheduled",
        },
      });

      console.log("LabBooking created:", booking);

      // Update subscription tracker if using plan
      if (consultationType === "plan") {
        console.log("Updating subscriptionTracker for subscriptionId:", subscriptionId, "with labTestsDates:", labTestsDates);
        await tx.subscriptionTracker.update({
          where: { subscriptionId },
          data: { labTestsDates },
        });
        console.log("SubscriptionTracker updated");
      }

      // Create payment record if online
      if (paymentOption === "online" && razorpayResponse) {
        console.log("Creating payment record for bookingId:", booking.id, "with razorpayResponse:", razorpayResponse);
        await tx.payment.create({
          data: {
            labBookingId: booking.id,
            razorpayOrderId: razorpayResponse.razorpay_order_id,
            razorpayPaymentId: razorpayResponse.razorpay_payment_id,
            amount: razorpayResponse.amount,
            currency: razorpayResponse.currency || "INR",
            paymentStatus: "Paid",
            paymentMethod: razorpayResponse.method || "upi",
          },
        });
        console.log("Payment record created");
      }

      if(paymentOption === "clinic") {
        await tx.payment.create({
          data: {
            labBookingId: booking.id,
            amount: labPackageFees*100,
            currency: "INR",
            paymentStatus: "Pending",
            paymentMethod: "offline",
          },
        });
      }

      return booking;
    });

    console.log("Lab booking transaction completed successfully, ID:", newLabBooking.id);

    return NextResponse.json({ success: true, labBooking: newLabBooking });
  } catch (err: any) {
    // console.error("Error creating lab booking:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err) || "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}