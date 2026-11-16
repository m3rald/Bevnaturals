import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import { findProductAndVariant } from './catalog.ts';
import { PROMO_CONFIG, calculatePromoDiscount } from './promo.ts';
import { resolveShippingQuote } from './shipping.ts';
import { storeConfig } from './store-config.ts';
import {
  createStudioSessionToken,
  verifyStudioPin,
  verifyStudioSessionToken,
} from './admin.server.ts';
import { sendOrderReceiptEmails } from './mailer.server.ts';
import {
  fetchRecentSuccessfulPaystackOrders,
  findPaystackOrderByQuery,
  mapPaystackTxToOrder,
} from './paystack-lookup.server.ts';
import {
  createOrderRecord,
  findOrderByNumber,
  findOrderByPaymentReference,
  markOrderPaidByReference,
  readOrders,
  setOrderEmailFeedback,
  updateOrderByNumber,
  upsertOrderFromPaystack,
} from './orders.server.ts';
import type { Order, OrderLineItem, OrderStatus, PaymentMethod, PublicStoreConfig } from './types.ts';

function getPaystackSecretKey(): string {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || '';
}

function getPaystackPublicKey(): string {
  return process.env.VITE_PAYSTACK_PUBLIC_KEY?.trim() || '';
}

function getBaseUrl(req: express.Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && configured !== 'MY_APP_URL') {
    return configured.replace(/\/+$/, '');
  }
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
  return `${proto}://${host}`;
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!verifyStudioSessionToken(token)) {
    res.status(401).json({ error: 'Studio authorization required.' });
    return;
  }
  next();
}

export function createApiApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      paystackConfigured: Boolean(getPaystackSecretKey()),
    });
  });

  app.get('/api/config', (_req, res) => {
    const paystackSecret = getPaystackSecretKey();
    const payload: PublicStoreConfig = {
      brandName: storeConfig.brandName,
      email: storeConfig.email,
      location: storeConfig.location,
      opay: {
        enabled: storeConfig.opay.enabled,
        bankName: storeConfig.opay.bankName,
        accountName: storeConfig.opay.accountName,
        accountNumber: storeConfig.opay.accountNumber,
      },
      paystack: {
        enabled: storeConfig.paystack.enabled,
        mode: paystackSecret ? 'live' : 'sandbox',
        publicKey: getPaystackPublicKey(),
      },
      promo: {
        title: PROMO_CONFIG.title,
        discountPercent: PROMO_CONFIG.discountPercent,
        startsAtIso: PROMO_CONFIG.startsAtIso,
        endsAtIso: PROMO_CONFIG.endsAtIso,
      },
    };
    res.json(payload);
  });

  app.post('/api/orders', async (req, res) => {
    try {
      const body = req.body as {
        paymentMethod?: PaymentMethod;
        opaySenderName?: string;
        customer?: { fullName?: string; email?: string; phone?: string };
        shipping?: {
          address?: string;
          city?: string;
          state?: string;
          regionId?: string;
          methodId?: string;
          note?: string;
        };
        items?: Array<{ productId?: string; variantId?: string; quantity?: number }>;
      };

      const paymentMethod: PaymentMethod =
        body.paymentMethod === 'opay' && storeConfig.opay.enabled ? 'opay' : 'paystack';

      if (body.paymentMethod === 'opay' && !storeConfig.opay.enabled) {
        res.status(400).json({ error: 'This payment option is currently unavailable. Please use Paystack.' });
        return;
      }

      const fullName = body.customer?.fullName?.trim() || '';
      const email = body.customer?.email?.trim() || '';
      const phone = body.customer?.phone?.trim() || '';
      const address = body.shipping?.address?.trim() || '';
      const city = body.shipping?.city?.trim() || '';
      const state = body.shipping?.state?.trim() || '';
      const note = body.shipping?.note?.trim() || '';

      const shippingQuote = resolveShippingQuote({
        regionId: body.shipping?.regionId,
        state,
        methodId: body.shipping?.methodId,
      });

      if (!fullName || !email || !phone || !address || !city || !shippingQuote) {
        res.status(400).json({ error: 'Please complete all required customer and regional shipping fields.' });
        return;
      }

      if (!Array.isArray(body.items) || body.items.length === 0) {
        res.status(400).json({ error: 'Your shopping bag is empty.' });
        return;
      }

      const verifiedItems: OrderLineItem[] = [];
      let subtotalNgn = 0;

      for (const rawItem of body.items) {
        const qty = Number(rawItem.quantity);
        if (!rawItem.productId || !rawItem.variantId || !Number.isInteger(qty) || qty < 1 || qty > 50) {
          res.status(400).json({ error: 'Invalid bag item quantity.' });
          return;
        }
        const match = findProductAndVariant(rawItem.productId, rawItem.variantId);
        if (!match || !match.variant.inStock) {
          res.status(400).json({ error: 'One or more selected products are unavailable.' });
          return;
        }
        const lineTotalNgn = match.variant.priceNgn * qty;
        subtotalNgn += lineTotalNgn;
        verifiedItems.push({
          productId: match.product.id,
          productName: match.product.name,
          variantId: match.variant.id,
          sizeLabel: match.variant.sizeLabel,
          unitPriceNgn: match.variant.priceNgn,
          quantity: qty,
          lineTotalNgn,
        });
      }

      const refSuffix = crypto.randomBytes(4).toString('hex').toUpperCase();
      const paymentReference =
        paymentMethod === 'paystack' ? `BN-PS-${Date.now()}-${refSuffix}` : `BN-OP-${Date.now()}-${refSuffix}`;

      const opaySender = body.opaySenderName?.trim();
      const paymentChannel =
        paymentMethod === 'opay'
          ? opaySender
            ? `OPay Transfer (${opaySender})`
            : 'OPay Transfer · 6419555143'
          : 'Paystack Checkout (Pending)';

      const promo = calculatePromoDiscount(subtotalNgn, new Date());
      const deliveryFeeNgn = shippingQuote.method.feeNgn;
      const finalPayableNgn = promo.totalNgn + deliveryFeeNgn;

      const order = await createOrderRecord({
        paymentMethod,
        paymentReference,
        paymentChannel,
        customer: { fullName, email, phone },
        shipping: {
          address,
          city,
          state: shippingQuote.state,
          regionId: shippingQuote.region.id,
          regionLabel: shippingQuote.region.label,
          methodId: shippingQuote.method.id,
          methodLabel: shippingQuote.method.label,
          note,
        },
        items: verifiedItems,
        subtotalNgn,
        discountNgn: promo.discountNgn,
        discountLabel: promo.discountLabel,
        deliveryFeeNgn,
        totalNgn: finalPayableNgn,
      });

      if (paymentMethod === 'opay') {
        res.status(201).json({ order });
        return;
      }

      const secretKey = getPaystackSecretKey();
      const publicKey = getPaystackPublicKey();

      if (!secretKey) {
        res.status(503).json({
          error:
            'Paystack live secret key is not configured on the server. Add PAYSTACK_SECRET_KEY in environment settings.',
        });
        return;
      }

      const baseUrl = getBaseUrl(req);
      const callbackUrl = `${baseUrl}/order/${encodeURIComponent(order.orderNumber)}?verify=paystack`;
      const itemsSummary = verifiedItems
        .map((item) => `${item.productName} (${item.sizeLabel}) x ${item.quantity}`)
        .join(', ');

      const psRes = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: finalPayableNgn * 100,
          currency: 'NGN',
          reference: paymentReference,
          callback_url: callbackUrl,
          metadata: {
            orderNumber: order.orderNumber,
            customerName: fullName,
            customerEmail: email,
            customerPhone: phone,
            address,
            city,
            state: shippingQuote.state,
            regionId: shippingQuote.region.id,
            regionLabel: shippingQuote.region.label,
            methodId: shippingQuote.method.id,
            shippingMethod: shippingQuote.method.label,
            shippingFeeNgn: deliveryFeeNgn,
            subtotalNgn,
            discountNgn: promo.discountNgn,
            discountLabel: promo.discountLabel,
            note,
            itemsSummary,
            items: verifiedItems,
            custom_fields: [
              { display_name: 'Order Number', variable_name: 'order_number', value: order.orderNumber },
              { display_name: 'Customer Name', variable_name: 'customer_name', value: fullName },
              { display_name: 'Phone Number', variable_name: 'customer_phone', value: phone },
              {
                display_name: 'Delivery Address',
                variable_name: 'delivery_address',
                value: `${address}, ${city}, ${shippingQuote.state}`,
              },
              {
                display_name: 'Shipping Method',
                variable_name: 'shipping_method',
                value: `${shippingQuote.method.label} (₦${deliveryFeeNgn.toLocaleString('en-NG')})`,
              },
              { display_name: 'Items Ordered', variable_name: 'items', value: itemsSummary },
              ...(note
                ? [{ display_name: 'Delivery Note', variable_name: 'delivery_note', value: note }]
                : []),
            ],
          },
        }),
      });

      const psJson = (await psRes.json()) as {
        status?: boolean;
        message?: string;
        data?: { authorization_url: string; access_code: string; reference: string };
      };

      if (!psRes.ok || !psJson.status || !psJson.data) {
        res.status(502).json({
          error: psJson.message || 'Unable to initialize Paystack transaction.',
        });
        return;
      }

      res.status(201).json({
        order,
        paystack: {
          mode: 'live',
          authorizationUrl: psJson.data.authorization_url,
          accessCode: psJson.data.access_code,
          reference: psJson.data.reference,
          amountKobo: finalPayableNgn * 100,
          publicKey,
        },
      });
    } catch (err) {
      console.error('Order creation failed:', err);
      res.status(500).json({ error: 'Unable to create order right now.' });
    }
  });

  app.post('/api/paystack/verify', async (req, res) => {
    try {
      const body = req.body as { reference?: string; sandboxChannel?: string };
      const reference = body.reference?.trim() || '';
      if (!reference) {
        res.status(400).json({ error: 'Payment reference is required.' });
        return;
      }

      const existing = await findOrderByPaymentReference(reference);

      if (existing && existing.status !== 'awaiting_payment') {
        res.json({ verified: true, order: existing });
        return;
      }

      const secretKey = getPaystackSecretKey();

      if (!secretKey) {
        res.status(503).json({
          verified: false,
          error: 'Paystack live secret key is not configured on the server.',
        });
        return;
      }

      const psRes = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${secretKey}`,
          },
        }
      );
      const psJson = (await psRes.json()) as {
        status?: boolean;
        message?: string;
        data?: {
          id?: number;
          reference?: string;
          status?: string;
          amount?: number;
          channel?: string;
          paid_at?: string;
          created_at?: string;
          authorization?: { last4?: string; brand?: string };
          customer?: {
            email?: string;
            first_name?: string | null;
            last_name?: string | null;
            phone?: string | null;
          };
          metadata?: Record<string, unknown> | string | null;
        };
      };

      if (!psRes.ok || !psJson.status || psJson.data?.status !== 'success') {
        res.status(402).json({
          verified: false,
          error: psJson.message || 'Paystack transaction has not been completed.',
        });
        return;
      }

      if (existing) {
        const payableNgn = existing.totalNgn ?? existing.subtotalNgn;
        const expectedKobo = payableNgn * 100;
        if ((psJson.data.amount || 0) < expectedKobo) {
          res.status(402).json({
            verified: false,
            error: 'Verified Paystack amount is less than order total.',
          });
          return;
        }
      }

      const brand = psJson.data.authorization?.brand?.toUpperCase();
      const last4 = psJson.data.authorization?.last4;
      const channelLabel =
        brand && last4
          ? `Paystack (${brand} •••• ${last4})`
          : `Paystack (${psJson.data.channel || 'Verified'})`;

      let updated: Order | null = null;
      if (existing) {
        updated = await markOrderPaidByReference(reference, channelLabel);
      } else {
        const reconstructed = mapPaystackTxToOrder(psJson.data);
        if (!reconstructed) {
          res.status(404).json({ error: 'Order matching this Paystack reference was not found.' });
          return;
        }
        updated = await upsertOrderFromPaystack(reconstructed);
      }

      if (updated && !updated.emailFeedback?.sentAt) {
        const feedback = await sendOrderReceiptEmails(updated);
        updated = (await setOrderEmailFeedback(updated.orderNumber, feedback)) || {
          ...updated,
          emailFeedback: feedback,
        };
      }

      res.json({ verified: true, order: updated });
    } catch (err) {
      console.error('Paystack verification error:', err);
      res.status(500).json({ error: 'Unable to verify Paystack payment.' });
    }
  });

  app.get('/api/orders/:orderNumber', async (req, res) => {
    const query = req.params.orderNumber.trim();
    let order = await findOrderByNumber(query);

    if (!order || order.status === 'awaiting_payment') {
      const secretKey = getPaystackSecretKey();
      const psOrder = await findPaystackOrderByQuery(
        secretKey,
        order?.paymentReference || query
      );
      if (psOrder && psOrder.status === 'paid') {
        order = await upsertOrderFromPaystack(psOrder);
        if (!order.emailFeedback?.sentAt) {
          const feedback = await sendOrderReceiptEmails(order);
          order = (await setOrderEmailFeedback(order.orderNumber, feedback)) || {
            ...order,
            emailFeedback: feedback,
          };
        }
      }
    }

    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order });
  });

  app.get('/api/orders-lookup', async (req, res) => {
    try {
      const rawQuery = String(req.query.q || '').trim();
      if (!rawQuery) {
        res.status(400).json({ error: 'Please paste an order number or Paystack reference.' });
        return;
      }

      const upper = rawQuery.toUpperCase();
      const localOrders = await readOrders();
      let matched =
        localOrders.find(
          (o) =>
            o.orderNumber.toUpperCase() === upper ||
            o.paymentReference.toUpperCase() === upper
        ) || null;

      if (!matched || matched.status === 'awaiting_payment') {
        const secretKey = getPaystackSecretKey();
        const remote = await findPaystackOrderByQuery(
          secretKey,
          matched?.paymentReference || rawQuery
        );
        if (remote) {
          matched =
            remote.status === 'paid'
              ? await upsertOrderFromPaystack(remote)
              : remote;
        }
      }

      if (!matched) {
        res.status(404).json({
          error: `No verified order found for "${rawQuery}". Check the order number (e.g. BN-1041-XXXX) or Paystack reference and try again.`,
        });
        return;
      }

      res.json({ order: matched });
    } catch (err) {
      console.error('Order lookup error:', err);
      res.status(500).json({ error: 'Unable to look up order right now.' });
    }
  });

  app.get('/api/orders-history', async (_req, res) => {
    try {
      const localOrders = await readOrders();
      const secretKey = getPaystackSecretKey();
      const paystackOrders = await fetchRecentSuccessfulPaystackOrders(secretKey, 100);

      const byKey = new Map<string, Order>();

      for (const ord of localOrders) {
        if (ord.status !== 'awaiting_payment') {
          byKey.set(ord.paymentReference || ord.orderNumber, ord);
        }
      }

      for (const psOrd of paystackOrders) {
        const existingByRef = byKey.get(psOrd.paymentReference);
        const existingByNum = Array.from(byKey.values()).find(
          (o) => o.orderNumber.toUpperCase() === psOrd.orderNumber.toUpperCase()
        );
        if (!existingByRef && !existingByNum) {
          byKey.set(psOrd.paymentReference || psOrd.orderNumber, psOrd);
        }
      }

      const merged = Array.from(byKey.values()).sort(
        (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
      );

      res.json({ orders: merged });
    } catch (err) {
      console.error('Order history error:', err);
      res.status(500).json({ error: 'Unable to load previous purchases right now.' });
    }
  });

  app.post('/api/admin/auth', (req, res) => {
    const body = req.body as { pin?: string };
    const pin = body.pin || '';
    if (!verifyStudioPin(pin)) {
      res.status(401).json({ error: 'Incorrect Studio PIN.' });
      return;
    }
    const token = createStudioSessionToken();
    res.json({ token });
  });

  app.get('/api/admin/orders', requireAdmin, async (_req, res) => {
    const orders = await readOrders();
    res.json({ orders });
  });

  app.patch('/api/admin/orders/:orderNumber', requireAdmin, async (req, res) => {
    const body = req.body as {
      status?: OrderStatus;
      deliveryFeeNgn?: number | null;
      studioNote?: string;
    };
    const allowedStatuses: OrderStatus[] = ['awaiting_payment', 'paid', 'preparing', 'shipped'];
    if (body.status && !allowedStatuses.includes(body.status)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    if (
      body.deliveryFeeNgn !== undefined &&
      body.deliveryFeeNgn !== null &&
      (!Number.isFinite(body.deliveryFeeNgn) || body.deliveryFeeNgn < 0)
    ) {
      res.status(400).json({ error: 'Invalid delivery fee amount.' });
      return;
    }

    const updated = await updateOrderByNumber(req.params.orderNumber, {
      status: body.status,
      deliveryFeeNgn: body.deliveryFeeNgn,
      studioNote: body.studioNote,
    });

    if (!updated) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    res.json({ order: updated });
  });

  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  return app;
}
