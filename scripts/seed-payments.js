const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPayments() {
  try {
    console.log('🌱 Starting payment seeding...');

    // Get all lab bookings that don't have payments
    const labBookings = await prisma.labBooking.findMany({
      where: {
        payment: null,
        deletedAt: null,
      },
      include: {
        labPackage: {
          select: {
            price: true,
          },
        },
      },
    });

    console.log(`Found ${labBookings.length} lab bookings without payments`);

    // Create payments for each lab booking
    const paymentData = [
      {
        paymentStatus: 'PAID',
        paymentMethod: 'ONLINE',
        currency: 'INR',
      },
      {
        paymentStatus: 'PAID',
        paymentMethod: 'CASH',
        currency: 'INR',
      },
      {
        paymentStatus: 'PENDING',
        paymentMethod: null,
        currency: 'INR',
      },
      {
        paymentStatus: 'PAID',
        paymentMethod: 'CARD',
        currency: 'INR',
      },
      {
        paymentStatus: 'PENDING',
        paymentMethod: null,
        currency: 'INR',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const booking of labBookings) {
      // Check if payment already exists
      const existingPayment = await prisma.payment.findUnique({
        where: { labBookingId: booking.id },
      });

      if (existingPayment) {
        console.log(`⏭️  Payment already exists for booking ${booking.id}, skipping...`);
        skippedCount++;
        continue;
      }

      // Randomly select payment data
      const randomPaymentData = paymentData[Math.floor(Math.random() * paymentData.length)];
      
      // Create payment
      const payment = await prisma.payment.create({
        data: {
          labBookingId: booking.id,
          amount: booking.labPackage?.price || 1500, // Default amount if no package price
          paymentStatus: randomPaymentData.paymentStatus,
          paymentMethod: randomPaymentData.paymentMethod,
          currency: randomPaymentData.currency,
          razorpayOrderId: randomPaymentData.paymentStatus === 'PAID' ? `order_${Date.now()}_${booking.id}` : null,
          razorpayPaymentId: randomPaymentData.paymentStatus === 'PAID' ? `pay_${Date.now()}_${booking.id}` : null,
        },
      });

      console.log(`✅ Created payment for booking ${booking.id}: ${randomPaymentData.paymentStatus} - ${randomPaymentData.paymentMethod || 'PENDING'}`);
      createdCount++;
    }

    console.log(`\n🎉 Payment seeding completed!`);
    console.log(`✅ Created: ${createdCount} payments`);
    console.log(`⏭️  Skipped: ${skippedCount} (already existed)`);
    console.log(`📊 Total processed: ${labBookings.length} bookings`);

  } catch (error) {
    console.error('❌ Error seeding payments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedPayments(); 