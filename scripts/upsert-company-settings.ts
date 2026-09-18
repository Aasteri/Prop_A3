/**
 * Idempotent upsert of CompanySettings (id=default) and sync seed-triplea settlement bank.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      lettingFeePct: 10,
      agencyFeePct: 10,
      legalFeePct: 5,
      managementFeePct: 5,
      applicationAgencyLegalPct: 20,
      worksPlatformFeePct: 10,
      worksRetentionPct: 5,
      servicesPlatformFeePct: 2.5,
      cautionDepositPct: 10,
      externalAgentCommissionOfAgencyPct: 50,
      companyLegalName: 'TRIPLE A REALTY PROJECTS LTD',
      bankName: 'Tajbank',
      bankAccountName: 'TRIPLE A REALTY PROJECTS LTD',
      bankAccountNumber: '0013925425',
      defaultCurrency: 'NGN',
    },
  });

  await prisma.settlementEntity.upsert({
    where: { id: 'seed-triplea' },
    update: {
      name: settings.companyLegalName,
      bankName: settings.bankName,
      accountName: settings.bankAccountName,
      accountNumber: settings.bankAccountNumber,
      isDefault: true,
    },
    create: {
      id: 'seed-triplea',
      name: settings.companyLegalName,
      bankName: settings.bankName,
      accountName: settings.bankAccountName,
      accountNumber: settings.bankAccountNumber,
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

  console.log(
    `Company settings + Triple A settlement synced (${settings.bankName} ${settings.bankAccountNumber}).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
