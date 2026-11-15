export type ShippingRegionId =
  | 'ibadan'
  | 'west'
  | 'north_central_corridor'
  | 'east'
  | 'south'
  | 'north';

export type ShippingMethodId = 'pickup' | 'logistics_pickup' | 'doorstep';

export interface ShippingMethodOption {
  id: ShippingMethodId;
  label: string;
  description: string;
  feeNgn: number;
}

export interface ShippingRegionConfig {
  id: ShippingRegionId;
  label: string;
  shortLabel: string;
  states: string[];
  methods: ShippingMethodOption[];
}

export const SHIPPING_REGIONS: ShippingRegionConfig[] = [
  {
    id: 'ibadan',
    label: 'Ibadan (Oyo State Studio)',
    shortLabel: 'Ibadan',
    states: ['Oyo (Ibadan)'],
    methods: [
      {
        id: 'pickup',
        label: 'Ibadan Pick Up',
        description: 'Collect directly at our Ibadan studio with zero shipping charge.',
        feeNgn: 0,
      },
      {
        id: 'doorstep',
        label: 'Ibadan Doorstep Delivery',
        description: 'Local rider dispatch anywhere within Ibadan.',
        feeNgn: 3500,
      },
    ],
  },
  {
    id: 'west',
    label: 'Western Nigeria',
    shortLabel: 'West',
    states: ['Ekiti', 'Lagos', 'Ogun', 'Ondo', 'Osun', 'Oyo (Outside Ibadan)'],
    methods: [
      {
        id: 'logistics_pickup',
        label: 'Logistics Pick Up (Western)',
        description: 'Collect at your state logistics park / waybill hub.',
        feeNgn: 3500,
      },
      {
        id: 'doorstep',
        label: 'Doorstep Delivery (Western)',
        description: 'Delivered directly to your Western Nigeria street address.',
        feeNgn: 5000,
      },
    ],
  },
  {
    id: 'north_central_corridor',
    label: 'Abuja, Kwara & Kogi',
    shortLabel: 'Abuja / Kwara / Kogi',
    states: ['FCT Abuja', 'Kogi', 'Kwara'],
    methods: [
      {
        id: 'logistics_pickup',
        label: 'Logistics Pick Up (Abuja / Kwara / Kogi)',
        description: 'Waybill hub / park pick up in FCT Abuja, Kwara, or Kogi.',
        feeNgn: 5000,
      },
      {
        id: 'doorstep',
        label: 'Doorstep Delivery (Abuja / Kwara / Kogi)',
        description: 'Direct doorstep courier delivery in FCT Abuja, Kwara, or Kogi.',
        feeNgn: 6000,
      },
    ],
  },
  {
    id: 'east',
    label: 'Eastern Nigeria',
    shortLabel: 'East',
    states: ['Abia', 'Anambra', 'Ebonyi', 'Enugu', 'Imo'],
    methods: [
      {
        id: 'logistics_pickup',
        label: 'Logistics Pick Up (Eastern)',
        description: 'Collect at your Eastern state logistics hub / park.',
        feeNgn: 4500,
      },
      {
        id: 'doorstep',
        label: 'Doorstep Delivery (Eastern)',
        description: 'Direct doorstep delivery across Eastern states.',
        feeNgn: 5000,
      },
    ],
  },
  {
    id: 'south',
    label: 'Southern Nigeria',
    shortLabel: 'South',
    states: ['Akwa Ibom', 'Bayelsa', 'Cross River', 'Delta', 'Edo', 'Rivers'],
    methods: [
      {
        id: 'logistics_pickup',
        label: 'Logistics Pick Up (Southern)',
        description: 'Collect at your Southern state logistics hub / park.',
        feeNgn: 4500,
      },
      {
        id: 'doorstep',
        label: 'Doorstep Delivery (Southern)',
        description: 'Direct doorstep delivery across Southern states.',
        feeNgn: 5000,
      },
    ],
  },
  {
    id: 'north',
    label: 'Northern Nigeria',
    shortLabel: 'North',
    states: [
      'Adamawa',
      'Bauchi',
      'Benue',
      'Borno',
      'Gombe',
      'Jigawa',
      'Kaduna',
      'Kano',
      'Katsina',
      'Kebbi',
      'Nasarawa',
      'Niger',
      'Plateau',
      'Sokoto',
      'Taraba',
      'Yobe',
      'Zamfara',
    ],
    methods: [
      {
        id: 'doorstep',
        label: 'Doorstep Delivery (Northern)',
        description: 'Direct interstate doorstep courier delivery to Northern states.',
        feeNgn: 9000,
      },
    ],
  },
];

export function findRegionById(regionId?: string): ShippingRegionConfig | undefined {
  return SHIPPING_REGIONS.find((r) => r.id === regionId);
}

export function findRegionByState(stateName?: string): ShippingRegionConfig | undefined {
  if (!stateName) return undefined;
  const normalized = stateName.trim().toLowerCase();
  return SHIPPING_REGIONS.find((r) =>
    r.states.some((s) => s.toLowerCase() === normalized)
  );
}

export interface ResolvedShippingQuote {
  region: ShippingRegionConfig;
  state: string;
  method: ShippingMethodOption;
}

export function resolveShippingQuote(input: {
  regionId?: string;
  state?: string;
  methodId?: string;
}): ResolvedShippingQuote | null {
  const region =
    findRegionByState(input.state) ||
    findRegionById(input.regionId);
  if (!region) return null;

  const trimmedState = input.state?.trim() || region.states[0];
  const matchedState =
    region.states.find((s) => s.toLowerCase() === trimmedState.toLowerCase()) ||
    region.states[0];

  const method =
    region.methods.find((m) => m.id === input.methodId) ||
    region.methods[0];

  return {
    region,
    state: matchedState,
    method,
  };
}
