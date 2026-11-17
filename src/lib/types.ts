import type { ShippingMethodId, ShippingRegionId } from './shipping.ts';
export type { ShippingMethodId, ShippingRegionId };

export type ProductLine = 'adult' | 'kiddies' | 'combo';

export type ProductCategory =
  | 'Scalp & Roots'
  | 'Cleanse'
  | 'Moisture & Masks'
  | 'Daily Styling';

export interface ProductVariant {
  id: string;
  sizeLabel: string;
  priceNgn: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  line: ProductLine;
  category: ProductCategory;
  shortNote: string;
  description: string;
  botanicals: string[];
  includes?: string[];
  ritual: string;
  imageSrc: string;
  featured: boolean;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export type PaymentMethod = 'paystack' | 'opay';

export type OrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'shipped';

export interface OrderLineItem {
  productId: string;
  productName: string;
  variantId: string;
  sizeLabel: string;
  unitPriceNgn: number;
  quantity: number;
  lineTotalNgn: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentChannel: string;
  customer: {
    fullName: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    city: string;
    state: string;
    regionId?: ShippingRegionId;
    regionLabel?: string;
    methodId?: ShippingMethodId;
    methodLabel?: string;
    note: string;
  };
  items: OrderLineItem[];
  subtotalNgn: number;
  discountNgn?: number;
  discountLabel?: string;
  totalNgn?: number;
  deliveryFeeNgn: number | null;
  studioNote: string;
  verificationCode?: string;
  codeCopiedAt?: string;
  source?: 'store' | 'paystack';
  emailFeedback?: {
    sentAt?: string;
    customerNotified: boolean;
    ownerNotified: boolean;
    channel: 'smtp' | 'resend' | 'paystack_receipt' | 'manual_transfer';
  };
}

export interface PublicStoreConfig {
  brandName: string;
  email: string;
  location: string;
  opay: {
    enabled: boolean;
    bankName: string;
    accountName: string;
    accountNumber: string;
    whatsappNumber?: string;
    whatsappLink?: string;
  };
  paystack: {
    enabled: boolean;
    mode: 'live' | 'sandbox';
    publicKey: string;
  };
  promo?: {
    title: string;
    discountPercent: number;
    startsAtIso: string;
    endsAtIso: string;
  };
}
