// Use compiled Prisma client with CommonJS require
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const appointments = await prisma.appointment.findMany({
    select: { id: true, prescriptionLink: true, status: true },
    where: { deletedAt: null },
  });

  const withRx = appointments.filter(a => !!a.prescriptionLink && String(a.status).toUpperCase() !== 'COMPLETED');
  const withoutRx = appointments.filter(a => !a.prescriptionLink && String(a.status).toUpperCase() !== 'SCHEDULED');

  for (const a of withRx) {
    await prisma.appointment.update({ where: { id: a.id }, data: { status: 'COMPLETED' } });
  }
  for (const a of withoutRx) {
    await prisma.appointment.update({ where: { id: a.id }, data: { status: 'SCHEDULED' } });
  }

  console.log(`Updated ${withRx.length} to COMPLETED and ${withoutRx.length} to SCHEDULED.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


