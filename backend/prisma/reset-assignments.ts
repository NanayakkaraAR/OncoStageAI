import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:reshana2003@127.0.0.1:5432/oncostage_db';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function resetAssignments() {
  console.log('Resetting doctor-patient assignments...');

  // Delete all assignments
  const deleteResult = await prisma.doctorPatientAssignment.deleteMany({});
  
  console.log(`✓ Deleted ${deleteResult.count} assignments`);
  console.log('✅ All doctor slots are now available (0/10 filled for all doctors)');
  
  await prisma.$disconnect();
}

resetAssignments()
  .catch((e) => {
    console.error('Error resetting assignments:', e);
    process.exit(1);
  });
