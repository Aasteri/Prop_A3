/**
 * Doc 4 construction checklist sections from
 * ALL_TYPES_CONSTRUCTION_CHECKLIST.txt / INTERNAL_CONTROL_CONSTRUCTION_INSPECTION_LOG.txt
 */
export type Doc4Section = {
  title: string;
  items: string[];
};

export const DOC4_SECTIONS: Doc4Section[] = [
  {
    title: 'PRE-CONSTRUCTION CHECKLIST',
    items: [
      'Land survey completed',
      'Soil investigation report approved',
      'Building plan approved',
      'Building permits obtained',
      'Utility connections arranged',
      'Site fencing and signage installed',
      'Site office and storage ready',
    ],
  },
  {
    title: 'EXCAVATION CHECKLIST',
    items: [
      'Layout verified',
      'Excavation depth checked',
      'Soil condition inspected',
      'Dewatering arranged (if required)',
      'Excavation safety maintained',
    ],
  },
  {
    title: 'FOUNDATION CHECKLIST',
    items: [
      'PCC level checked',
      'Anti-termite treatment done',
      'Reinforcement as per drawings',
      'Cover blocks installed',
      'Formwork alignment checked',
      'Concrete grade approved',
      'Cube samples collected',
      'Proper curing started',
    ],
  },
  {
    title: 'COLUMN CHECKLIST',
    items: [
      'Starter bars checked',
      'Reinforcement spacing verified',
      'Verticality checked',
      'Cover maintained',
      'Formwork tight and aligned',
      'Concrete vibrated properly',
    ],
  },
  {
    title: 'BEAM CHECKLIST',
    items: [
      'Bottom & top reinforcement checked',
      'Stirrup spacing verified',
      'Development length provided',
      'Beam dimensions correct',
      'Openings coordinated',
    ],
  },
  {
    title: 'SLAB CHECKLIST',
    items: [
      'Shuttering level checked',
      'Reinforcement spacing correct',
      'Electrical conduits installed',
      'Plumbing sleeves provided',
      'Cover blocks placed',
      'Concrete poured and vibrated',
      'Curing started',
    ],
  },
  {
    title: 'PRE-POUR / CONCRETE POUR CHECKLIST',
    items: [
      'Drawings approved for construction',
      'Formwork checked and aligned',
      'Reinforcement inspected and signed off',
      'MEP sleeves and conduits in place',
      'Concrete grade and mix approved',
      'Cube moulds and sampling ready',
      'Weather and site conditions acceptable',
      'Safety barriers and PPE confirmed',
      'Consulting engineer / site supervisor sign-off',
    ],
  },
  {
    title: 'MASONRY CHECKLIST',
    items: [
      'Brick quality approved',
      'Mortar ratio correct',
      'Verticality maintained',
      'Joint thickness uniform',
      'Lintel level checked',
      'Masonry curing completed',
    ],
  },
  {
    title: 'PLASTERING CHECKLIST',
    items: [
      'Surface cleaned',
      'Plaster thickness checked',
      'Corners aligned',
      'No hollow areas',
      'Proper curing done',
    ],
  },
  {
    title: 'WATERPROOFING CHECKLIST',
    items: [
      'Surface prepared',
      'Membrane/coating applied correctly',
      'Ponding test completed',
      'No leakage observed',
    ],
  },
  {
    title: 'FLOORING CHECKLIST',
    items: [
      'Base level checked',
      'Tile alignment correct',
      'Joint spacing uniform',
      'Hollow tiles avoided',
      'Finished surface cleaned',
    ],
  },
  {
    title: 'DOORS & WINDOWS CHECKLIST',
    items: [
      'Frame alignment checked',
      'Fixing secure',
      'Shutter operation smooth',
      'Hardware installed',
      'Sealant applied',
    ],
  },
  {
    title: 'PAINTING CHECKLIST',
    items: [
      'Surface prepared',
      'Primer applied',
      'Required coats completed',
      'Shade approved',
      'No cracks or peeling',
    ],
  },
  {
    title: 'ELECTRICAL CHECKLIST',
    items: [
      'Conduits installed',
      'Wiring tested',
      'Earthing completed',
      'DB installed',
      'MCB/RCCB tested',
      'Light and power points working',
    ],
  },
  {
    title: 'PLUMBING CHECKLIST',
    items: [
      'Pipe pressure test completed',
      'Drainage slope checked',
      'Leak test passed',
      'Fixtures installed',
      'Water supply functioning',
    ],
  },
  {
    title: 'FIRE FIGHTING CHECKLIST',
    items: [
      'Fire pipes installed',
      'Hydrants tested',
      'Sprinklers operational',
      'Fire alarm tested',
      'Exit signage installed',
    ],
  },
  {
    title: 'FINISHING CHECKLIST',
    items: [
      'All defects rectified',
      'Silicone sealing completed',
      'Cleaning completed',
      'Touch-up painting done',
    ],
  },
  {
    title: 'EXTERNAL WORKS CHECKLIST',
    items: [
      'Compound wall completed',
      'Roads and pavements finished',
      'Drainage completed',
      'Landscaping completed',
      'Parking marked',
    ],
  },
  {
    title: 'QUALITY CONTROL (QC) CHECKLIST',
    items: [
      'Material approvals',
      'Cube test results',
      'Slump test records',
      'Inspection reports',
      'NCRs closed',
    ],
  },
  {
    title: 'SAFETY CHECKLIST',
    items: [
      'PPE used',
      'Scaffolding inspected',
      'Fire extinguishers available',
      'First aid kit available',
      'Tool-box talks conducted',
    ],
  },
  {
    title: 'HANDOVER / SNAG CHECKLIST',
    items: [
      'Snag list closed',
      'As-built drawings submitted',
      'O&M manuals submitted',
      'Test certificates handed over',
      'Completion certificate obtained',
      'Occupancy certificate obtained',
      'Client handover completed',
    ],
  },
];
