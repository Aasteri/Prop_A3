import {
  PrismaClient,
  UserRole,
  ProjectStatus,
  MilestoneStage,
  RentPaidFixed,
  ListingFinish,
  ListingStatus,
  ListingType,
  LeadSource,
  LeadStage,
  InvoiceType,
  InvoiceStatus,
  User,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { DEMO_USERS, DemoUserDef } from './demo-users';

const prisma = new PrismaClient();

async function upsertDemoUser(
  def: DemoUserDef,
  siteRecords: Record<string, { id: string }>,
): Promise<User> {
  const passwordHash = await bcrypt.hash(def.password, 10);
  const primarySiteId = def.primarySiteCode
    ? siteRecords[def.primarySiteCode]?.id
    : undefined;

  const base = {
    passwordHash,
    firstName: def.firstName,
    lastName: def.lastName,
    role: def.role,
    phone: def.phone,
    ...(primarySiteId ? { primarySiteId } : {}),
  };

  if (def.legacyEmail && def.legacyEmail !== def.email) {
    const legacy = await prisma.user.findUnique({ where: { email: def.legacyEmail } });
    if (legacy) {
      return prisma.user.update({
        where: { id: legacy.id },
        data: { email: def.email, ...base },
      });
    }
  }

  return prisma.user.upsert({
    where: { email: def.email },
    update: base,
    create: { email: def.email, ...base },
  });
}

async function main() {
  const sites = [
    { code: 'JKW', name: 'Jikwoyi Plaza', location: 'Jikwoyi, Abuja' },
    { code: 'MPP', name: 'Mall Mpape', location: 'Mpape, Abuja' },
    { code: 'GZ2', name: 'Guzape II — Vida Shelter Estate', location: 'Guzape, Abuja' },
    { code: 'GZ3', name: 'Guzape III — Boing Estate', location: 'Guzape, Abuja' },
  ];

  const siteRecords: Record<string, { id: string }> = {};
  for (const site of sites) {
    const record = await prisma.site.upsert({
      where: { code: site.code },
      update: site,
      create: site,
    });
    siteRecords[site.code] = record;
  }

  const userByEmail: Record<string, User> = {};
  for (const def of DEMO_USERS) {
    userByEmail[def.email] = await upsertDemoUser(def, siteRecords);
  }

  const pmJkw = userByEmail['pm.jkw@propa3.com'];
  const foremanGz2 = userByEmail['foreman.gz2@propa3.com'];
  const foremanJkw = userByEmail['foreman.jkw@propa3.com'];
  const storeJkw = userByEmail['store.jkw@propa3.com'];

  for (const [userId, siteId] of [
    [pmJkw.id, siteRecords.JKW.id],
    [foremanGz2.id, siteRecords.GZ2.id],
    [foremanJkw.id, siteRecords.JKW.id],
    [storeJkw.id, siteRecords.JKW.id],
  ] as const) {
    await prisma.userSiteAssignment.upsert({
      where: { userId_siteId: { userId, siteId } },
      update: {},
      create: { userId, siteId },
    });
  }

  const jkwProject = await prisma.project.upsert({
    where: { id: 'seed-jkw-mixuse' },
    update: {},
    create: {
      id: 'seed-jkw-mixuse',
      siteId: siteRecords.JKW.id,
      projectManagerId: pmJkw.id,
      name: 'Construction of Mix-Use Development',
      projectNumber: '110',
      location: 'Jikwoyi, Abuja',
      contractRef: 'CC/2025/JKW-001',
      status: ProjectStatus.ACTIVE,
    },
  });

  const gz2Project = await prisma.project.upsert({
    where: { id: 'seed-gz2-duplex' },
    update: {},
    create: {
      id: 'seed-gz2-duplex',
      siteId: siteRecords.GZ2.id,
      projectManagerId: pmJkw.id,
      name: 'Construction of 6 Bedroom Luxurious Duplex',
      projectNumber: '530',
      location: 'Guzape',
      contractRef: 'CC/2025/GZ2-001',
      status: ProjectStatus.ACTIVE,
    },
  });

  for (const project of [jkwProject, gz2Project]) {
    for (const stage of [
      MilestoneStage.FOUNDATION,
      MilestoneStage.SHELL,
      MilestoneStage.FINISHING,
      MilestoneStage.HANDOVER,
    ]) {
      await prisma.milestone.upsert({
        where: {
          projectId_stage: { projectId: project.id, stage },
        },
        update: {},
        create: {
          projectId: project.id,
          stage,
          progressPct: stage === MilestoneStage.FOUNDATION ? 15 : 0,
        },
      });
    }
  }

  await prisma.settlementEntity.upsert({
    where: { id: 'seed-triplea' },
    update: {
      name: 'TRIPLE A REALTY PROJECTS LTD.',
      bankName: 'Guaranty Trust Bank Plc.',
      accountName: 'TRIPLE A REALTY PROJECTS LTD.',
      accountNumber: '0123456789',
      isDefault: true,
    },
    create: {
      id: 'seed-triplea',
      name: 'TRIPLE A REALTY PROJECTS LTD.',
      bankName: 'Guaranty Trust Bank Plc.',
      accountName: 'TRIPLE A REALTY PROJECTS LTD.',
      accountNumber: '0123456789',
      isDefault: true,
    },
  });

  await prisma.settlementEntity.upsert({
    where: { id: 'seed-laucarie' },
    update: {
      isDefault: false,
      bankName: 'Polaris Bank Plc. (legacy sample)',
    },
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

  const engineerUser = userByEmail['engineer@propa3.com'];
  if (engineerUser) {
    await prisma.professionalLicence.upsert({
      where: {
        userId_licenceType: { userId: engineerUser.id, licenceType: 'COREN' },
      },
      update: {
        licenceNumber: 'COREN R.53757',
        holderName: 'Engr. Jonah Kanadi',
        expiresAt: new Date('2026-08-22'),
        isActive: true,
      },
      create: {
        userId: engineerUser.id,
        licenceType: 'COREN',
        licenceNumber: 'COREN R.53757',
        holderName: 'Engr. Jonah Kanadi',
        expiresAt: new Date('2026-08-22'),
      },
    });
  }

  const dawakiEstate = await prisma.rentalEstate.upsert({
    where: { id: 'seed-dwk-flats' },
    update: {},
    create: {
      id: 'seed-dwk-flats',
      code: 'DWK',
      name: 'Dawaki Block of Flats',
      title: 'ESTATE TERRIER FOR DAWAKI BLOCK OF FLAT',
      location: 'Dawaki, Abuja',
    },
  });

  const dawakiUnits = [
    { propertyType: '2 Bedroom Flat', location: 'Block A — Ground Floor' },
    { propertyType: '2 Bedroom Flat', location: 'Block A — First Floor' },
    { propertyType: '3 Bedroom Flat', location: 'Block B — Ground Floor' },
    { propertyType: '3 Bedroom Flat', location: 'Block B — First Floor' },
    { propertyType: '2 Bedroom Flat', location: 'Block C — Ground Floor' },
    { propertyType: '2 Bedroom Flat', location: 'Block C — First Floor' },
  ];

  const terrierRows: { id: string; serialNo: number }[] = [];
  for (let i = 0; i < dawakiUnits.length; i++) {
    const unit = dawakiUnits[i];
    const row = await prisma.estateTerrierRow.upsert({
      where: { estateId_serialNo: { estateId: dawakiEstate.id, serialNo: i + 1 } },
      update: {},
      create: {
        id: `seed-dwk-row-${i + 1}`,
        estateId: dawakiEstate.id,
        serialNo: i + 1,
        propertyType: unit.propertyType,
        location: unit.location,
      },
    });
    terrierRows.push({ id: row.id, serialNo: row.serialNo });
  }

  await prisma.estateTerrierRow.update({
    where: { id: terrierRows[0].id },
    data: {
      tenantName: 'Existing Tenant (Sample)',
      tenantPhone: '+2348012345678',
      rentPaidFixed: RentPaidFixed.PAID,
      rentAmountNgn: 1200000,
      paymentMode: 'Bank transfer',
      datePaid: new Date('2026-07-01'),
      tenancyStart: new Date('2025-01-01'),
      tenancyEnd: new Date('2026-12-31'),
      cautionDeposit: 240000,
      serviceCharge: 120000,
      expenseAmount: 50000,
      netRentalIncome: 1150000,
    },
  });

  type SeedListingRow = {
    id: string;
    location: string;
    property_type: string;
    finish: string;
    payment_plan: string;
    status: string;
    listing_type: string;
    price_ngn?: number;
    price_outright_ngn?: number;
    price_6m_ngn?: number;
    price_12m_ngn?: number;
    price_18m_ngn?: number;
    source?: string;
  };

  const seedPath = path.join(__dirname, '..', 'planning', 'data', 'LISTINGS_SEED.json');
  const seedListings = JSON.parse(fs.readFileSync(seedPath, 'utf-8')) as {
    listings: SeedListingRow[];
  };

  let sampleListingId: string | null = null;
  for (const row of seedListings.listings) {
    const finish =
      row.finish === 'SF'
        ? ListingFinish.SF
        : row.finish === 'DPC'
          ? ListingFinish.DPC
          : ListingFinish.FF;
    const status =
      row.status === 'reserved'
        ? ListingStatus.RESERVED
        : row.status === 'sold'
          ? ListingStatus.SOLD
          : ListingStatus.AVAILABLE;

    const listing = await prisma.listing.upsert({
      where: { listingRef: row.id },
      update: {},
      create: {
        listingRef: row.id,
        location: row.location,
        propertyType: row.property_type,
        finish,
        paymentPlan: row.payment_plan,
        listingType: row.listing_type === 'rent' ? ListingType.RENT : ListingType.SALE,
        status,
        priceNgn: row.price_ngn,
        priceOutrightNgn: row.price_outright_ngn,
        price6mNgn: row.price_6m_ngn,
        price12mNgn: row.price_12m_ngn,
        price18mNgn: row.price_18m_ngn,
        sourceDocument: row.source,
      },
    });
    if (row.id === 'TAA-SALE-020') sampleListingId = listing.id;
  }

  const salesUser = userByEmail['sales@propa3.com'];
  if (salesUser && sampleListingId) {
    await prisma.lead.upsert({
      where: { leadRef: 'LED-0001' },
      update: {},
      create: {
        leadRef: 'LED-0001',
        firstName: 'Chidi',
        lastName: 'Okonkwo',
        phone: '+2348098765432',
        email: 'chidi.example@email.com',
        source: LeadSource.WEB,
        stage: LeadStage.INQUIRY,
        listingId: sampleListingId,
        assignedToId: salesUser.id,
        preferences: 'Interested in Prime Villa Lifecamp 4BR — payment plan options',
        createdById: salesUser.id,
      },
    });
  }

  const clientUser = userByEmail['client@propa3.com'];
  const clientDef = DEMO_USERS.find((u) => u.role === UserRole.CLIENT)!;

  const clientRecord = await prisma.client.upsert({
    where: { clientRef: 'CLT-0001' },
    update: {
      portalUserId: clientUser.id,
      email: clientDef.email,
    },
    create: {
      clientRef: 'CLT-0001',
      firstName: clientUser.firstName,
      lastName: clientUser.lastName,
      phone: clientUser.phone ?? clientDef.phone,
      email: clientDef.email,
      portalUserId: clientUser.id,
    },
  });

  await prisma.clientProject.upsert({
    where: {
      clientId_projectId: { clientId: clientRecord.id, projectId: 'seed-gz2-duplex' },
    },
    update: {},
    create: {
      clientId: clientRecord.id,
      projectId: 'seed-gz2-duplex',
      plotRef: 'GZ2-PLOT-01',
    },
  });

  const financeUser = userByEmail['finance@propa3.com'];
  if (financeUser) {
    await prisma.invoice.upsert({
      where: { invoiceNumber: 'AAA/2026/SOL-001' },
      update: { clientId: clientRecord.id, settlementEntityId: 'seed-triplea' },
      create: {
        id: 'seed-client-invoice',
        projectId: 'seed-gz2-duplex',
        clientId: clientRecord.id,
        settlementEntityId: 'seed-triplea',
        invoiceNumber: 'AAA/2026/SOL-001',
        invoiceType: InvoiceType.SALES,
        status: InvoiceStatus.SENT,
        issueDate: new Date('2026-07-01'),
        clientName: 'James Okoro',
        clientAddress: 'Abuja, Nigeria',
        projectDetails: 'Construction of 6 Bedroom Luxurious Duplex — Guzape',
        paymentTerms: 'Milestone payment schedule per contract',
        baseTotal: 450000000,
        variationTotal: 0,
        revisedTotal: 450000000,
        paidTotal: 135000000,
        outstanding: 315000000,
        createdById: financeUser.id,
        sentAt: new Date('2026-07-01'),
        lines: {
          create: [
            {
              description: 'Milestone 1 — Foundation (15%)',
              quantity: 1,
              unit: 'Lot',
              unitPrice: 67500000,
              totalAmount: 67500000,
              sortOrder: 0,
            },
            {
              description: 'Milestone 2 — Shell (15%)',
              quantity: 1,
              unit: 'Lot',
              unitPrice: 67500000,
              totalAmount: 67500000,
              sortOrder: 1,
            },
          ],
        },
      },
    });
  }

  console.log('Seeded sites, users (@propa3.com), projects, listings, client portal, Dawaki Terrier');
  console.log('Login accounts — see demo-users-list.md (unique passwords per user)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
