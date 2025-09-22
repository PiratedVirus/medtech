import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const toUpper = (v: any) => (typeof v === "string" ? v.trim().replace(/\s+/g, "_").toUpperCase() : v);

async function run() {
  console.log("Starting backfill to uppercase statuses...");

  const updateInBatches = async <T extends { id: number }>(rows: T[], updater: (row: T) => Promise<any>, label: string) => {
    let updated = 0;
    for (const row of rows) {
      try {
        await updater(row);
        updated++;
      } catch (e) {
        console.error(`Failed to update ${label} id=${row.id}`, e);
      }
    }
    console.log(`Updated ${updated}/${rows.length} ${label}`);
  };

  // DoctorAvailability.status
  const availabilities = await prisma.doctorAvailability.findMany({ select: { id: true, status: true } });
  await updateInBatches(availabilities, (a) => prisma.doctorAvailability.update({ where: { id: a.id }, data: { status: toUpper(a.status) } }), "doctor availabilities");

  // Appointment.status
  const appointments = await prisma.appointment.findMany({ select: { id: true, status: true } });
  await updateInBatches(appointments, (a) => prisma.appointment.update({ where: { id: a.id }, data: { status: toUpper(a.status) } }), "appointments");

  // LabBooking.status
  const labBookings = await prisma.labBooking.findMany({ select: { id: true, status: true } });
  await updateInBatches(labBookings, (lb) => prisma.labBooking.update({ where: { id: lb.id }, data: { status: toUpper(lb.status) } }), "lab bookings");

  // Payment.paymentStatus
  const payments = await prisma.payment.findMany({ select: { id: true, paymentStatus: true } });
  await updateInBatches(payments, (p) => prisma.payment.update({ where: { id: p.id }, data: { paymentStatus: toUpper((p as any).paymentStatus) } }), "payments");

  // SubscriptionTracker.paymentStatus
  const trackers = await prisma.subscriptionTracker.findMany({ select: { subscriptionId: true, paymentStatus: true } });
  for (const t of trackers) {
    try {
      await prisma.subscriptionTracker.update({ where: { subscriptionId: t.subscriptionId }, data: { paymentStatus: toUpper((t as any).paymentStatus) } });
    } catch (e) {
      console.error(`Failed to update subscriptionTracker id=${t.subscriptionId}`, e);
    }
  }

  console.log("Backfill complete.");
}

run()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


