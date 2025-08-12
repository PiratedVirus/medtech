// eslint-disable-next-line @typescript-eslint/no-var-requires
const prisma = require("../lib/prisma").default;

async function main() {
  // Set COMPLETED if prescriptionLink present; else set SCHEDULED
  const appointments = await prisma.appointment.findMany({
    select: { id: true, prescriptionLink: true, status: true },
  });

  const withRx = appointments.filter(a => !!a.prescriptionLink && a.status?.toUpperCase() !== "COMPLETED");
  const withoutRx = appointments.filter(a => !a.prescriptionLink && a.status?.toUpperCase() !== "SCHEDULED");

  for (const a of withRx) {
    await prisma.appointment.update({ where: { id: a.id }, data: { status: "COMPLETED" } });
  }
  for (const a of withoutRx) {
    await prisma.appointment.update({ where: { id: a.id }, data: { status: "SCHEDULED" } });
  }

  console.log(`Updated ${withRx.length} to COMPLETED and ${withoutRx.length} to SCHEDULED.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });


