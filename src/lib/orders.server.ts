import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Order, OrderLineItem, OrderStatus, PaymentMethod } from './types.ts';

const PRIMARY_DATA_DIR = path.resolve(process.cwd(), 'data');
const FALLBACK_DATA_DIR = path.join(os.tmpdir(), 'bev-naturals-data');
let activeDataDir = PRIMARY_DATA_DIR;

let writeChain: Promise<void> = Promise.resolve();

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

export async function readOrders(): Promise<Order[]> {
  await ensureStoreFile();
  const raw = await fs.readFile(getOrdersFilePath(), 'utf8');
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Order[]) : [];
  } catch {
    return [];
  }
}

async function writeOrders(orders: Order[]): Promise<void> {
  await ensureStoreFile();
  const ordersFile = getOrdersFilePath();
  const tmpFile = `${ordersFile}.tmp`;
  await fs.writeFile(tmpFile, JSON.stringify(orders, null, 2), 'utf8');
  await fs.rename(tmpFile, ordersFile);
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

export interface CreateOrderInput {
  paymentMethod: PaymentMethod;
  paymentReference: string;
  paymentChannel: string;
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
