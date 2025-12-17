import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { SmartCacheInvalidation } from "@/lib/cache-dependencies";
import { getSubdomainClinicFromRequest } from "@/lib/clinic-auth";

export async function GET(request: NextRequest) {
  try {
    // Get clinic ID from subdomain for multi-tenancy
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);
    
    if (!subdomainClinicId) {
      return NextResponse.json({ success: false, error: "Clinic not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get("patientId");

    if (!patientId) {
      return NextResponse.json({ success: false, error: "Missing patientId" }, { status: 400 });
    }

    // Verify patient belongs to the current clinic
    const patient = await prisma.user.findFirst({
      where: {
        id: parseInt(patientId, 10),
        clinicId: subdomainClinicId,
        deletedAt: null,
      },
    });

    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found in this clinic" }, { status: 404 });
    }

    const bookings = await prisma.labBooking.findMany({
      where: {
        deletedAt: null,
        patientId: parseInt(patientId, 10),
        // Ensure lab package belongs to the same clinic
        labPackage: {
          clinicId: subdomainClinicId,
          deletedAt: null,
        },
      },
      include: {
        labPackage: true,
        patient: {
          select: {
            name: true,
          },
        },
        labAssignments: {
          include: {
            phlebotomist: {
              include: {
                user: {
                  select: {
                    name: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        labDate: "desc",
      },
    });

    const scheduled = bookings
      .filter(b => b.status !== "COMPLETED" && b.status !== "CANCELLED")
      .map((b) => ({
        id: b.id,
        resultDate: b.labDate,
        resultGeneratedBy: "Lab Technician",
        resultName: `${b.patient.name} - ${b.labPackage.name} - ${new Date(b.labDate).toLocaleDateString("en-GB")}`,
        reports: [],
        status: b.status,
        phlebotomist: b.labAssignments[0]?.phlebotomist?.user?.name || "Not assigned",
        labAssignmentId: b.labAssignments[0]?.id,
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
        phlebotomist: b.labAssignments[0]?.phlebotomist?.user?.name || "Not assigned",
        labAssignmentId: b.labAssignments[0]?.id,
      }));

    return NextResponse.json({ scheduled, completed });
  } catch (error) {
    console.error("Error fetching lab bookings:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch lab bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get clinic ID from subdomain for multi-tenancy
    const { clinicId: subdomainClinicId } = await getSubdomainClinicFromRequest(request);
    
    if (!subdomainClinicId) {
      return NextResponse.json({ success: false, error: "Clinic not found" }, { status: 404 });
    }

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

    // Verify patient and lab package belong to the current clinic
    const [patient, labPackage] = await Promise.all([
      prisma.user.findFirst({
        where: {
          id: parseInt(patientId, 10),
          clinicId: subdomainClinicId,
          deletedAt: null,
        },
      }),
      prisma.labPackage.findFirst({
        where: {
          id: packageId,
          clinicId: subdomainClinicId,
          deletedAt: null,
        },
      }),
    ]);

    if (!patient) {
      return NextResponse.json({ success: false, error: "Patient not found in this clinic" }, { status: 404 });
    }

    if (!labPackage) {
      return NextResponse.json({ success: false, error: "Lab package not found in this clinic" }, { status: 404 });
    }

    const newLabBooking = await prisma.$transaction(async (tx) => {
      // Create the lab booking
      const booking = await tx.labBooking.create({
        data: {
          patientId: parseInt(patientId, 10),
          labPackageId: packageId,
          appointmentFor,
          fullName,
          mobile,
          email,
          address,
          paymentOption,
          labDate: new Date(date),
          status: "PENDING", // Single status for entire workflow
        },
      });

      console.log("LabBooking created:", booking);

      // Manual assignment policy: do not auto-create or link any LabAssignment here.
      // Pathology staff will assign phlebotomists from the pathology panel.
      console.log("Manual assignment policy active: no auto-creation/linking of LabAssignment for booking:", booking.id);

      // Update subscription tracker if using plan
      if (paymentOption === "plan") {
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
            amount: Number(labPackageFees)*100,
            currency: "INR",
            paymentStatus: "Pending",
            paymentMethod: "offline",
          },
        });
      }

      return booking;
    });

    console.log("Lab booking transaction completed successfully, ID:", newLabBooking.id);

    // ✅ MEDIUM PRIORITY: Smart cache invalidation for lab results
    try {
      await SmartCacheInvalidation.onLabResultUpdate(parseInt(patientId, 10));
      console.log(`[LAB-BOOKING] Smart cache invalidation completed for patient ${patientId}`);
    } catch (cacheError) {
      console.error('[LAB-BOOKING] Error in smart cache invalidation:', cacheError);
      // Don't fail the request if cache invalidation fails
    }

    return NextResponse.json({ success: true, labBooking: newLabBooking });
  } catch (err: any) {
    // console.error("Error creating lab booking:", err);
    const message = err instanceof Error ? err.message : JSON.stringify(err) || "Server error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}