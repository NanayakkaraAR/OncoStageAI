import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { hashPassword } from '../src/utils/password.util';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:reshana2003@127.0.0.1:5432/oncostage_db';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting database seeding...');

  // Hash password for all dummy users
  const hashedPassword = await hashPassword('password123');

  // Create dummy doctors
  const doctors = [
    {
      email: 'dr.smith@students.nsbm.ac.lk',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'DOCTOR' as const,
      isActive: true,
    },
    {
      email: 'dr.johnson@students.nsbm.ac.lk',
      password: hashedPassword,
      firstName: 'Emily',
      lastName: 'Johnson',
      role: 'DOCTOR' as const,
      isActive: true,
    },
    {
      email: 'dr.williams@students.nsbm.ac.lk',
      password: hashedPassword,
      firstName: 'Michael',
      lastName: 'Williams',
      role: 'DOCTOR' as const,
      isActive: true,
    },
    {
      email: 'dr.brown@students.nsbm.ac.lk',
      password: hashedPassword,
      firstName: 'Sarah',
      lastName: 'Brown',
      role: 'DOCTOR' as const,
      isActive: true,
    },
    {
      email: 'dr.jones@students.nsbm.ac.lk',
      password: hashedPassword,
      firstName: 'David',
      lastName: 'Jones',
      role: 'DOCTOR' as const,
      isActive: true,
    },
    {
      email: 'dr.garcia@students.nsbm.ac.lk',
      password: hashedPassword,
      firstName: 'Maria',
      lastName: 'Garcia',
      role: 'DOCTOR' as const,
      isActive: true,
    },
    {
      email: 'dr.martinez@students.nsbm.ac.lk',
      password: hashedPassword,
      firstName: 'Carlos',
      lastName: 'Martinez',
      role: 'DOCTOR' as const,
      isActive: true,
    },
    {
      email: 'dr.rodriguez@students.nsbm.ac.lk',
      password: hashedPassword,
      firstName: 'Ana',
      lastName: 'Rodriguez',
      role: 'DOCTOR' as const,
      isActive: true,
    },
  ];

  // Create doctors in database
  for (const doctor of doctors) {
    const existingDoctor = await prisma.user.findUnique({
      where: { email: doctor.email },
    });

    if (!existingDoctor) {
      await prisma.user.create({
        data: doctor,
      });
      console.log(`✓ Created doctor: Dr. ${doctor.firstName} ${doctor.lastName}`);
    } else {
      console.log(`- Doctor already exists: Dr. ${doctor.firstName} ${doctor.lastName}`);
    }
  }

  // Create a test admin user
  const adminEmail = 'admin@oncostage.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log('✓ Created admin user');
  } else {
    console.log('- Admin user already exists');
  }

  // Create a test patient user
  const patientEmail = 'patient@test.com';
  const existingPatient = await prisma.user.findUnique({
    where: { email: patientEmail },
  });

  if (!existingPatient) {
    await prisma.user.create({
      data: {
        email: patientEmail,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Patient',
        role: 'PATIENT',
        isActive: true,
      },
    });
    console.log('✓ Created test patient');
  } else {
    console.log('- Test patient already exists');
  }

  console.log('\n✅ Database seeding completed!');
  console.log('\nTest Credentials:');
  console.log('─────────────────────────────────────────────');
  console.log('Doctors (any): @students.nsbm.ac.lk');
  console.log('  - dr.smith@students.nsbm.ac.lk');
  console.log('  - dr.johnson@students.nsbm.ac.lk');
  console.log('  - dr.williams@students.nsbm.ac.lk');
  console.log('  - (and 5 more...)');
  console.log('\nPatient: patient@test.com');
  console.log('Admin: admin@oncostage.com');
  console.log('\nPassword for all: password123');
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
