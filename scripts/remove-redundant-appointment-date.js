const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function removeRedundantAppointmentDate() {
  console.log('🔧 Analyzing redundant appointmentDate field in Appointment model...');
  
  try {
    // Get all appointments with their doctorAvailability
    const allAppointments = await prisma.appointment.findMany({
      select: {
        id: true,
        doctorAvailability: { date: true },
        doctorAvailabilityId: true,
        doctorAvailability: {
          select: {
            date: true
          }
        }
      }
    });

    console.log(`📊 Found ${allAppointments.length} total appointments`);

    // Check for appointments without doctorAvailability
    const appointmentsWithoutAvailability = allAppointments.filter(apt => !apt.doctorAvailabilityId || !apt.doctorAvailability);
    if (appointmentsWithoutAvailability.length > 0) {
      console.log(`⚠️  Found ${appointmentsWithoutAvailability.length} appointments without doctorAvailability:`);
      appointmentsWithoutAvailability.forEach(apt => {
        console.log(`  - Appointment ${apt.id}: doctorAvailabilityId=${apt.doctorAvailabilityId}`);
      });
      console.log('❌ Cannot proceed - these appointments need to be fixed first');
      return;
    }

    // Use doctorAvailability.date instead
    const appointmentsWithBoth = allAppointments.filter(apt => apt.doctorAvailability.date && apt.doctorAvailability?.date);
    console.log(`📊 Found ${appointmentsWithBoth.length} appointments with both appointmentDate and doctorAvailability.date`);
    
    // Check for inconsistencies
    const inconsistencies = appointmentsWithBoth.filter(apt => {
      const appointmentDate = apt.doctorAvailability.date?.toISOString().split('T')[0];
      const availabilityDate = apt.doctorAvailability?.date?.toISOString().split('T')[0];
      return appointmentDate !== availabilityDate;
    });

    if (inconsistencies.length > 0) {
      console.log(`⚠️  Found ${inconsistencies.length} appointments with inconsistent dates:`);
      inconsistencies.forEach(apt => {
        console.log(`  - Appointment ${apt.id}: appointmentDate=${apt.doctorAvailability.date?.toISOString().split('T')[0]}, doctorAvailability.date=${apt.doctorAvailability?.date?.toISOString().split('T')[0]}`);
      });
      console.log('❌ Cannot proceed - data inconsistencies need to be resolved first');
      return;
    }

    // Use doctorAvailability.date instead
    const appointmentsWithOnlyAppointmentDate = allAppointments.filter(apt => apt.doctorAvailability.date && !apt.doctorAvailability?.date);
    if (appointmentsWithOnlyAppointmentDate.length > 0) {
      console.log(`⚠️  Found ${appointmentsWithOnlyAppointmentDate.length} appointments with only appointmentDate (no doctorAvailability.date):`);
      appointmentsWithOnlyAppointmentDate.forEach(apt => {
        console.log(`  - Appointment ${apt.id}: appointmentDate=${apt.doctorAvailability.date?.toISOString().split('T')[0]}`);
      });
    }

    console.log('✅ Data analysis complete. Ready to proceed with schema update...');

    console.log(`
📝 Next steps:
1. Update schema.prisma to remove appointmentDate from Appointment model
2. Run: npx prisma db push
3. Update all API endpoints to use doctorAvailability.date instead of appointmentDate
4. Update frontend components to use doctorAvailability.date

The redundant appointmentDate field should be removed from:
- Appointment model in schema.prisma
- All API endpoints that reference appointmentDate
- All frontend components that use appointmentDate
    `);

  } catch (error) {
    console.error('❌ Error analyzing doctorAvailability:', error);
  } finally {
    await prisma.$disconnect();
  }
}

removeRedundantAppointmentDate();
