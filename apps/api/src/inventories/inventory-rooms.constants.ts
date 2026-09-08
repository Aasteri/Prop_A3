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
