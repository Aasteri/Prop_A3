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
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const DEV_PASSWORD = 'Propa3Dev!';

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

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

  const ceo = await prisma.user.upsert({
    where: { email: 'ceo@triplea.ng' },
    update: {},
    create: {
      email: 'ceo@triplea.ng',
      passwordHash,
      firstName: 'Abraham',
      lastName: 'Akinola',
      role: UserRole.CEO,
      phone: '+2348000000001',
    },
  });

  const pmJkw = await prisma.user.upsert({
    where: { email: 'pm.jkw@triplea.ng' },
    update: {},
    create: {
      email: 'pm.jkw@triplea.ng',
      passwordHash,
      firstName: 'Project',
      lastName: 'Manager',
      role: UserRole.PROJECT_MANAGER,
      primarySiteId: siteRecords.JKW.id,
      phone: '+2348000000002',
    },
  });

  const foremanGz2 = await prisma.user.upsert({
    where: { email: 'foreman.gz2@triplea.ng' },
    update: {},
    create: {
      email: 'foreman.gz2@triplea.ng',
      passwordHash,
      firstName: 'Site',
      lastName: 'Foreman',
      role: UserRole.FOREMAN,
      primarySiteId: siteRecords.GZ2.id,
      phone: '+2348000000003',
    },
  });

  const foremanJkw = await prisma.user.upsert({
    where: { email: 'foreman.jkw@triplea.ng' },
    update: {},
    create: {
      email: 'foreman.jkw@triplea.ng',
      passwordHash,
      firstName: 'Jikwoyi',
      lastName: 'Foreman',
      role: UserRole.FOREMAN,
      primarySiteId: siteRecords.JKW.id,
      phone: '+2348000000004',
    },
  });

  const storeJkw = await prisma.user.upsert({
    where: { email: 'store.jkw@triplea.ng' },
    update: {},
    create: {
      email: 'store.jkw@triplea.ng',
      passwordHash,
      firstName: 'Store',
      lastName: 'Manager',
      role: UserRole.STORE_MANAGER,
      primarySiteId: siteRecords.JKW.id,
      phone: '+2348000000005',
    },
  });

  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@triplea.ng' },
    update: {},
    create: {
      email: 'engineer@triplea.ng',
      passwordHash,
      firstName: 'Site',
      lastName: 'Engineer',
      role: UserRole.ENGINEER,
      phone: '+2348000000007',
    },
  });

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
    where: { id: 'seed-laucarie' },
    update: {},
    create: {
      id: 'seed-laucarie',
      name: 'A. LAUCARIE CONSULTING',
      bankName: 'Polaris Bank Plc.',
      accountName: 'A. A LAUCARIE CONSULTING',
      accountNumber: '4091991156',
      isDefault: true,
    },
  });

  await prisma.settlementEntity.upsert({
    where: { id: 'seed-triplea' },
    update: {},
    create: {
      id: 'seed-triplea',
      name: 'TRIPLE A REALTY PROJECTS LTD.',
      bankName: 'TBC — confirm with Abraham',
      accountName: 'TRIPLE A REALTY PROJECTS LTD.',
      accountNumber: '0000000000',
      isDefault: false,
    },
  });

  await prisma.user.upsert({
    where: { email: 'finance@triplea.ng' },
    update: {},
    create: {
      email: 'finance@triplea.ng',
      passwordHash,
      firstName: 'Finance',
      lastName: 'Officer',
      role: UserRole.FINANCE,
      phone: '+2348000000006',
    },
  });

  await prisma.user.upsert({
    where: { email: 'sales@triplea.ng' },
    update: {},
    create: {
      email: 'sales@triplea.ng',
      passwordHash,
      firstName: 'Sales',
      lastName: 'Officer',
      role: UserRole.SALES,
      phone: '+2348000000008',
    },
  });

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

  const salesUser = await prisma.user.findUnique({ where: { email: 'sales@triplea.ng' } });
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

  const clientUser = await prisma.user.upsert({
    where: { email: 'client@triplea.ng' },
    update: {},
    create: {
      email: 'client@triplea.ng',
      passwordHash,
      firstName: 'James',
      lastName: 'Okoro',
      role: UserRole.CLIENT,
      phone: '+2348099999999',
    },
  });

  const clientRecord = await prisma.client.upsert({
    where: { clientRef: 'CLT-0001' },
    update: { portalUserId: clientUser.id },
    create: {
      clientRef: 'CLT-0001',
      firstName: 'James',
      lastName: 'Okoro',
      phone: '+2348099999999',
      email: 'client@triplea.ng',
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

  const financeUser = await prisma.user.findUnique({ where: { email: 'finance@triplea.ng' } });
  if (financeUser) {
    await prisma.invoice.upsert({
      where: { invoiceNumber: 'AAA/2026/SOL-001' },
      update: { clientId: clientRecord.id },
      create: {
        id: 'seed-client-invoice',
        projectId: 'seed-gz2-duplex',
        clientId: clientRecord.id,
        settlementEntityId: 'seed-laucarie',
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

  console.log('Seeded sites, users, projects, listings, client portal, Dawaki Terrier');
  console.log('Dev login accounts (password: Propa3Dev!):');
  console.log('  ceo@triplea.ng');
  console.log('  pm.jkw@triplea.ng');
  console.log('  finance@triplea.ng');
  console.log('  sales@triplea.ng');
  console.log('  client@triplea.ng  (client portal)');
  console.log('  foreman.jkw@triplea.ng');
  console.log('  foreman.gz2@triplea.ng');
  console.log('  store.jkw@triplea.ng');
  console.log('  engineer@triplea.ng');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
