const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupOrphanedAssignments() {
  try {
    console.log('Starting cleanup of orphaned lab assignments...');

    // Find assignments that are not linked to any lab booking
    const orphanedAssignments = await prisma.labAssignment.findMany({
      where: {
        labBookingId: null,
        status: {
          in: ["PENDING", "ASSIGNED"]
        },
        deletedAt: null
      },
      include: {
        patient: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`Found ${orphanedAssignments.length} orphaned assignments`);

    if (orphanedAssignments.length > 0) {
      // Soft delete orphaned assignments
      const deletePromises = orphanedAssignments.map(assignment => 
        prisma.labAssignment.update({
          where: { id: assignment.id },
          data: { 
            deletedAt: new Date(),
            status: "CANCELLED"
          }
        })
      );

      await Promise.all(deletePromises);
      console.log('Successfully cleaned up orphaned assignments');
    }

    // Find duplicate active assignments for the same patient
    const duplicateAssignments = await prisma.$queryRaw`
      SELECT 
        "patientId",
        COUNT(*) as count,
        ARRAY_AGG(id) as assignment_ids
      FROM "LabAssignment"
      WHERE status IN ('PENDING', 'ASSIGNED', 'PHLEBOTOMIST_LEFT', 'SAMPLE_COLLECTED', 'IN_LAB', 'ANALYZING')
        AND "deletedAt" IS NULL
      GROUP BY "patientId"
      HAVING COUNT(*) > 1
    `;

    console.log(`Found ${duplicateAssignments.length} patients with duplicate assignments`);

    for (const duplicate of duplicateAssignments) {
      const assignmentIds = duplicate.assignment_ids;
      // Keep the most recent assignment, delete the rest
      const assignmentsToDelete = assignmentIds.slice(1);
      
      const deletePromises = assignmentsToDelete.map(id => 
        prisma.labAssignment.update({
          where: { id: parseInt(id) },
          data: { 
            deletedAt: new Date(),
            status: "CANCELLED"
          }
        })
      );

      await Promise.all(deletePromises);
      console.log(`Cleaned up duplicate assignments for patient ${duplicate.patientId}`);
    }

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupOrphanedAssignments(); 