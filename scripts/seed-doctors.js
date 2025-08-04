const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDoctors() {
  try {
    console.log('🌱 Starting doctors seeding...');

    // Create doctor users
    const doctorData = [
      {
        user: {
          phoneNumber: "+91-1111111110",
          email: "dr.sharma@carediabetics.com",
          name: "Dr. Rajesh Sharma",
          role: "DOCTOR",
          status: "ACTIVE",
        },
        profile: {
          specialty: "Endocrinology",
          yearsOfExperience: 15,
          licenseNumber: "DOC001",
          consultationFee: 1500,
          rating: 4.8,
          type: "video",
          doctorCode: "DOC001",
        }
      },
      {
        user: {
          phoneNumber: "+91-2222222220",
          email: "dr.patel@carediabetics.com",
          name: "Dr. Priya Patel",
          role: "DOCTOR",
          status: "ACTIVE",
        },
        profile: {
          specialty: "Internal Medicine",
          yearsOfExperience: 12,
          licenseNumber: "DOC002",
          consultationFee: 1200,
          rating: 4.7,
          type: "video",
          doctorCode: "DOC002",
        }
      },
      {
        user: {
          phoneNumber: "+91-3333333330",
          email: "dr.kumar@carediabetics.com",
          name: "Dr. Amit Kumar",
          role: "DOCTOR",
          status: "ACTIVE",
        },
        profile: {
          specialty: "Cardiology",
          yearsOfExperience: 18,
          licenseNumber: "DOC003",
          consultationFee: 1800,
          rating: 4.9,
          type: "video",
          doctorCode: "DOC003",
        }
      },
      {
        user: {
          phoneNumber: "+91-4444444440",
          email: "dr.singh@carediabetics.com",
          name: "Dr. Neha Singh",
          role: "DOCTOR",
          status: "ACTIVE",
        },
        profile: {
          specialty: "General Medicine",
          yearsOfExperience: 10,
          licenseNumber: "DOC004",
          consultationFee: 1000,
          rating: 4.6,
          type: "video",
          doctorCode: "DOC004",
        }
      },
      {
        user: {
          phoneNumber: "+91-5555555550",
          email: "dr.verma@carediabetics.com",
          name: "Dr. Sneha Verma",
          role: "DOCTOR",
          status: "ACTIVE",
        },
        profile: {
          specialty: "Diabetes Care",
          yearsOfExperience: 14,
          licenseNumber: "DOC005",
          consultationFee: 1400,
          rating: 4.8,
          type: "video",
          doctorCode: "DOC005",
        }
      }
    ];

    const doctors = [];
    for (const data of doctorData) {
      let user = await prisma.user.findFirst({
        where: { 
          phoneNumber: data.user.phoneNumber,
          deletedAt: null
        }
      });

      if (!user) {
        user = await prisma.user.create({
          data: data.user,
        });
      }

      let doctorProfile = await prisma.doctorProfile.findFirst({
        where: { userId: user.id }
      });

      if (!doctorProfile) {
        doctorProfile = await prisma.doctorProfile.create({
          data: {
            userId: user.id,
            ...data.profile,
          },
        });
      }
      doctors.push({ user, profile: doctorProfile });
    }

    console.log(`✅ Created ${doctors.length} doctors`);

    // Create doctor availability slots
    console.log('Creating doctor availability slots...');
    const today = new Date();
    const doctorAvailabilities = [];

    for (let i = 0; i < 20; i++) {
      const doctor = doctors[i % doctors.length];
      const date = new Date(today.getTime() + (i + 1) * 24 * 60 * 60 * 1000); // 1-20 days from now
      
      const availability = await prisma.doctorAvailability.create({
        data: {
          userId: doctor.user.id,
          date: date,
          startTime: "09:00",
          endTime: "17:00",
          status: "AVAILABLE",
        },
      });
      doctorAvailabilities.push(availability);
    }

    console.log(`✅ Created ${doctorAvailabilities.length} doctor availability slots`);

    console.log('🎉 Doctors seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Doctors Created: ${doctors.length}`);
    console.log(`- Availability Slots: ${doctorAvailabilities.length}`);

  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedDoctors()
  .then(() => {
    console.log('✅ Doctors seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Doctors seeding failed:', error);
    process.exit(1);
  }); 