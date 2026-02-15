import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:reshana2003@127.0.0.1:5432/oncostage_db';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Helper function to get the start of the current week (Monday)
const getWeekStart = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

async function checkAssignments() {
  console.log('Checking doctor-patient assignments...\n');

  const weekStart = getWeekStart();
  console.log('Week Start:', weekStart.toISOString());
  console.log('Current Date:', new Date().toISOString());
  console.log('---');

  // Get all assignments
  const allAssignments = await prisma.doctorPatientAssignment.findMany({
    include: {
      doctor: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log(`\nTotal assignments in database: ${allAssignments.length}\n`);

  if (allAssignments.length > 0) {
    console.log('All assignments:');
    allAssignments.forEach((assignment, index) => {
      console.log(`${index + 1}. Patient: ${assignment.patient.firstName} ${assignment.patient.lastName}`);
      console.log(`   Doctor: Dr. ${assignment.doctor.firstName} ${assignment.doctor.lastName}`);
      console.log(`   Assigned At: ${assignment.assignedAt.toISOString()}`);
      console.log(`   Week Start: ${assignment.weekStartDate.toISOString()}`);
      console.log('---');
    });
  }

  // Get assignments for current week
  const weekAssignments = await prisma.doctorPatientAssignment.findMany({
    where: {
      weekStartDate: weekStart,
    },
    include: {
      doctor: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  console.log(`\nAssignments for current week (starting ${weekStart.toISOString()}): ${weekAssignments.length}`);

  // Get doctor counts
  const doctors = await prisma.user.findMany({
    where: {
      role: 'DOCTOR',
      isActive: true,
    },
    select: {
      firstName: true,
      lastName: true,
      doctorAssignments: {
        where: {
          weekStartDate: weekStart,
        },
      },
    },
  });

  console.log('\nDoctor patient counts:');
  doctors.forEach(doctor => {
    console.log(`Dr. ${doctor.firstName} ${doctor.lastName}: ${doctor.doctorAssignments.length}/10 patients`);
  });

  await prisma.$disconnect();
}

checkAssignments()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  });
