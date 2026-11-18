import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Order, OrderLineItem, OrderStatus, PaymentMethod } from './types.ts';

const PRIMARY_DATA_DIR = path.resolve(process.cwd(), 'data');
const FALLBACK_DATA_DIR = path.join(os.tmpdir(), 'bev-naturals-data');
const KV_ORDERS_KEY = 'bn_orders_v1';
let activeDataDir = PRIMARY_DATA_DIR;

let writeChain: Promise<void> = Promise.resolve();

function getKvConfig(): { url: string; token: string } | null {
  const url = (
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    ''
  ).trim();
  const token = (
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    ''
  ).trim();
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ''), token };
}

async function readOrdersFromKv(): Promise<Order[] | null> {
  const kv = getKvConfig();
  if (!kv) return null;
  try {
    const res = await fetch(`${kv.url}/get/${encodeURIComponent(KV_ORDERS_KEY)}`, {
      headers: { Authorization: `Bearer ${kv.token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: string | Order[] | null };
    if (!json || json.result === null || json.result === undefined) return [];
    const parsed = typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return null;
  }
}

async function writeOrdersToKv(orders: Order[]): Promise<void> {
  const kv = getKvConfig();
  if (!kv) return;
  try {
    await fetch(`${kv.url}/set/${encodeURIComponent(KV_ORDERS_KEY)}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kv.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(JSON.stringify(orders)),
    });
  } catch {
    // Non-fatal; disk store remains populated
  }
}

function getOrdersFilePath(): string {
  return path.join(activeDataDir, 'orders.json');
}

async function ensureStoreFile(): Promise<void> {
  try {
    await fs.mkdir(activeDataDir, { recursive: true });
    await fs.access(getOrdersFilePath()).catch(async () => {
      await fs.writeFile(getOrdersFilePath(), JSON.stringify([], null, 2), 'utf8');
    });
  } catch {
    activeDataDir = FALLBACK_DATA_DIR;
    await fs.mkdir(activeDataDir, { recursive: true });
    await fs.access(getOrdersFilePath()).catch(async () => {
      await fs.writeFile(getOrdersFilePath(), JSON.stringify([], null, 2), 'utf8');
    });
  }
}

async function readOrdersFromDisk(): Promise<Order[]> {
  await ensureStoreFile();
  const raw = await fs.readFile(getOrdersFilePath(), 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

export async function readOrders(): Promise<Order[]> {
  const kvOrders = await readOrdersFromKv();
  const diskOrders = await readOrdersFromDisk();
  if (kvOrders === null) return diskOrders;

  const byNumber = new Map<string, Order>();
  for (const ord of diskOrders) {
    byNumber.set(ord.orderNumber.toUpperCase(), ord);
  }
  for (const ord of kvOrders) {
    byNumber.set(ord.orderNumber.toUpperCase(), ord);
  }
  return Array.from(byNumber.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

async function writeOrders(orders: Order[]): Promise<void> {
  await ensureStoreFile();
  try {
    const ordersFile = getOrdersFilePath();
    const tmpFile = `${ordersFile}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(orders, null, 2), 'utf8');
    await fs.rename(tmpFile, ordersFile);
  } catch {
    activeDataDir = FALLBACK_DATA_DIR;
    await fs.mkdir(activeDataDir, { recursive: true });
    const fallbackFile = getOrdersFilePath();
    const tmpFile = `${fallbackFile}.tmp`;
    await fs.writeFile(tmpFile, JSON.stringify(orders, null, 2), 'utf8');
    await fs.rename(tmpFile, fallbackFile);
  }
  await writeOrdersToKv(orders);
}

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const next = writeChain.then(task, task);
  writeChain = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

export function generateOrderNumber(existingCount: number): string {
  const seq = String(1041 + existingCount).padStart(4, '0');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `BN-${seq}-${suffix}`;
}

export function generateVerificationCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i += 1) {
    code += letters[crypto.randomInt(0, letters.length)];
  }
  return code;
}

export interface CreateOrderInput {
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentChannel: string;
  verificationCode?: string;
  customer: Order['customer'];
  shipping: Order['shipping'];
  items: OrderLineItem[];
  subtotalNgn: number;
  discountNgn: number;
  discountLabel: string;
  deliveryFeeNgn: number;
  totalNgn: number;
}

export async function createOrderRecord(input: CreateOrderInput): Promise<Order> {
  return enqueueWrite(async () => {
    const orders = await readOrders();
    const now = new Date().toISOString();
    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: generateOrderNumber(orders.length),
      createdAt: now,
      updatedAt: now,
      status: 'awaiting_payment',
      paymentMethod: input.paymentMethod,
      paymentReference: input.paymentReference,
      paymentChannel: input.paymentChannel,
      customer: input.customer,
      shipping: input.shipping,
      items: input.items,
      subtotalNgn: input.subtotalNgn,
      discountNgn: input.discountNgn,
      discountLabel: input.discountLabel,
      totalNgn: input.totalNgn,
      deliveryFeeNgn: input.deliveryFeeNgn,
      studioNote: '',
      ...(input.verificationCode ? { verificationCode: input.verificationCode } : {}),
    };
    orders.unshift(order);
    await writeOrders(orders);
    return order;
  });
}

export async function findOrderByNumber(orderNumber: string): Promise<Order | undefined> {
  const orders = await readOrders();
  const normalized = orderNumber.trim().toUpperCase();
  return orders.find((o) => o.orderNumber.toUpperCase() === normalized);
}

export async function findOrderByPaymentReference(reference: string): Promise<Order | undefined> {
  const orders = await readOrders();
  return orders.find((o) => o.paymentReference === reference.trim());
}

export async function markOrderPaidByReference(
  reference: string,
  channel: string
): Promise<Order | null> {
  return enqueueWrite(async () => {
    const orders = await readOrders();
    const idx = orders.findIndex((o) => o.paymentReference === reference.trim());
    if (idx === -1) return null;
    const current = orders[idx];
    const updated: Order = {
      ...current,
      status: current.status === 'awaiting_payment' ? 'paid' : current.status,
      paymentChannel: channel || current.paymentChannel,
      updatedAt: new Date().toISOString(),
    };
    orders[idx] = updated;
    await writeOrders(orders);
    return updated;
  });
}

export async function updateOrderByNumber(
  orderNumber: string,
  patch: {
    status?: OrderStatus;
    deliveryFeeNgn?: number | null;
    studioNote?: string;
  }
): Promise<Order | null> {
  return enqueueWrite(async () => {
    const orders = await readOrders();
    const normalized = orderNumber.trim().toUpperCase();
    const idx = orders.findIndex((o) => o.orderNumber.toUpperCase() === normalized);
    if (idx === -1) return null;
    const current = orders[idx];
    const updated: Order = {
      ...current,
      status: patch.status ?? current.status,
      deliveryFeeNgn:
        patch.deliveryFeeNgn !== undefined ? patch.deliveryFeeNgn : current.deliveryFeeNgn,
      studioNote: patch.studioNote !== undefined ? patch.studioNote : current.studioNote,
      updatedAt: new Date().toISOString(),
    };
    orders[idx] = updated;
    await writeOrders(orders);
    return updated;
  });
}

export async function setOrderEmailFeedback(
  orderNumber: string,
  feedback: NonNullable<Order['emailFeedback']>
): Promise<Order | null> {
  return enqueueWrite(async () => {
    const orders = await readOrders();
    const normalized = orderNumber.trim().toUpperCase();
    const idx = orders.findIndex((o) => o.orderNumber.toUpperCase() === normalized);
    if (idx === -1) return null;
    const current = orders[idx];
    const updated: Order = {
      ...current,
      emailFeedback: feedback,
      updatedAt: new Date().toISOString(),
    };
    orders[idx] = updated;
    await writeOrders(orders);
    return updated;
  });
}

export async function upsertOrderFromPaystack(order: Order): Promise<Order> {
  return enqueueWrite(async () => {
    const orders = await readOrders();
    const idx = orders.findIndex(
      (o) =>
        o.paymentReference === order.paymentReference ||
        o.orderNumber.toUpperCase() === order.orderNumber.toUpperCase()
    );
    if (idx >= 0) {
      const merged: Order = {
        ...orders[idx],
        status: order.status,
        paymentChannel: order.paymentChannel || orders[idx].paymentChannel,
        updatedAt: new Date().toISOString(),
      };
      orders[idx] = merged;
      await writeOrders(orders);
      return merged;
    }
    orders.unshift(order);
    await writeOrders(orders);
    return order;
  });
}

export async function markOrderCodeCopied(
  orderNumber: string,
  verificationCode?: string,
  fallbackOrder?: Order
): Promise<Order | null> {
  return enqueueWrite(async () => {
    const orders = await readOrders();
    const normalized = orderNumber.trim().toUpperCase();
    const idx = orders.findIndex((o) => o.orderNumber.toUpperCase() === normalized);
    const now = new Date().toISOString();

    if (idx === -1) {
      if (
        fallbackOrder &&
        fallbackOrder.orderNumber?.trim().toUpperCase() === normalized &&
        fallbackOrder.paymentMethod === 'opay'
      ) {
        const restored: Order = {
          ...fallbackOrder,
          codeCopiedAt: fallbackOrder.codeCopiedAt || now,
          updatedAt: now,
        };
        orders.unshift(restored);
        await writeOrders(orders);
        return restored;
      }
      return null;
    }

    const current = orders[idx];
    if (
      verificationCode &&
      current.verificationCode &&
      current.verificationCode.toUpperCase() !== verificationCode.trim().toUpperCase()
    ) {
      return null;
    }
    const updated: Order = {
      ...current,
      codeCopiedAt: current.codeCopiedAt || now,
      updatedAt: now,
    };
    orders[idx] = updated;
    await writeOrders(orders);
    return updated;
  });
}

export async function upsertManualOrdersBatch(ordersToRestore: Order[]): Promise<Order[]> {
  return enqueueWrite(async () => {
    const orders = await readOrders();
    const byNumber = new Map<string, Order>();
    for (const ord of orders) {
      byNumber.set(ord.orderNumber.toUpperCase(), ord);
    }

    let changed = false;
    const now = new Date().toISOString();
    for (const candidate of ordersToRestore) {
      if (
        !candidate ||
        typeof candidate.orderNumber !== 'string' ||
        !candidate.orderNumber.trim() ||
        candidate.paymentMethod !== 'opay'
      ) {
        continue;
      }
      const key = candidate.orderNumber.trim().toUpperCase();
      const existing = byNumber.get(key);
      if (!existing) {
        byNumber.set(key, {
          ...candidate,
          codeCopiedAt: candidate.codeCopiedAt || now,
        });
        changed = true;
      } else if (!existing.codeCopiedAt && candidate.codeCopiedAt) {
        byNumber.set(key, {
          ...existing,
          codeCopiedAt: candidate.codeCopiedAt,
          updatedAt: now,
        });
        changed = true;
      }
    }

    const merged = Array.from(byNumber.values()).sort(
      (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
    );
    if (changed) {
      await writeOrders(merged);
    }
    return merged;
  });
}

