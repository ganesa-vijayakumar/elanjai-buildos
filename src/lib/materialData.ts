export type MaterialTier = 'basic' | 'standard' | 'premium'

export interface MaterialOption {
  tier: MaterialTier
  description: string
  rate: number
  unit: string
  brands?: string[]
}

export interface MaterialItem {
  itemId: string
  name: string
  description: string
  options: {
    basic?: MaterialOption
    standard?: MaterialOption
    premium?: MaterialOption
  }
  defaultBrands?: {
    basic?: string[]
    standard?: string[]
    premium?: string[]
  }
  factor: number // units per sq.ft of total built-up area
}

export interface WorkCategory {
  categoryId: string
  name: string
  items: MaterialItem[]
}

export const WORK_CATEGORIES: WorkCategory[] = [
  {
    categoryId: 'basement_concrete',
    name: 'Basement & Concrete Works',
    items: [
      {
        itemId: 'foundation_concrete',
        name: 'Foundation Concrete (M20 Grade)',
        description: 'Cement concrete for foundation',
        options: {
          basic: { tier: 'basic', description: 'Zuari/Dalmia cement', rate: 5500, unit: 'cum', brands: ['Zuari', 'Dalmia'] },
          standard: { tier: 'standard', description: 'Coromandel/Dalmia cement', rate: 5800, unit: 'cum', brands: ['Coromandel', 'Dalmia'] },
          premium: { tier: 'premium', description: 'Ultratech/Coromandel cement', rate: 6200, unit: 'cum', brands: ['Ultratech', 'Coromandel'] },
        },
        factor: 0.15, // cum per sqft
      },
      {
        itemId: 'column_slab',
        name: 'Column & Slab Concrete (M20)',
        description: 'RCC work for structural elements',
        options: {
          basic: { tier: 'basic', description: 'Standard mix', rate: 6000, unit: 'cum' },
          standard: { tier: 'standard', description: 'Enhanced mix with admixtures', rate: 6500, unit: 'cum' },
          premium: { tier: 'premium', description: 'Premium mix with Fosroc waterproofing', rate: 7200, unit: 'cum' },
        },
        factor: 0.12, // cum per sqft
      },
      {
        itemId: 'steel_reinforcement',
        name: 'Steel Reinforcement',
        description: 'TMT bars for RCC work',
        options: {
          basic: { tier: 'basic', description: 'Kamachi Fe500', rate: 65, unit: 'kg', brands: ['Kamachi'] },
          standard: { tier: 'standard', description: 'ARS/ARUN Fe500D', rate: 68, unit: 'kg', brands: ['ARS', 'ARUN'] },
          premium: { tier: 'premium', description: 'I Steel Fe550D', rate: 72, unit: 'kg', brands: ['I Steel'] },
        },
        factor: 4.5, // kg per sqft
      },
    ],
  },
  {
    categoryId: 'brick_layer',
    name: 'Brick Layer',
    items: [
      {
        itemId: 'wall_brickwork_9inch',
        name: 'Wall Brickwork (9" thick)',
        description: 'Red clay bricks with cement mortar',
        options: {
          basic: { tier: 'basic', description: 'Local bricks with 1:6 mortar', rate: 55, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'Quality bricks with 1:5 mortar', rate: 60, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'Premium bricks with 1:4 mortar', rate: 65, unit: 'sq.ft' },
        },
        factor: 1.2, // sqft per sqft
      },
      {
        itemId: 'wall_brickwork_4inch',
        name: 'Wall Brickwork (4.5" thick)',
        description: 'Partition walls',
        options: {
          basic: { tier: 'basic', description: 'Local bricks', rate: 42, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'Quality bricks', rate: 46, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'Premium bricks', rate: 50, unit: 'sq.ft' },
        },
        factor: 0.8, // sqft per sqft
      },
    ],
  },
  {
    categoryId: 'plastering',
    name: 'Plastering',
    items: [
      {
        itemId: 'internal_plastering',
        name: 'Internal Wall Plastering',
        description: 'Cement sand plastering 12mm thick',
        options: {
          basic: { tier: 'basic', description: 'Standard sand 1:4 mix', rate: 35, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'River sand 1:4 mix', rate: 38, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'River sand with bonding agent', rate: 42, unit: 'sq.ft' },
        },
        factor: 4.0, // sqft per sqft (walls + ceiling)
      },
      {
        itemId: 'external_plastering',
        name: 'External Wall Plastering',
        description: 'Cement sand plastering 15mm thick',
        options: {
          basic: { tier: 'basic', description: 'Standard sand 1:4 mix', rate: 40, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'River sand 1:4 mix', rate: 44, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'Waterproof plastering with additives', rate: 50, unit: 'sq.ft' },
        },
        factor: 1.5, // sqft per sqft
      },
    ],
  },
  {
    categoryId: 'flooring_tiles',
    name: 'Flooring & Tiles',
    items: [
      {
        itemId: 'room_flooring',
        name: 'Room Flooring (Vitrified 4\'x2\')',
        description: 'Living room, bedroom flooring',
        options: {
          basic: { tier: 'basic', description: 'Standard vitrified tiles', rate: 60, unit: 'sq.ft', brands: ['KAG'] },
          standard: { tier: 'standard', description: 'Premium vitrified tiles', rate: 70, unit: 'sq.ft', brands: ['KAG', 'Anuj'] },
          premium: { tier: 'premium', description: 'Granite/Premium tiles', rate: 90, unit: 'sq.ft', brands: ['Premium brands'] },
        },
        factor: 0.9, // sqft per sqft
      },
      {
        itemId: 'toilet_wall_tiles',
        name: 'Toilet Wall Tiles',
        description: 'Ceramic wall tiles up to height',
        options: {
          basic: { tier: 'basic', description: 'Up to 7\' height', rate: 45, unit: 'sq.ft', brands: ['KAG'] },
          standard: { tier: 'standard', description: 'Up to 10\' height', rate: 55, unit: 'sq.ft', brands: ['KAG', 'Anuj'] },
          premium: { tier: 'premium', description: 'Up to ceiling with antiskid', rate: 65, unit: 'sq.ft', brands: ['Premium brands'] },
        },
        factor: 0.4, // sqft per sqft
      },
      {
        itemId: 'toilet_floor_tiles',
        name: 'Toilet Floor Tiles',
        description: 'Antiskid floor tiles',
        options: {
          basic: { tier: 'basic', description: 'Standard antiskid', rate: 40, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'Premium antiskid', rate: 50, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'Designer antiskid', rate: 65, unit: 'sq.ft' },
        },
        factor: 0.05, // sqft per sqft
      },
      {
        itemId: 'staircase_flooring',
        name: 'Staircase Flooring',
        description: 'Staircase steps and landing',
        options: {
          basic: { tier: 'basic', description: 'Antiskid tiles', rate: 40, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'Premium antiskid', rate: 50, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'Granite flooring', rate: 150, unit: 'sq.ft' },
        },
        factor: 0.1, // sqft per sqft
      },
      {
        itemId: 'kitchen_counter',
        name: 'Kitchen Counter',
        description: 'Kitchen countertop',
        options: {
          premium: { tier: 'premium', description: 'G20/Black granite counter', rate: 200, unit: 'sq.ft', brands: ['Granite'] },
        },
        factor: 0.02, // sqft per sqft
      },
    ],
  },
  {
    categoryId: 'iron_steel_works',
    name: 'Iron & Steel Works (Grills)',
    items: [
      {
        itemId: 'window_grills',
        name: 'Window Grills',
        description: 'MS grills for windows',
        options: {
          basic: { tier: 'basic', description: 'Standard MS grills', rate: 180, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'Powder coated grills', rate: 220, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'Designer MS grills', rate: 280, unit: 'sq.ft' },
        },
        factor: 0.15, // sqft per sqft
      },
      {
        itemId: 'staircase_railing',
        name: 'Staircase Railing',
        description: 'MS railing for staircase',
        options: {
          basic: { tier: 'basic', description: 'Standard MS railing', rate: 250, unit: 'rft' },
          standard: { tier: 'standard', description: 'SS railing', rate: 450, unit: 'rft' },
          premium: { tier: 'premium', description: 'Premium SS/Glass railing', rate: 650, unit: 'rft' },
        },
        factor: 0.05, // rft per sqft
      },
    ],
  },
  {
    categoryId: 'carpentry_joinery',
    name: 'Carpentry & Joinery',
    items: [
      {
        itemId: 'main_door',
        name: 'Main Door (Teak)',
        description: 'Teak wood main entrance door',
        options: {
          basic: { tier: 'basic', description: 'Teak frame with basic design', rate: 20000, unit: 'nos', brands: ['Teak'] },
          standard: { tier: 'standard', description: 'Teak frame with enhanced design', rate: 30000, unit: 'nos', brands: ['Teak'] },
          premium: { tier: 'premium', description: 'Teak with brass fittings', rate: 35000, unit: 'nos', brands: ['Teak + Brass'] },
        },
        factor: 1 / 1500, // 1 door per 1500 sqft
      },
      {
        itemId: 'bedroom_doors',
        name: 'Bedroom Doors',
        description: 'Internal bedroom doors',
        options: {
          basic: { tier: 'basic', description: 'Flush doors with basic frame', rate: 4500, unit: 'nos' },
          standard: { tier: 'standard', description: 'Premium flush doors', rate: 9000, unit: 'nos' },
          premium: { tier: 'premium', description: 'Teak frame doors', rate: 10000, unit: 'nos', brands: ['Teak'] },
        },
        factor: 3 / 1500, // 3 doors per 1500 sqft
      },
      {
        itemId: 'toilet_doors',
        name: 'Toilet Doors',
        description: 'Bathroom doors',
        options: {
          basic: { tier: 'basic', description: 'PVC doors', rate: 3500, unit: 'nos', brands: ['PVC'] },
          standard: { tier: 'standard', description: 'WPVC doors', rate: 8000, unit: 'nos', brands: ['WPVC'] },
          premium: { tier: 'premium', description: 'Premium WPVC', rate: 8000, unit: 'nos', brands: ['WPVC'] },
        },
        factor: 2 / 1500, // 2 doors per 1500 sqft
      },
      {
        itemId: 'windows',
        name: 'Windows',
        description: 'Window frames and shutters',
        options: {
          basic: { tier: 'basic', description: 'UPVC basic', rate: 400, unit: 'sq.ft', brands: ['UPVC'] },
          standard: { tier: 'standard', description: 'UPVC openable', rate: 500, unit: 'sq.ft', brands: ['UPVC'] },
          premium: { tier: 'premium', description: 'Venesta/Etti premium', rate: 600, unit: 'sq.ft', brands: ['Venesta', 'Etti'] },
        },
        factor: 0.15, // sqft per sqft
      },
      {
        itemId: 'kitchen_cabinets',
        name: 'Kitchen Cabinets',
        description: 'Modular kitchen units',
        options: {
          basic: { tier: 'basic', description: 'Basic laminate cabinets', rate: 800, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'Premium laminate with SS sink', rate: 1200, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'Designer cabinets with accessories', rate: 1800, unit: 'sq.ft' },
        },
        factor: 0.05, // sqft per sqft
      },
    ],
  },
  {
    categoryId: 'painting',
    name: 'Painting',
    items: [
      {
        itemId: 'interior_painting',
        name: 'Interior Wall Painting',
        description: 'Emulsion paint for interior walls',
        options: {
          basic: { tier: 'basic', description: 'Economy emulsion', rate: 15, unit: 'sq.ft', brands: ['Asian Paints Economy'] },
          standard: { tier: 'standard', description: 'Premium emulsion', rate: 20, unit: 'sq.ft', brands: ['Asian Paints', 'Berger'] },
          premium: { tier: 'premium', description: 'Luxury emulsion with texture', rate: 28, unit: 'sq.ft', brands: ['Asian Paints Royale', 'Berger Silk'] },
        },
        factor: 4.0, // sqft per sqft
      },
      {
        itemId: 'exterior_painting',
        name: 'Exterior Wall Painting',
        description: 'Weather-proof exterior paint',
        options: {
          basic: { tier: 'basic', description: 'Standard exterior paint', rate: 18, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'Weather-proof paint', rate: 24, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'Premium weather shield', rate: 32, unit: 'sq.ft', brands: ['Asian Apex', 'Berger WeatherCoat'] },
        },
        factor: 1.5, // sqft per sqft
      },
      {
        itemId: 'door_window_painting',
        name: 'Door & Window Painting',
        description: 'Enamel paint for wood/metal',
        options: {
          basic: { tier: 'basic', description: 'Standard enamel', rate: 25, unit: 'sq.ft' },
          standard: { tier: 'standard', description: 'Premium enamel', rate: 35, unit: 'sq.ft' },
          premium: { tier: 'premium', description: 'PU polish/Premium enamel', rate: 50, unit: 'sq.ft' },
        },
        factor: 0.2, // sqft per sqft
      },
    ],
  },
  {
    categoryId: 'electrical',
    name: 'Electrical',
    items: [
      {
        itemId: 'wiring_concealed',
        name: 'Concealed Wiring',
        description: 'Complete electrical wiring',
        options: {
          basic: { tier: 'basic', description: 'Finolex/Standard wire', rate: 350, unit: 'point', brands: ['Finolex'] },
          standard: { tier: 'standard', description: 'Polycab/Premium wire', rate: 400, unit: 'point', brands: ['Polycab', 'Havells'] },
          premium: { tier: 'premium', description: 'Premium branded wire', rate: 450, unit: 'point', brands: ['Polycab', 'Havells'] },
        },
        factor: 0.3, // point per sqft
      },
      {
        itemId: 'switches_sockets',
        name: 'Switches & Sockets',
        description: 'Modular switches and power outlets',
        options: {
          basic: { tier: 'basic', description: 'Orbit/GM switches', rate: 200, unit: 'point', brands: ['Orbit', 'GM'] },
          standard: { tier: 'standard', description: 'Anchor Roma', rate: 300, unit: 'point', brands: ['Anchor Roma'] },
          premium: { tier: 'premium', description: 'Legrand', rate: 450, unit: 'point', brands: ['Legrand'] },
        },
        factor: 0.3, // point per sqft
      },
      {
        itemId: 'light_fixtures',
        name: 'Light Fixtures',
        description: 'LED lights and fixtures',
        options: {
          basic: { tier: 'basic', description: 'Basic LED lights', rate: 500, unit: 'point' },
          standard: { tier: 'standard', description: 'Premium LED fixtures', rate: 800, unit: 'point' },
          premium: { tier: 'premium', description: 'Designer lighting', rate: 1500, unit: 'point' },
        },
        factor: 0.15, // point per sqft
      },
    ],
  },
  {
    categoryId: 'plumbing_sanitary',
    name: 'Plumbing & Sanitary',
    items: [
      {
        itemId: 'cp_fittings',
        name: 'CP Fittings (Bathroom)',
        description: 'Chrome-plated fittings per bathroom',
        options: {
          basic: { tier: 'basic', description: 'Parryware Indus', rate: 20000, unit: 'set', brands: ['Parryware Indus'] },
          standard: { tier: 'standard', description: 'Parryware Indus', rate: 30000, unit: 'set', brands: ['Parryware Indus'] },
          premium: { tier: 'premium', description: 'Jaguar', rate: 40000, unit: 'set', brands: ['Jaguar'] },
        },
        factor: 2 / 1500, // 2 bathrooms per 1500 sqft
      },
      {
        itemId: 'sanitary_ware',
        name: 'Sanitary Ware (EWC, Washbasin)',
        description: 'Toilet and washbasin per bathroom',
        options: {
          basic: { tier: 'basic', description: 'Parryware/Hindware', rate: 15000, unit: 'set', brands: ['Parryware', 'Hindware'] },
          standard: { tier: 'standard', description: 'Wall-mounted Parryware', rate: 20000, unit: 'set', brands: ['Parryware'] },
          premium: { tier: 'premium', description: 'Wall-mounted Jaguar', rate: 30000, unit: 'set', brands: ['Jaguar'] },
        },
        factor: 2 / 1500, // 2 bathrooms per 1500 sqft
      },
      {
        itemId: 'plumbing_pipes',
        name: 'Plumbing Pipes & Fittings',
        description: 'CPVC/PVC pipes for water supply',
        options: {
          basic: { tier: 'basic', description: 'Standard CPVC', rate: 100, unit: 'point', brands: ['Ashirvad'] },
          standard: { tier: 'standard', description: 'Premium CPVC', rate: 120, unit: 'point', brands: ['Astral'] },
          premium: { tier: 'premium', description: 'Premium Astral CPVC', rate: 150, unit: 'point', brands: ['Astral'] },
        },
        factor: 0.4, // point per sqft
      },
    ],
  },
]

export interface MaterialSelection {
  itemId: string
  name: string
  selectedTier: MaterialTier
  rate: number
  unit: string
  brand: string
  categoryId: string
}

export interface CustomMaterialItem {
  itemId: string
  categoryId: string
  name: string
  description: string
  rate: number
  unit: string
  brand: string
  isCustom: boolean
}

export interface MaterialCustomizationData {
  quotationId: string
  basePackage: 'basic' | 'standard' | 'premium' | 'custom'
  baseSqft: number
  baseTotal: number
  materialSelections: MaterialSelection[]
  customItems: CustomMaterialItem[]
  adjustmentTotal: number
  finalEstimatedCost: number
  createdAt: string
  updatedAt: string
}
