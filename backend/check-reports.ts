import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.report.findMany({
    include: {
      patient: { select: { email: true } },
      doctor: { select: { email: true } }
    }
  });
  console.log(JSON.stringify(reports, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
