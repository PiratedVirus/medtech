const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // ---------- 1. Make sure the three packages exist -----------------
  const packagesToEnsure = [
    {
      name: 'Basic Diabetes Panel',
      data: {
        shortDescription: 'Glucose + HbA1c',
        description: 'Essential tests for diabetes monitoring',
        price: 800,
        isLabPackage: true,
        parameters: { tests: ['FBS', 'HbA1c'] },
      },
    },
    {
      name: 'Complete Lipid Profile',
      data: {
        shortDescription: 'Cholesterol + Triglycerides',
        description: 'Comprehensive lipid check',
        price: 1200,
        isLabPackage: true,
        parameters: { tests: ['Total Cholesterol', 'HDL', 'LDL', 'Triglycerides'] },
      },
    },
    {
      name: 'Kidney & Liver Combo',
      data: {
        shortDescription: 'KFT + LFT',
        description: 'Kidney and liver function assessment',
        price: 1500,
        isLabPackage: true,
        parameters: { tests: ['Creatinine', 'Urea', 'Bilirubin', 'ALT', 'AST'] },
      },
    },
  ];

  const labPackages = {};
  for (const p of packagesToEnsure) {
    const pkg = await prisma.labPackage.upsert({
      where: { name: p.name },
      update: {},              // nothing to update – keep existing values
      create: { name: p.name, ...p.data },
    });
    labPackages[pkg.name] = pkg;
  }
  console.log('✅ ensured lab packages');

  // ---------- 2. Pick five real patients & a few phlebotomists -------
  // You can tweak this query however you like; the idea is to grab some
  // existing rows instead of creating new placeholder users.
  const patients = await prisma.user.findMany({
    where: { role: 'PATIENT' },
    select: { id: true },
    take: 5,
  });
  if (patients.length < 5) {
    throw new Error('Need at least 5 PATIENT rows to continue');
  }

  const phlebotomists = await prisma.phlebotomist.findMany({
    select: { id: true },
    take: 4,
  });
  if (phlebotomists.length < 4) {
    throw new Error('Need a few phlebotomists in the DB');
  }

  // ---------- 3. Insert bookings IFF they don’t already exist --------
  const statuses = [
    'PENDING',
    'PHLEBOTOMIST_ASSIGNED',
    'SAMPLE_COLLECTED',
    'IN_LAB',
    'COMPLETED',
  ];

  const today = new Date();
  let createdCount = 0;

  for (let i = 0; i < 5; i++) {
    const bookingExists = await prisma.labBooking.findFirst({
      where: {
        patientId: patients[i].id,
        labPackageId: labPackages[Object.keys(labPackages)[i % 3]].id,
      },
    });

    if (!bookingExists) {
      await prisma.labBooking.create({
        data: {
          patientId: patients[i].id,
          labPackageId: labPackages[Object.keys(labPackages)[i % 3]].id,
          labDate: new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000),
          status: statuses[i],
          phlebotomistId: i === 0 ? null : phlebotomists[i % phlebotomists.length].id,
          assignedDate: i === 0 ? null : today,
          assignedTime: i === 0 ? null : `${9 + i}:00`,
          sampleCollected: i >= 2,
          sampleCollectedAt: i >= 2 ? today : null,
          reportGeneratedAt: i === 4 ? today : null,
        },
      });
      createdCount += 1;
    }
  }

  console.log(`🎉 Added ${createdCount} new lab bookings`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());