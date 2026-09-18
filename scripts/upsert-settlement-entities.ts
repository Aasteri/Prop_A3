/**
 * Idempotent upsert of CONFIRMED Triple A settlement bank details.
 * Prefers CompanySettings bank fields when the singleton exists.
 * Called from deploy after prisma seed (seed already upserts; this is a
 * belt-and-braces helper if seed is skipped or partially fails).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.companySettings.findUnique({ where: { id: 'default' } });

  const name = settings?.companyLegalName ?? 'TRIPLE A REALTY PROJECTS LTD';
  const bankName = settings?.bankName ?? 'Tajbank';
  const accountName = settings?.bankAccountName ?? 'TRIPLE A REALTY PROJECTS LTD';
  const accountNumber = settings?.bankAccountNumber ?? '0013925425';

  await prisma.settlementEntity.upsert({
    where: { id: 'seed-triplea' },
    update: {
      name,
      bankName,
      accountName,
      accountNumber,
      isDefault: true,
    },
    create: {
      id: 'seed-triplea',
      name,
      bankName,
      accountName,
      accountNumber,
      isDefault: true,
    },
  });

  await prisma.settlementEntity.upsert({
    where: { id: 'seed-laucarie' },
    update: { isDefault: false },
    create: {
      id: 'seed-laucarie',
      name: 'A. LAUCARIE CONSULTING',
      bankName: 'Polaris Bank Plc. (legacy sample)',
      accountName: 'A. A LAUCARIE CONSULTING',
      accountNumber: '4091991156',
      isDefault: false,
    },
  });

  await prisma.settlementEntity.updateMany({
    where: { id: { not: 'seed-triplea' } },
    data: { isDefault: false },
  });

  console.log(`Settlement entities upserted (${bankName} ${accountNumber}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
