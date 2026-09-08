import { PrismaClient } from '@prisma/client';
import { purgeDemoData } from '../apps/api/src/admin/purge-demo-data';

const prisma = new PrismaClient();

purgeDemoData(prisma)
  .then((result) => {
    console.log('Demo data purged:', JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
