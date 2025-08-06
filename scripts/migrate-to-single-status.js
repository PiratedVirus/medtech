const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateToSingleStatus() {
  try {
    console.log('🔄 Starting migration to single status...');

    // 1. Update LabBookings to use single status
    console.log('📝 Updating LabBookings...');
    
    // Get all lab bookings
    const labBookings = await prisma.labBooking.findMany({
      include: {
        labAssignments: true
      }
    });

    console.log(`Found ${labBookings.length} lab bookings to migrate`);

    for (const booking of labBookings) {
      let newStatus = 'PENDING'; // Default status

      // If booking has pathologyStatus, use it
      if (booking.pathologyStatus) {
        newStatus = booking.pathologyStatus;
      } else if (booking.status && booking.status !== 'Scheduled') {
        // If old status is not 'Scheduled', use it
        newStatus = booking.status;
      }

      // Update the booking with single status
      await prisma.labBooking.update({
        where: { id: booking.id },
        data: {
          status: newStatus,
          // Remove pathologyStatus field (will be done by schema migration)
        }
      });

      console.log(`✅ Updated booking ${booking.id}: ${booking.status} → ${newStatus}`);
    }

    // 2. Update LabAssignments to ensure consistency
    console.log('📝 Updating LabAssignments...');
    
    const labAssignments = await prisma.labAssignment.findMany({
      include: {
        labBooking: true
      }
    });

    console.log(`Found ${labAssignments.length} lab assignments to check`);

    for (const assignment of labAssignments) {
      if (assignment.labBooking) {
        // Sync assignment status with booking status
        await prisma.labAssignment.update({
          where: { id: assignment.id },
          data: {
            status: assignment.labBooking.status
          }
        });

        console.log(`✅ Synced assignment ${assignment.id} with booking status: ${assignment.labBooking.status}`);
      }
    }

    console.log('🎉 Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- LabBookings updated: ${labBookings.length}`);
    console.log(`- LabAssignments synced: ${labAssignments.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToSingleStatus()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToSingleStatus }; 