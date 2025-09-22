const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedPayments() {
  console.log("💰 Seeding payments...");

  // Get appointments and lab bookings
  const appointments = await prisma.appointment.findMany();
  const labBookings = await prisma.labBooking.findMany();

  const payments = [];

  // Seed payments for appointments with earnings tracking
  for (const appointment of appointments) {
    // Get doctor profile to get consultation fee
    const doctorProfile = await prisma.doctorProfile.findUnique({
      where: { userId: appointment.userId }
    });
    
    const consultationFee = doctorProfile?.consultationFee || 1500;
    
    // Create payment with realistic status based on appointment status
    let paymentStatus = "COMPLETED";
    let paymentMethod = "Online";
    
    if (appointment.status === "CANCELLED") {
      paymentStatus = "REFUNDED";
    } else if (appointment.status === "PENDING") {
      paymentStatus = "PENDING";
    } else if (appointment.status === "SCHEDULED") {
      paymentStatus = Math.random() > 0.5 ? "COMPLETED" : "PENDING";
    }
    
    // Randomize payment method
    paymentMethod = Math.random() > 0.7 ? "Cash" : "Online";
    
    const payment = await prisma.payment.create({
      data: {
        appointmentId: appointment.id,
        razorpayOrderId: `order_${Date.now()}_${appointment.id}`,
        razorpayPaymentId: `pay_${Date.now()}_${appointment.id}`,
        amount: consultationFee * 100, // Convert to paise (like in seedEarningsSlotStatus.js)
        currency: "INR",
        paymentStatus: paymentStatus,
        paymentMethod: paymentMethod,
        createdAt: appointment.doctorAvailability.date || new Date(),
        updatedAt: appointment.doctorAvailability.date || new Date(),
      },
    });
    payments.push(payment);
  }

  // Seed payments for lab bookings
  for (const labBooking of labBookings) {
    const labPackage = await prisma.labPackage.findUnique({
      where: { id: labBooking.labPackageId }
    });

    const payment = await prisma.payment.create({
      data: {
        labBookingId: labBooking.id,
        razorpayOrderId: `order_${Date.now()}_lab_${labBooking.id}`,
        razorpayPaymentId: `pay_${Date.now()}_lab_${labBooking.id}`,
        amount: labPackage?.price || 1000,
        currency: "INR",
        paymentStatus: "COMPLETED",
        paymentMethod: "Online",
      },
    });
    payments.push(payment);
  }

  console.log(`✅ ${payments.length} payments seeded`);

  return payments;
}

module.exports = { seedPayments }; 