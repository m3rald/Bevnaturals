import { SHIPPING_REGIONS } from './shipping.ts';

export const storeConfig = {
  brandName: 'Bev Naturals Cosmetics',
  shortName: 'Bev Naturals',
  logoSrc: '/assets/aistudio/bev_naturals_logo.png',
  email: 'adereb18@gmail.com',
  location: 'Ibadan, Oyo State, Nigeria',
  fulfilmentScope: 'Crafted in Ibadan · Shipped nationwide across Nigeria',
  opay: {
    enabled: false,
    bankName: 'OPay',
    accountName: 'Bev Naturals Cosmetics',
    accountNumber: '6419555143',
  },
  paystack: {
    enabled: true,
    currency: 'NGN',
  },
} as const;

export const NIGERIAN_STATES: string[] = SHIPPING_REGIONS.flatMap((region) => region.states);
