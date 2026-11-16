import type { Order, OrderLineItem, ShippingMethodId, ShippingRegionId } from './types.ts';

interface PaystackCustomField {
  display_name?: string;
  variable_name?: string;
  value?: string | number;
}

interface PaystackTransactionRecord {
  id?: number;
  reference?: string;
  status?: string;
  amount?: number;
  channel?: string;
  paid_at?: string;
  created_at?: string;
  authorization?: {
    brand?: string;
    last4?: string;
  };
  customer?: {
    email?: string;
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
  };
  metadata?: {
    orderNumber?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    address?: string;
    city?: string;
    state?: string;
    regionId?: ShippingRegionId;
    regionLabel?: string;
    methodId?: ShippingMethodId;
    shippingMethod?: string;
    shippingFeeNgn?: number;
    subtotalNgn?: number;
    discountNgn?: number;
    discountLabel?: string;
    note?: string;
    itemsSummary?: string;
    items?: OrderLineItem[];
    custom_fields?: PaystackCustomField[];
  } | string | null;
}

function normalizeMetadata(
  raw: PaystackTransactionRecord['metadata']
): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return raw as Record<string, unknown>;
}

function getCustomFieldValue(
  fields: PaystackCustomField[] | undefined,
  keys: string[]
): string {
  if (!Array.isArray(fields)) return '';
  for (const field of fields) {
    const varName = String(field.variable_name || '').toLowerCase();
    const dispName = String(field.display_name || '').toLowerCase();
    if (keys.some((k) => varName === k || dispName.includes(k))) {
      return field.value !== undefined && field.value !== null ? String(field.value).trim() : '';
    }
  }
  return '';
}

export function mapPaystackTxToOrder(tx: PaystackTransactionRecord): Order | null {
  const reference = tx.reference?.trim();
  if (!reference) return null;

  const meta = normalizeMetadata(tx.metadata);
  const customFields = Array.isArray(meta.custom_fields)
    ? (meta.custom_fields as PaystackCustomField[])
    : undefined;

  const orderNumber =
    String(meta.orderNumber || '').trim() ||
    getCustomFieldValue(customFields, ['order_number', 'order number']) ||
    `PS-${String(tx.id || reference.slice(-8)).toUpperCase()}`;

  const txFirst = tx.customer?.first_name?.trim() || '';
  const txLast = tx.customer?.last_name?.trim() || '';
  const txCustomerName = [txFirst, txLast].filter(Boolean).join(' ');

  const customerName =
    String(meta.customerName || '').trim() ||
    getCustomFieldValue(customFields, ['customer_name', 'customer name', 'name']) ||
    txCustomerName ||
    'Paystack Customer';

  const customerEmail =
    String(meta.customerEmail || '').trim() ||
    tx.customer?.email?.trim() ||
    getCustomFieldValue(customFields, ['customer_email', 'email']) ||
    '—';

  const customerPhone =
    String(meta.customerPhone || '').trim() ||
    tx.customer?.phone?.trim() ||
    getCustomFieldValue(customFields, ['customer_phone', 'phone']) ||
    '—';

  const state =
    String(meta.state || '').trim() ||
    getCustomFieldValue(customFields, ['state']) ||
    'Nigeria';

  const city =
    String(meta.city || '').trim() ||
    getCustomFieldValue(customFields, ['city']) ||
    state;

  const address =
    String(meta.address || '').trim() ||
    getCustomFieldValue(customFields, ['address', 'delivery_address']) ||
    'Recorded on Paystack Transaction';

  const regionLabel =
    String(meta.regionLabel || '').trim() ||
    getCustomFieldValue(customFields, ['region']) ||
    state;

  const methodLabel =
    String(meta.shippingMethod || '').trim() ||
    getCustomFieldValue(customFields, ['shipping_method', 'shipping method']) ||
    'Paystack Checkout Shipping';

  const note =
    String(meta.note || '').trim() ||
    getCustomFieldValue(customFields, ['note', 'delivery_note']);

  const totalPaidNgn = Math.round((Number(tx.amount) || 0) / 100);
  const deliveryFeeNgn =
    typeof meta.shippingFeeNgn === 'number' ? meta.shippingFeeNgn : 0;
  const discountNgn =
    typeof meta.discountNgn === 'number' ? meta.discountNgn : 0;
  const subtotalNgn =
    typeof meta.subtotalNgn === 'number'
      ? meta.subtotalNgn
      : Math.max(0, totalPaidNgn - deliveryFeeNgn + discountNgn);

  let items: OrderLineItem[] = [];
  if (Array.isArray(meta.items) && meta.items.length > 0) {
    items = meta.items as OrderLineItem[];
  } else {
    const itemsSummary =
      String(meta.itemsSummary || '').trim() ||
      getCustomFieldValue(customFields, ['items', 'products']);
    if (itemsSummary) {
      items = [
        {
          productId: 'paystack-summary',
          productName: itemsSummary,
          variantId: 'paystack-summary',
          sizeLabel: 'Order Items',
          unitPriceNgn: subtotalNgn,
          quantity: 1,
          lineTotalNgn: subtotalNgn,
        },
      ];
    }
  }

  const brand = tx.authorization?.brand?.toUpperCase();
  const last4 = tx.authorization?.last4;
  const paymentChannel =
    brand && last4
      ? `Paystack (${brand} •••• ${last4})`
      : `Paystack (${tx.channel || (tx.status === 'success' ? 'Verified' : tx.status || 'Pending')})`;

  const createdAt = tx.paid_at || tx.created_at || new Date().toISOString();

  return {
    id: `ps-${tx.id || reference}`,
    orderNumber,
    createdAt,
    updatedAt: createdAt,
    status: tx.status === 'success' ? 'paid' : 'awaiting_payment',
    paymentMethod: 'paystack',
    paymentReference: reference,
    paymentChannel,
    customer: {
      fullName: customerName,
      email: customerEmail,
      phone: customerPhone,
    },
    shipping: {
      address,
      city,
      state,
      regionId: meta.regionId as ShippingRegionId | undefined,
      regionLabel,
      methodId: meta.methodId as ShippingMethodId | undefined,
      methodLabel,
      note,
    },
    items,
    subtotalNgn,
    discountNgn,
    discountLabel: String(meta.discountLabel || ''),
    totalNgn: totalPaidNgn,
    deliveryFeeNgn,
    studioNote: '',
    source: 'paystack',
  };
}

export async function verifyPaystackReferenceRemote(
  secretKey: string,
  reference: string
): Promise<Order | null> {
  if (!secretKey || !reference) return null;
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      status?: boolean;
      data?: PaystackTransactionRecord;
    };
    if (!json.status || !json.data) return null;
    return mapPaystackTxToOrder(json.data);
  } catch {
    return null;
  }
}

export async function fetchRecentSuccessfulPaystackOrders(
  secretKey: string,
  perPage = 100
): Promise<Order[]> {
  if (!secretKey) return [];
  try {
    const res = await fetch(
      `https://api.paystack.co/transaction?status=success&perPage=${perPage}`,
      {
        headers: { Authorization: `Bearer ${secretKey}` },
      }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      status?: boolean;
      data?: PaystackTransactionRecord[];
    };
    if (!json.status || !Array.isArray(json.data)) return [];
    return json.data
      .map(mapPaystackTxToOrder)
      .filter((ord): ord is Order => Boolean(ord));
  } catch {
    return [];
  }
}

export async function findPaystackOrderByQuery(
  secretKey: string,
  rawQuery: string
): Promise<Order | null> {
  const query = rawQuery.trim();
  if (!secretKey || !query) return null;
  const upper = query.toUpperCase();

  // Direct reference lookup first if it resembles a Paystack reference
  if (upper.startsWith('BN-PS-') || !upper.startsWith('BN-')) {
    const direct = await verifyPaystackReferenceRemote(secretKey, query);
    if (direct) return direct;
  }

  // Search recent successful Paystack transactions by orderNumber, reference, or email
  const recent = await fetchRecentSuccessfulPaystackOrders(secretKey, 100);
  return (
    recent.find(
      (ord) =>
        ord.orderNumber.toUpperCase() === upper ||
        ord.paymentReference.toUpperCase() === upper ||
        ord.customer.email.toLowerCase() === query.toLowerCase()
    ) || null
  );
}
