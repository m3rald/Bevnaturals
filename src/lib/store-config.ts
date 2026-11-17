import { SHIPPING_REGIONS } from './shipping.ts';

export const storeConfig = {
  brandName: 'Bev Naturals Cosmetics',
  shortName: 'Bev Naturals',
  logoSrc: '/assets/aistudio/bev_naturals_logo.png',
  email: 'adereb18@gmail.com',
  location: 'Ibadan, Oyo State, Nigeria',
  fulfilmentScope: 'Crafted in Ibadan · Shipped nationwide across Nigeria',
  opay: {
    enabled: true,
    bankName: 'OPAY',
    accountName: 'BEV NATURALS COSMETICS',
    accountNumber: '6419555143',
    whatsappNumber: '09019964862',
    whatsappLink: 'https://wa.me/message/EWPWCPFTETH5J1',
  },
  paystack: {
    enabled: false,
    currency: 'NGN',
  },
} as const;

export const NIGERIAN_STATES: string[] = SHIPPING_REGIONS.flatMap((region) => region.states);
