import { createHmac, timingSafeEqual } from 'node:crypto';
export function verifyHmacSignature(payload: string, signature: string, secret: string, algorithm: 'sha256' | 'sha512' = 'sha256'): boolean {
  const expected = createHmac(algorithm, secret).update(payload).digest('hex');
  const a = Buffer.from(signature); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export function createHmacSignature(payload: string, secret: string, algorithm: 'sha256' | 'sha512' = 'sha256'): string {
  return createHmac(algorithm, secret).update(payload).digest('hex');
}
