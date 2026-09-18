/** Comprehensive marketplace job / need catalog for Triple A. */
export const MARKETPLACE_CATALOG: {
  code: string;
  category: string;
  label: string;
  description: string;
  sortOrder: number;
}[] = [
  // Plumbing
  { code: 'PLUMB_LEAK', category: 'Plumbing', label: 'Leak repair', description: 'Pipe leaks, dripping taps, cistern issues', sortOrder: 10 },
  { code: 'PLUMB_INSTALL', category: 'Plumbing', label: 'Fixture installation', description: 'Sinks, toilets, showers, water heaters', sortOrder: 11 },
  { code: 'PLUMB_BLOCKAGE', category: 'Plumbing', label: 'Drain / blockage clearing', description: 'Blocked drains, septic, inspection chambers', sortOrder: 12 },
  { code: 'PLUMB_REPIPE', category: 'Plumbing', label: 'Repiping / reticulation', description: 'New or replacement water/waste lines', sortOrder: 13 },
  // Electrical
  { code: 'ELEC_FAULT', category: 'Electrical', label: 'Electrical fault finding', description: 'Tripping breakers, dead circuits, shorts', sortOrder: 20 },
  { code: 'ELEC_WIRING', category: 'Electrical', label: 'Wiring / rewiring', description: 'New circuits, socket additions, DB work', sortOrder: 21 },
  { code: 'ELEC_LIGHTING', category: 'Electrical', label: 'Lighting installation', description: 'Fixtures, chandeliers, outdoor lights', sortOrder: 22 },
  { code: 'ELEC_GENERATOR', category: 'Electrical', label: 'Generator install / service', description: 'Changeover, servicing, fuel systems', sortOrder: 23 },
  { code: 'ELEC_SOLAR', category: 'Electrical', label: 'Solar / inverter systems', description: 'Panels, inverters, batteries, hybrid setups', sortOrder: 24 },
  // HVAC
  { code: 'AC_INSTALL', category: 'HVAC / AC', label: 'AC installation', description: 'Split / cassette / ducted install', sortOrder: 30 },
  { code: 'AC_SERVICE', category: 'HVAC / AC', label: 'AC servicing & gas', description: 'Cleaning, gas recharge, repairs', sortOrder: 31 },
  { code: 'AC_FAULT', category: 'HVAC / AC', label: 'AC not cooling / fault', description: 'Diagnosis and repair', sortOrder: 32 },
  // Building trades
  { code: 'CARP_FURN', category: 'Carpentry', label: 'Furniture / fittings', description: 'Wardrobes, kitchens, doors, shelves', sortOrder: 40 },
  { code: 'CARP_DOOR', category: 'Carpentry', label: 'Doors & frames', description: 'Hang, repair, replace doors', sortOrder: 41 },
  { code: 'TILE_FLOOR', category: 'Tiling', label: 'Floor / wall tiling', description: 'Ceramic, porcelain, marble laying', sortOrder: 50 },
  { code: 'TILE_REPAIR', category: 'Tiling', label: 'Tile repair / regrout', description: 'Cracked tiles, hollow spots, grout', sortOrder: 51 },
  { code: 'PAINT_INT', category: 'Painting', label: 'Interior painting', description: 'Rooms, corridors, touch-ups', sortOrder: 60 },
  { code: 'PAINT_EXT', category: 'Painting', label: 'Exterior painting', description: 'Facades, fences, weather coats', sortOrder: 61 },
  { code: 'POP_CEIL', category: 'POP / Ceiling', label: 'POP / gypsum ceiling', description: 'False ceilings, cornices, designs', sortOrder: 70 },
  { code: 'ROOF_REPAIR', category: 'Roofing', label: 'Roof repair', description: 'Leaks, sheets, gutters, flashings', sortOrder: 80 },
  { code: 'ROOF_NEW', category: 'Roofing', label: 'New roofing', description: 'Full roof replacement or new build', sortOrder: 81 },
  { code: 'MASON_BLOCK', category: 'Masonry', label: 'Block work / plaster', description: 'Walls, plastering, rendering', sortOrder: 90 },
  { code: 'MASON_CONCRETE', category: 'Masonry', label: 'Concrete / screed', description: 'Slabs, screeds, small pours', sortOrder: 91 },
  { code: 'WELD_FAB', category: 'Welding / Steel', label: 'Welding & fabrication', description: 'Gates, burglar proofs, railings', sortOrder: 100 },
  { code: 'ALU_GLASS', category: 'Aluminium / Glass', label: 'Aluminium & glass', description: 'Windows, sliding doors, mirrors', sortOrder: 110 },
  { code: 'INTERLOCK', category: 'Civil / External', label: 'Interlocking / paving', description: 'Driveways, walkways, kerbs', sortOrder: 120 },
  { code: 'BOREHOLE', category: 'Water', label: 'Borehole / water systems', description: 'Drilling support, pumps, tanks', sortOrder: 130 },
  { code: 'LANDSCAPE', category: 'Landscaping', label: 'Landscaping / gardening', description: 'Lawns, hedges, softscape', sortOrder: 140 },
  // Home services
  { code: 'CLEAN_DEEP', category: 'Cleaning', label: 'Deep cleaning', description: 'Post-construction or seasonal clean', sortOrder: 150 },
  { code: 'CLEAN_REGULAR', category: 'Cleaning', label: 'Regular cleaning', description: 'Ongoing domestic / office clean', sortOrder: 151 },
  { code: 'FUMIGATE', category: 'Pest control', label: 'Fumigation / pest control', description: 'Insects, rodents, termites', sortOrder: 160 },
  { code: 'MOVE_RELOC', category: 'Moving', label: 'Moving / relocation', description: 'Packing and relocation labour', sortOrder: 170 },
  { code: 'APPL_REPAIR', category: 'Appliances', label: 'Appliance repair', description: 'Fridge, washer, cooker, microwave', sortOrder: 180 },
  { code: 'CCTV', category: 'Security tech', label: 'CCTV / access control', description: 'Cameras, intercoms, electric fences', sortOrder: 190 },
  { code: 'WASTE', category: 'Waste', label: 'Waste / debris removal', description: 'Site clearance, junk haulage', sortOrder: 200 },
  // Finishes & misc
  { code: 'FLOOR_WOOD', category: 'Flooring', label: 'Wood / laminate flooring', description: 'Install or repair timber floors', sortOrder: 210 },
  { code: 'WATERPROOF', category: 'Waterproofing', label: 'Waterproofing', description: 'Bathrooms, roofs, basements', sortOrder: 220 },
  { code: 'INSULATION', category: 'Insulation', label: 'Insulation / soundproofing', description: 'Thermal or acoustic treatment', sortOrder: 230 },
  { code: 'HANDYMAN', category: 'General', label: 'General handyman', description: 'Small multi-trade fixes', sortOrder: 240 },
  { code: 'OTHER', category: 'General', label: 'Other (describe)', description: 'Need not listed — Admin will review and route', sortOrder: 999 },
];
