const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAssignments() {
  try {
    console.log('🔍 Checking Lab Assignment Status...\n');

    // Get all lab assignments
    const assignments = await prisma.labAssignment.findMany({
      include: {
        patient: {
          select: { name: true }
        },
        phlebotomist: {
          include: {
            user: {
              select: { name: true }
            }
          }
        },
        lab: {
          select: { name: true }
        },
        labBooking: {
          select: {
            labPackage: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { status: 'asc' }
    });

    console.log(`📊 Total Lab Assignments: ${assignments.length}\n`);

    // Group by status
    const byStatus = {};
    assignments.forEach(assignment => {
      if (!byStatus[assignment.status]) {
        byStatus[assignment.status] = [];
      }
      byStatus[assignment.status].push(assignment);
    });

    // Show assignments with phlebotomist (should show "Start Appointment" button)
    console.log('✅ ASSIGNMENTS WITH PHLEBOTOMIST (Shows "Start Appointment" button):');
    console.log('='.repeat(80));
    
    const withPhlebotomist = assignments.filter(a => a.phlebotomist);
    if (withPhlebotomist.length > 0) {
      withPhlebotomist.slice(0, 3).forEach((assignment, index) => {
        console.log(`${index + 1}. ID: ${assignment.id}`);
        console.log(`   Patient: ${assignment.patient.name}`);
        console.log(`   Phlebotomist: ${assignment.phlebotomist.user.name}`);
        console.log(`   Status: ${assignment.status}`);
        console.log(`   Date: ${assignment.assignedDate.toLocaleDateString()}`);
        console.log(`   Time: ${assignment.assignedTime}`);
        console.log(`   Lab Package: ${assignment.labBooking?.labPackage?.name || 'N/A'}`);
        console.log(`   assignedPhlebotomist field: "${assignment.phlebotomist.user.name}"`);
        console.log(`   → Frontend shows: "Start Appointment" button`);
        console.log('');
      });
    } else {
      console.log('   No assignments with phlebotomist found');
    }

    // Show assignments without phlebotomist (should show "Assign Phlebotomist" button)
    console.log('❌ ASSIGNMENTS WITHOUT PHLEBOTOMIST (Shows "Assign Phlebotomist" button):');
    console.log('='.repeat(80));
    
    const withoutPhlebotomist = assignments.filter(a => !a.phlebotomist);
    if (withoutPhlebotomist.length > 0) {
      withoutPhlebotomist.slice(0, 3).forEach((assignment, index) => {
        console.log(`${index + 1}. ID: ${assignment.id}`);
        console.log(`   Patient: ${assignment.patient.name}`);
        console.log(`   Phlebotomist: NULL`);
        console.log(`   Status: ${assignment.status}`);
        console.log(`   Date: ${assignment.assignedDate.toLocaleDateString()}`);
        console.log(`   Time: ${assignment.assignedTime}`);
        console.log(`   Lab Package: ${assignment.labBooking?.labPackage?.name || 'N/A'}`);
        console.log(`   assignedPhlebotomist field: null`);
        console.log(`   → Frontend shows: "Assign Phlebotomist" button`);
        console.log('');
      });
    } else {
      console.log('   No assignments without phlebotomist found');
    }

    // Show status breakdown
    console.log('📈 STATUS BREAKDOWN:');
    console.log('='.repeat(40));
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`${status}: ${count.length} assignments`);
    });

    console.log('\n🔧 LOGIC EXPLANATION:');
    console.log('='.repeat(40));
    console.log('1. Frontend checks: appointment.assignedPhlebotomist');
    console.log('2. If assignedPhlebotomist is truthy → Shows "Start Appointment" button');
    console.log('3. If assignedPhlebotomist is null/undefined → Shows "Assign Phlebotomist" button');
    console.log('4. assignedPhlebotomist comes from: assignment.phlebotomist?.user?.name');
    console.log('5. If phlebotomist relation is null → assignedPhlebotomist = null');

  } catch (error) {
    console.error('❌ Error checking assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAssignments(); 