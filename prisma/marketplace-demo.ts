/**
 * Idempotent marketplace demo jobs tied to seeded demo users.
 * publicIds DEMO-MKT-* are deleted and recreated on each seed so statuses stay predictable for UAT.
 */
import {
  ArtisanApprovalStatus,
  ArtisanSource,
  ChatModerationStatus,
  MarketplaceJobStatus,
  MarketplacePaymentMethod,
  MarketplacePaymentStatus,
  MarketplaceQuoteStatus,
  PrismaClient,
  User,
} from '@prisma/client';

const FEE_PCT = 2.5;

function feeOn(workmanship: number) {
  return Math.round(workmanship * (FEE_PCT / 100) * 100) / 100;
}

export async function seedMarketplaceDemo(
  prisma: PrismaClient,
  userByEmail: Record<string, User>,
) {
  const seeker = userByEmail['seeker@propa3.com'];
  const client = userByEmail['client@propa3.com'];
  const artisanPlumber = userByEmail['artisan@propa3.com'];
  const elecUser = userByEmail['artisan.elec@propa3.com'];
  const admin = userByEmail['admin@propa3.com'] ?? userByEmail['ceo@propa3.com'];

  if (!seeker || !client || !artisanPlumber || !elecUser) {
    console.warn('Marketplace demo skipped — core demo users missing');
    return;
  }

  const plumberProfile = await prisma.artisanProfile.upsert({
    where: { userId: artisanPlumber.id },
    update: {
      fullName: 'Chidi Plumber',
      businessName: 'Chidi Plumbing Services',
      phone: artisanPlumber.phone ?? '+2348097777777',
      email: artisanPlumber.email,
      trades: ['Plumbing', 'Water heaters'],
      serviceAreas: 'Guzape, Apo, Jabi',
      source: ArtisanSource.EXTERNAL,
      status: ArtisanApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: admin?.id,
      avgRating: 4.6,
      jobsCompleted: 12,
    },
    create: {
      userId: artisanPlumber.id,
      fullName: 'Chidi Plumber',
      businessName: 'Chidi Plumbing Services',
      phone: artisanPlumber.phone ?? '+2348097777777',
      email: artisanPlumber.email,
      trades: ['Plumbing', 'Water heaters'],
      serviceAreas: 'Guzape, Apo, Jabi',
      source: ArtisanSource.EXTERNAL,
      status: ArtisanApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: admin?.id,
      avgRating: 4.6,
      jobsCompleted: 12,
    },
  });

  const elecProfile = await prisma.artisanProfile.upsert({
    where: { userId: elecUser.id },
    update: {
      fullName: 'Bola Electrician',
      businessName: 'Bola Power Solutions',
      phone: elecUser.phone ?? '+2348096666666',
      email: elecUser.email,
      trades: ['Electrical', 'Lighting', 'Solar'],
      serviceAreas: 'Guzape, Jikwoyi, Lifecamp',
      source: ArtisanSource.EXTERNAL,
      status: ArtisanApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: admin?.id,
      avgRating: 4.4,
      jobsCompleted: 8,
    },
    create: {
      userId: elecUser.id,
      fullName: 'Bola Electrician',
      businessName: 'Bola Power Solutions',
      phone: elecUser.phone ?? '+2348096666666',
      email: elecUser.email,
      trades: ['Electrical', 'Lighting', 'Solar'],
      serviceAreas: 'Guzape, Jikwoyi, Lifecamp',
      source: ArtisanSource.EXTERNAL,
      status: ArtisanApprovalStatus.APPROVED,
      approvedAt: new Date(),
      approvedById: admin?.id,
      avgRating: 4.4,
      jobsCompleted: 8,
    },
  });

  // Pending application (no login) — admin can approve on /marketplace-admin
  const pendingPhone = '+2348095555011';
  const pendingExisting = await prisma.artisanProfile.findFirst({ where: { phone: pendingPhone } });
  if (pendingExisting) {
    await prisma.artisanProfile.update({
      where: { id: pendingExisting.id },
      data: {
        fullName: 'Tunde Painter (pending)',
        businessName: 'Tunde Finishes',
        email: 'tunde.painter.pending@example.com',
        trades: ['Painting', 'POP'],
        serviceAreas: 'Abuja FCT',
        source: ArtisanSource.EXTERNAL,
        status: ArtisanApprovalStatus.PENDING_REVIEW,
        userId: null,
        bio: 'Demo pending application — approve from marketplace admin.',
      },
    });
  } else {
    await prisma.artisanProfile.create({
      data: {
        fullName: 'Tunde Painter (pending)',
        businessName: 'Tunde Finishes',
        phone: pendingPhone,
        email: 'tunde.painter.pending@example.com',
        trades: ['Painting', 'POP'],
        serviceAreas: 'Abuja FCT',
        source: ArtisanSource.EXTERNAL,
        status: ArtisanApprovalStatus.PENDING_REVIEW,
        bio: 'Demo pending application — approve from marketplace admin.',
      },
    });
  }

  const catalog = async (code: string) => {
    const item = await prisma.marketplaceCatalogItem.findUnique({ where: { code } });
    if (!item) throw new Error(`Catalog missing ${code} — seed catalog first`);
    return item;
  };

  const leak = await catalog('PLUMB_LEAK');
  const heater = await catalog('PLUMB_INSTALL');
  const elecFault = await catalog('ELEC_FAULT');
  const acService = await catalog('AC_SERVICE');
  const paint = await catalog('PAINT_INT');

  // Clear previous demo jobs (break selectedQuote FK first)
  const old = await prisma.marketplaceJob.findMany({
    where: { publicId: { startsWith: 'DEMO-MKT-' } },
    select: { id: true },
  });
  for (const j of old) {
    await prisma.marketplaceJob.update({
      where: { id: j.id },
      data: { selectedQuoteId: null },
    });
  }
  if (old.length) {
    await prisma.marketplaceJob.deleteMany({
      where: { publicId: { startsWith: 'DEMO-MKT-' } },
    });
  }

  // --- DEMO-MKT-01: SUBMITTED (seeker) — admin assigns ---
  await prisma.marketplaceJob.create({
    data: {
      publicId: 'DEMO-MKT-01',
      catalogItemId: leak.id,
      seekerUserId: seeker.id,
      title: 'Kitchen sink leak — Guzape',
      description:
        'Demo job (Ada Seeker). Slow leak under kitchen sink. Needs plumber. Status: SUBMITTED — assign artisans from /marketplace-admin.',
      locationText: 'Guzape / Vida Shelter area',
      addressText: 'Plot 12, Vida Shelter Estate, Guzape',
      status: MarketplaceJobStatus.SUBMITTED,
    },
  });

  // --- DEMO-MKT-02: ASSIGNED (seeker → Chidi) — artisan quotes ---
  const job02 = await prisma.marketplaceJob.create({
    data: {
      publicId: 'DEMO-MKT-02',
      catalogItemId: heater.id,
      seekerUserId: seeker.id,
      title: 'Install water heater — Jabi',
      description:
        'Demo job (Ada Seeker). Replace electric water heater. Status: ASSIGNED — login as artisan@ and submit a quote.',
      locationText: 'Jabi',
      addressText: '15 Usuma Street, Jabi',
      status: MarketplaceJobStatus.ASSIGNED,
      assignments: {
        create: {
          artisanId: plumberProfile.id,
          assignedById: admin?.id,
          note: 'Demo assignment to Chidi Plumbing',
        },
      },
    },
  });

  // --- DEMO-MKT-03: QUOTED (seeker, both artisans) — seeker selects ---
  const job03 = await prisma.marketplaceJob.create({
    data: {
      publicId: 'DEMO-MKT-03',
      catalogItemId: elecFault.id,
      seekerUserId: seeker.id,
      title: 'DB tripping — compare quotes',
      description:
        'Demo job (Ada Seeker). Main DB trips when AC starts. Status: QUOTED — open /marketplace/requests, select a quote to open chat.',
      locationText: 'Lifecamp',
      addressText: 'Block C2 Flat 4, Lifecamp',
      status: MarketplaceJobStatus.QUOTED,
      assignments: {
        create: [
          { artisanId: plumberProfile.id, assignedById: admin?.id, note: 'Also offered (multi-trade demo)' },
          { artisanId: elecProfile.id, assignedById: admin?.id, note: 'Primary electrician' },
        ],
      },
    },
  });
  await prisma.marketplaceQuote.createMany({
    data: [
      {
        jobId: job03.id,
        artisanId: elecProfile.id,
        artisanUserId: elecUser.id,
        workmanshipAmount: 45000,
        materialsEstimate: 12000,
        materialsNote: 'Materials paid directly to artisan — not via Propa3.',
        message: 'Bola: diagnose DB + changeover check. No phones in chat.',
        status: MarketplaceQuoteStatus.SUBMITTED,
      },
      {
        jobId: job03.id,
        artisanId: plumberProfile.id,
        artisanUserId: artisanPlumber.id,
        workmanshipAmount: 38000,
        materialsEstimate: 5000,
        materialsNote: 'Materials paid directly to artisan — not via Propa3.',
        message: 'Chidi: can assist if fault is water heater linked.',
        status: MarketplaceQuoteStatus.SUBMITTED,
      },
    ],
  });

  // --- DEMO-MKT-04: AWAITING_PAYMENT (client@ dual-use) — pay + chat locked address ---
  const work04 = 55000;
  const fee04 = feeOn(work04);
  const job04 = await prisma.marketplaceJob.create({
    data: {
      publicId: 'DEMO-MKT-04',
      catalogItemId: acService.id,
      seekerUserId: client.id,
      title: 'AC service — Guzape II duplex (client portal user)',
      description:
        'Demo job (James Okoro / client@). Same login as property portal. Status: AWAITING_PAYMENT — chat open, full address locked until escrow.',
      locationText: 'Guzape II — Vida Shelter',
      addressText: 'Guzape II duplex (CLT-0001 linked property)',
      status: MarketplaceJobStatus.AWAITING_PAYMENT,
      workmanshipAmount: work04,
      platformFeePctSnapshot: FEE_PCT,
      platformFeeAmount: fee04,
      materialsNote: 'Gas / filters paid directly to artisan.',
      assignments: {
        create: {
          artisanId: plumberProfile.id,
          assignedById: admin?.id,
          note: 'Demo — Chidi also covers AC gas top-up for UAT',
        },
      },
    },
  });
  const quote04 = await prisma.marketplaceQuote.create({
    data: {
      jobId: job04.id,
      artisanId: plumberProfile.id,
      artisanUserId: artisanPlumber.id,
      workmanshipAmount: work04,
      materialsEstimate: 18000,
      materialsNote: 'Materials paid directly to artisan — not via Propa3.',
      depositAmount: 20000,
      message: 'Ready this week after escrow.',
      status: MarketplaceQuoteStatus.ACCEPTED,
    },
  });
  await prisma.marketplaceJob.update({
    where: { id: job04.id },
    data: { selectedQuoteId: quote04.id },
  });
  const thread04 = await prisma.chatThread.create({
    data: { jobId: job04.id, addressUnlocked: false },
  });
  await prisma.chatMessage.createMany({
    data: [
      {
        threadId: thread04.id,
        senderId: client.id,
        body: 'Hi — unit is near the estate gate. When can you come after payment?',
        moderation: ChatModerationStatus.OK,
      },
      {
        threadId: thread04.id,
        senderId: artisanPlumber.id,
        body: 'I can come tomorrow afternoon once workmanship is in escrow. Area landmarks are fine until then.',
        moderation: ChatModerationStatus.OK,
      },
    ],
  });

  // --- DEMO-MKT-05: IN_PROGRESS (seeker) — escrow held, address unlocked ---
  const work05 = 72000;
  const fee05 = feeOn(work05);
  const job05 = await prisma.marketplaceJob.create({
    data: {
      publicId: 'DEMO-MKT-05',
      catalogItemId: leak.id,
      seekerUserId: seeker.id,
      title: 'Bathroom pipe burst — in progress',
      description:
        'Demo job (Ada Seeker). Escrow held. Status: IN_PROGRESS — chat allows full address; seeker can Confirm complete.',
      locationText: 'Apo',
      addressText: '7 Durumi Extension, Apo Legislative Quarters',
      status: MarketplaceJobStatus.IN_PROGRESS,
      workmanshipAmount: work05,
      platformFeePctSnapshot: FEE_PCT,
      platformFeeAmount: fee05,
      escrowPaidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      materialsNote: 'Pipes/fittings paid direct.',
      assignments: {
        create: {
          artisanId: plumberProfile.id,
          assignedById: admin?.id,
        },
      },
    },
  });
  const quote05 = await prisma.marketplaceQuote.create({
    data: {
      jobId: job05.id,
      artisanId: plumberProfile.id,
      artisanUserId: artisanPlumber.id,
      workmanshipAmount: work05,
      materialsEstimate: 25000,
      message: 'Emergency call-out included.',
      status: MarketplaceQuoteStatus.ACCEPTED,
    },
  });
  await prisma.marketplaceJob.update({
    where: { id: job05.id },
    data: { selectedQuoteId: quote05.id },
  });
  const thread05 = await prisma.chatThread.create({
    data: { jobId: job05.id, addressUnlocked: true },
  });
  await prisma.chatMessage.createMany({
    data: [
      {
        threadId: thread05.id,
        senderId: seeker.id,
        body: 'Full address is 7 Durumi Extension, Apo. Gate code 4421.',
        moderation: ChatModerationStatus.OK,
      },
      {
        threadId: thread05.id,
        senderId: artisanPlumber.id,
        body: 'On site now — replacing the burst section. Will mark done when pressure-tested.',
        moderation: ChatModerationStatus.OK,
      },
    ],
  });
  await prisma.marketplaceEscrowPayment.create({
    data: {
      jobId: job05.id,
      payerUserId: seeker.id,
      method: MarketplacePaymentMethod.BANK_TRANSFER_PROOF,
      status: MarketplacePaymentStatus.HELD,
      amount: work05,
      isDeposit: false,
      platformFeePct: FEE_PCT,
      platformFeeAmount: fee05,
      proofUrl: 'demo://bank-proof/DEMO-MKT-05',
      verifiedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      verifiedById: userByEmail['finance@propa3.com']?.id ?? admin?.id,
    },
  });

  // --- DEMO-MKT-06: COMPLETED (client) — history ---
  const work06 = 40000;
  const fee06 = feeOn(work06);
  const job06 = await prisma.marketplaceJob.create({
    data: {
      publicId: 'DEMO-MKT-06',
      catalogItemId: paint.id,
      seekerUserId: client.id,
      title: 'Touch-up paint — completed demo',
      description:
        'Demo completed job for client@. Use My requests history and artisan completed count.',
      locationText: 'Guzape II',
      addressText: 'Guzape II duplex living room',
      status: MarketplaceJobStatus.COMPLETED,
      workmanshipAmount: work06,
      platformFeePctSnapshot: FEE_PCT,
      platformFeeAmount: fee06,
      escrowPaidAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      assignments: {
        create: { artisanId: plumberProfile.id, assignedById: admin?.id },
      },
    },
  });
  const quote06 = await prisma.marketplaceQuote.create({
    data: {
      jobId: job06.id,
      artisanId: plumberProfile.id,
      artisanUserId: artisanPlumber.id,
      workmanshipAmount: work06,
      status: MarketplaceQuoteStatus.ACCEPTED,
    },
  });
  await prisma.marketplaceJob.update({
    where: { id: job06.id },
    data: { selectedQuoteId: quote06.id },
  });
  await prisma.chatThread.create({
    data: { jobId: job06.id, addressUnlocked: true },
  });
  await prisma.marketplaceEscrowPayment.create({
    data: {
      jobId: job06.id,
      payerUserId: client.id,
      method: MarketplacePaymentMethod.BANK_TRANSFER_PROOF,
      status: MarketplacePaymentStatus.RELEASED,
      amount: work06,
      platformFeePct: FEE_PCT,
      platformFeeAmount: fee06,
      proofUrl: 'demo://bank-proof/DEMO-MKT-06',
      verifiedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      verifiedById: userByEmail['finance@propa3.com']?.id ?? admin?.id,
      releasedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  // Silence unused if tree-shaken — job02 kept for artisan quote practice
  void job02;

  console.log(
    'Marketplace demo: DEMO-MKT-01…06 + artisans Chidi/Bola + pending Tunde (see docs/TEST_USERS.md)',
  );
}
