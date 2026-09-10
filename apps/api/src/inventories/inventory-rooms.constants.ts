/** Doc 9 — House/Property Inventory Condition room matrix defaults. */

export type InventoryLineItem = {
  id: string;
  label: string;
  moveInDefects: string;
  moveOutDefects: string;
  comments: string;
  cost: number;
};

export type InventorySection = {
  id: string;
  name: string;
  items: InventoryLineItem[];
};

export type InventoryRoomsMatrix = {
  abbreviations: { code: string; meaning: string }[];
  sections: InventorySection[];
};

function items(...labels: string[]): InventoryLineItem[] {
  return labels.map((label) => ({
    id: label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, ''),
    label,
    moveInDefects: '',
    moveOutDefects: '',
    comments: '',
    cost: 0,
  }));
}

const COMMON_ROOM = [
  'Ceiling',
  'Walls',
  'Floor',
  'Floor Covering',
  'Doors',
  'Windows',
  'Light Fittings',
  'Light Bulbs',
  'Switches/Sockets',
];

export const INVENTORY_ABBREVIATIONS = [
  { code: 'GF', meaning: 'Ground Floor' },
  { code: 'FF', meaning: 'First Floor' },
  { code: 'SF', meaning: 'Second Floor' },
  { code: 'CC', meaning: 'Complete Clean' },
  { code: 'PC', meaning: 'Part Clean' },
  { code: 'RD', meaning: 'Redecorate' },
  { code: 'PR', meaning: 'Part Redecorate' },
  { code: 'SD', meaning: 'Surface Damage' },
  { code: 'RP', meaning: 'Repair' },
  { code: 'RPL', meaning: 'Replace' },
  { code: 'BRR', meaning: 'Beyond Reasonable Repair' },
  { code: '✓', meaning: 'Satisfactory condition' },
];

export function buildEmptyInventoryRooms(): InventoryRoomsMatrix {
  return {
    abbreviations: INVENTORY_ABBREVIATIONS,
    sections: [
      {
        id: 'exterior_front',
        name: 'Exterior Front',
        items: items(
          'Wall / fence',
          'Gate',
          'Water storage tank',
          'Roofing',
          'Guttering',
          'Front door',
          'Windows & Frames',
          'Security lights',
          'Refuse bin',
          'Flowers / landscaping',
        ),
      },
      {
        id: 'porch',
        name: 'Porch',
        items: items(
          'Ceiling',
          'Walls',
          'Floor',
          'Door/s',
          'Window/s',
          'Light fitting/s',
          'Light bulb/s',
          'Switches/ sockets',
          'Railings',
        ),
      },
      {
        id: 'living_room',
        name: 'Living Room',
        items: items(
          ...COMMON_ROOM,
          'Water heater',
          'Fire extinguishers',
          'Air conditioners',
          'Chair/s',
        ),
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        items: items(
          ...COMMON_ROOM,
          'Sink/Taps/ Draining board',
          'Worksurfaces/counter top',
          'Smoke Extractor',
          'Cabinets',
          'Cooker',
        ),
      },
      {
        id: 'bedroom_1',
        name: 'Bedroom 1',
        items: items(
          'Ceiling',
          'Walls',
          'Floor',
          'Floor Covering',
          'Doors',
          'Windows',
          'Light Fittings',
          'Light Bulbs',
          'Air conditioners',
          'Switches/ Sockets',
          'Wardrobe/s',
        ),
      },
      {
        id: 'bedroom_2',
        name: 'Bedroom 2',
        items: items(
          'Ceiling',
          'Walls',
          'Floor',
          'Floor Covering',
          'Doors/ Windows',
          'Curtains/ Blinds',
          'Light Fittings',
          'Light Bulbs',
          'Air conditioners',
          'Switches/ Sockets',
          'Wardrobe/s',
        ),
      },
      {
        id: 'bedroom_3',
        name: 'Bedroom 3',
        items: items(
          'Ceiling',
          'Walls',
          'Floor',
          'Floor Covering',
          'Doors/ Windows',
          'Curtains/ Blinds',
          'Light Fittings',
          'Light Bulbs',
          'Air conditioners',
          'Switches/ Sockets',
          'Wardrobe/s',
        ),
      },
      {
        id: 'continuation',
        name: 'Continuation',
        items: items(
          'Additional item 1',
          'Additional item 2',
          'Additional item 3',
          'Additional item 4',
          'Additional item 5',
        ),
      },
    ],
  };
}

export function collectDefectLines(roomsJson: unknown): {
  section: string;
  item: string;
  defects: string;
  cost: number;
}[] {
  if (!roomsJson || typeof roomsJson !== 'object') return [];
  const matrix = roomsJson as InventoryRoomsMatrix;
  if (!Array.isArray(matrix.sections)) return [];
  const out: { section: string; item: string; defects: string; cost: number }[] = [];
  for (const section of matrix.sections) {
    for (const item of section.items ?? []) {
      const defects = (item.moveInDefects || '').trim();
      const cost = Number(item.cost) || 0;
      if (defects || cost > 0) {
        out.push({
          section: section.name,
          item: item.label,
          defects: defects || 'Defect noted',
          cost,
        });
      }
    }
  }
  return out;
}

export type DepositCompareLine = {
  sectionId: string;
  section: string;
  itemId: string;
  item: string;
  moveInDefects: string;
  moveOutDefects: string;
  comments: string;
  cost: number;
  /** FM judgment — natural wear not charged (G.14). Default false when new move-out defects/cost. */
  wearAndTear: boolean;
  chargeable: boolean;
};

/** Compare completed move-in baseline vs move-out matrix (G.14 / K.8). */
export function compareInventoryRooms(
  moveInRooms: unknown,
  moveOutRooms: unknown,
): DepositCompareLine[] {
  const moveIn = (moveInRooms as InventoryRoomsMatrix | null)?.sections ?? [];
  const moveOut = (moveOutRooms as InventoryRoomsMatrix | null)?.sections ?? [];
  const inMap = new Map<string, InventoryLineItem>();
  for (const s of moveIn) {
    for (const item of s.items ?? []) {
      inMap.set(`${s.id}::${item.id}`, item);
    }
  }

  const lines: DepositCompareLine[] = [];
  for (const s of moveOut) {
    for (const item of s.items ?? []) {
      const baseline = inMap.get(`${s.id}::${item.id}`);
      const moveInDefects = (baseline?.moveInDefects || baseline?.moveOutDefects || '').trim();
      const moveOutDefects = (item.moveOutDefects || '').trim();
      const comments = (item.comments || '').trim();
      const cost = Number(item.cost) || 0;
      const worsened =
        !!moveOutDefects &&
        moveOutDefects.toLowerCase() !== moveInDefects.toLowerCase() &&
        moveOutDefects !== '✓' &&
        moveOutDefects.toLowerCase() !== 'satisfactory';
      const hasChargeSignal = cost > 0 || worsened;
      if (!hasChargeSignal && !moveOutDefects && !moveInDefects) continue;

      lines.push({
        sectionId: s.id,
        section: s.name,
        itemId: item.id,
        item: item.label,
        moveInDefects: moveInDefects || '—',
        moveOutDefects: moveOutDefects || '—',
        comments,
        cost,
        wearAndTear: false,
        chargeable: hasChargeSignal,
      });
    }
  }
  return lines;
}

export function sumChargeableDeductions(lines: DepositCompareLine[]): number {
  return Math.round(
    lines
      .filter((l) => l.chargeable && !l.wearAndTear)
      .reduce((s, l) => s + (Number(l.cost) || 0), 0) * 100,
  ) / 100;
}
