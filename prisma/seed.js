/* eslint-disable no-console */
const { PrismaClient, UserRole } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDoctorsAndDieticians() {
  // 1. Define sample DOCTORS
  const doctors = [
    {
      name: 'Dr. Ravi Kapoor',
      phoneNumber: '+91-9000000001',
      email: 'ravi.kapoor@example.com',
      password: 'securePassword1',
      specialty: 'Cardiology',
      yearsOfExperience: 10,
      licenseNumber: 'DOC-0001',
      consultationFee: 600,
      rating: 4.5,
    },
    {
      name: 'Dr. Pooja Sharma',
      phoneNumber: '+91-9000000002',
      email: 'pooja.sharma@example.com',
      password: 'securePassword2',
      specialty: 'Dermatology',
      yearsOfExperience: 5,
      licenseNumber: 'DOC-0002',
      consultationFee: 400,
      rating: 4.3,
    },
    {
      name: 'Dr. Suresh Malhotra',
      phoneNumber: '+91-9000000003',
      email: 'suresh.malhotra@example.com',
      password: 'securePassword3',
      specialty: 'Orthopedics',
      yearsOfExperience: 8,
      licenseNumber: 'DOC-0003',
      consultationFee: 550,
      rating: 4.2,
    },
    {
      name: 'Dr. Anjali Menon',
      phoneNumber: '+91-9000000004',
      email: 'anjali.menon@example.com',
      password: 'securePassword4',
      specialty: 'Pediatrics',
      yearsOfExperience: 6,
      licenseNumber: 'DOC-0004',
      consultationFee: 500,
      rating: 4.6,
    },
    {
      name: 'Dr. Vikram Singhania',
      phoneNumber: '+91-9000000005',
      email: 'vikram.singhania@example.com',
      password: 'securePassword5',
      specialty: 'Neurology',
      yearsOfExperience: 12,
      licenseNumber: 'DOC-0005',
      consultationFee: 700,
      rating: 4.8,
    },
    {
      name: 'Dr. Kiran Deshmukh',
      phoneNumber: '+91-9000000006',
      email: 'kiran.deshmukh@example.com',
      password: 'securePassword6',
      specialty: 'Gynecology',
      yearsOfExperience: 9,
      licenseNumber: 'DOC-0006',
      consultationFee: 450,
      rating: 4.4,
    },
    {
      name: 'Dr. Rakesh Gupta',
      phoneNumber: '+91-9000000007',
      email: 'rakesh.gupta@example.com',
      password: 'securePassword7',
      specialty: 'Gastroenterology',
      yearsOfExperience: 7,
      licenseNumber: 'DOC-0007',
      consultationFee: 480,
      rating: 4.1,
    },
    {
      name: 'Dr. Divya Nair',
      phoneNumber: '+91-9000000008',
      email: 'divya.nair@example.com',
      password: 'securePassword8',
      specialty: 'ENT',
      yearsOfExperience: 4,
      licenseNumber: 'DOC-0008',
      consultationFee: 400,
      rating: 4.0,
    },
  ];

  // 2. Define sample DIETICIANS
  const dieticians = [
    {
      name: 'Nisha Patel',
      phoneNumber: '+91-9000000009',
      email: 'nisha.patel@example.com',
      password: 'securePassword9',
      specialty: 'Weight Management',
      yearsOfExperience: 5,
      certifications: 'Certified Nutritionist',
    },
    {
      name: 'Amit Tandon',
      phoneNumber: '+91-9000000010',
      email: 'amit.tandon@example.com',
      password: 'securePassword10',
      specialty: 'Sports Nutrition',
      yearsOfExperience: 3,
      certifications: 'Diploma in Sports Dietetics',
    },
    {
      name: 'Shreya Kapoor',
      phoneNumber: '+91-9000000011',
      email: 'shreya.kapoor@example.com',
      password: 'securePassword11',
      specialty: 'Pediatric Nutrition',
      yearsOfExperience: 4,
      certifications: 'Child Nutrition Certification',
    },
    {
      name: 'Harsh Mehta',
      phoneNumber: '+91-9000000012',
      email: 'harsh.mehta@example.com',
      password: 'securePassword12',
      specialty: 'Clinical Nutrition',
      yearsOfExperience: 6,
      certifications: 'R.D. (Registered Dietitian)',
    },
    {
      name: 'Priya Iyer',
      phoneNumber: '+91-9000000013',
      email: 'priya.iyer@example.com',
      password: 'securePassword13',
      specialty: 'Diabetic Nutrition',
      yearsOfExperience: 7,
      certifications: 'Diabetes Educator Certificate',
    },
    {
      name: 'Mohan Bajaj',
      phoneNumber: '+91-9000000014',
      email: 'mohan.bajaj@example.com',
      password: 'securePassword14',
      specialty: 'Cardiac Nutrition',
      yearsOfExperience: 2,
      certifications: 'Heart-Healthy Certification',
    },
    {
      name: 'Radhika Joshi',
      phoneNumber: '+91-9000000015',
      email: 'radhika.joshi@example.com',
      password: 'securePassword15',
      specialty: 'Renal Nutrition',
      yearsOfExperience: 5,
      certifications: 'Kidney Health Program',
    },
  ];

  // 3. Create all doctors + their DoctorProfile
  const doctorPromises = doctors.map((doc) =>
    prisma.user.create({
      data: {
        clinicId: 2,
        phoneNumber: doc.phoneNumber,
        email: doc.email,
        password: doc.password,
        name: doc.name,
        role: UserRole.DOCTOR, // or 'DOCTOR' as string
        doctorProfile: {
          create: {
            specialty: doc.specialty,
            yearsOfExperience: doc.yearsOfExperience,
            licenseNumber: doc.licenseNumber,
            consultationFee: doc.consultationFee,
            rating: doc.rating,
          },
        },
      },
    })
  );

  // 4. Create all dieticians + their DieticianProfile
  const dieticianPromises = dieticians.map((diet) =>
    prisma.user.create({
      data: {
        clinicId: 2,
        phoneNumber: diet.phoneNumber,
        email: diet.email,
        password: diet.password,
        name: diet.name,
        role: UserRole.DIETICIAN, // or 'DIETICIAN' as string
        dieticianProfile: {
          create: {
            specialty: diet.specialty,
            yearsOfExperience: diet.yearsOfExperience,
            certifications: diet.certifications,
          },
        },
      },
    })
  );

  // 5. Run all in a single transaction
  await prisma.$transaction([...doctorPromises, ...dieticianPromises]);
  console.log('8 Doctors and 7 Dieticians seeded successfully (clinicId = 1)!');
}

seedDoctorsAndDieticians()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });