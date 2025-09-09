const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Fix time formats in DoctorAvailability table
 * Converts 12-hour format to 24-hour format
 */
async function fixTimeFormats() {
  console.log('🔧 Starting time format fix...');
  
  try {
    // Use Prisma transaction for atomicity
    await prisma.$transaction(async (tx) => {
      console.log('🔒 Starting database transaction...');
      
      // Get all doctor availability records
      const availabilities = await tx.doctorAvailability.findMany();
      
      console.log(`📊 Found ${availabilities.length} availability records to check`);
      
      const updatePromises = availabilities.map(async (availability) => {
        let needsUpdate = false;
        let newStartTime = availability.startTime;
        let newEndTime = availability.endTime;
        
        // Fix start time
        if (availability.startTime.includes('AM') || availability.startTime.includes('PM')) {
          const timeMatch = availability.startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            let minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3].toUpperCase();
            
            // Convert to 24-hour format
            if (period === 'PM' && hours !== 12) {
              hours += 12;
            } else if (period === 'AM' && hours === 12) {
              hours = 0;
            }
            
            newStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            needsUpdate = true;
            console.log(`🕐 Converting start time: ${availability.startTime} → ${newStartTime}`);
          }
        }
        
        // Fix end time
        if (availability.endTime.includes('AM') || availability.endTime.includes('PM')) {
          const timeMatch = availability.endTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            let minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3].toUpperCase();
            
            // Convert to 24-hour format
            if (period === 'PM' && hours !== 12) {
              hours += 12;
            } else if (period === 'AM' && hours === 12) {
              hours = 0;
            }
            
            newEndTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            needsUpdate = true;
            console.log(`🕐 Converting end time: ${availability.endTime} → ${newEndTime}`);
          }
        }
        
        // Update if needed
        if (needsUpdate) {
          return tx.doctorAvailability.update({
            where: { id: availability.id },
            data: {
              startTime: newStartTime,
              endTime: newEndTime
            }
          });
        }
        
        return Promise.resolve();
      });
      
      await Promise.all(updatePromises);
      
      console.log('✅ All time formats fixed successfully');
    });
    
    console.log('🎉 Time format fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing time formats:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixTimeFormats()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { fixTimeFormats };
