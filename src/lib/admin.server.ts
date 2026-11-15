import crypto from 'node:crypto';

const DEFAULT_STUDIO_PIN = 'Ibadanbev';

export function getStudioPin(): string {
  return process.env.STUDIO_PIN?.trim() || DEFAULT_STUDIO_PIN;
}

function getSigningSecret(): string {
  return (
    process.env.SESSION_SECRET?.trim() ||
    process.env.PAYSTACK_SECRET_KEY?.trim() ||
    'bev-naturals-ibadan-studio-ledger-key'
  );
}

export function verifyStudioPin(candidate: string): boolean {
  const expected = getStudioPin();
  const a = Buffer.from(candidate.trim(), 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createStudioSessionToken(): string {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
  const payload = Buffer.from(JSON.stringify({ role: 'studio', exp: expiresAt })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyStudioSessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSigningSecret())
    .update(payload)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf8');
  const expectedBuf = Buffer.from(expectedSig, 'utf8');
  if (sigBuf.length !== expectedBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      role?: string;
      exp?: number;
    };
    return parsed.role === 'studio' && typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}
