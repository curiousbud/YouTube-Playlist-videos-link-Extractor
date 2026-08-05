// Session-cookie helpers for the site-wide password gate.
//
// This module is shared between `proxy.ts` (runs at the network edge) and the
// `/api/login` route handler, so it must only use APIs available in both — the
// Web Crypto global (`crypto.subtle`) and `atob`/`btoa`. No Node-only imports.
//
// Sessions are tamper-proof: the cookie value is `payload.signature` where
// payload is a JSON `{ sub, exp }` and the signature is an HMAC-SHA256 over it
// keyed with `SESSION_SECRET` (or a value derived from `SITE_PASSWORD`).
// Without the secret, an attacker cannot forge a valid cookie.

export const AUTH_COOKIE = 'yt_extractor_session';

export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
export const SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_MS / 1000);

interface SessionPayload {
  sub: 'owner';
  exp: number; // epoch milliseconds
}

// The HMAC key. Prefer a dedicated, randomly generated SESSION_SECRET; when it
// is unset we derive one from SITE_PASSWORD so the feature works out of the
// box. Deriving is slightly weaker (knowing the password lets you forge a
// cookie), but anyone with the password can log in anyway, so the practical
// risk is the same. Returns null when no password is configured at all.
async function getSigningKey(): Promise<CryptoKey | null> {
  const secret = process.env.SESSION_SECRET || process.env.SITE_PASSWORD || '';
  if (!secret) return null;
  const data = new TextEncoder().encode(`yt-extractor-session:${secret}`);
  return crypto.subtle.importKey('raw', data, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  // Back the view with an explicit ArrayBuffer so the returned type satisfies
  // `BufferSource` (the TS 5.7+ generic Uint8Array otherwise infers
  // `ArrayBufferLike`, which crypto.subtle.verify rejects).
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// Create a fresh signed session token, or null when no password is configured.
export async function createSessionToken(): Promise<string | null> {
  const key = await getSigningKey();
  if (!key) return null;

  const payload: SessionPayload = { sub: 'owner', exp: Date.now() + SESSION_TTL_MS };
  const payloadStr = JSON.stringify(payload);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadStr));

  return `${base64UrlEncode(new TextEncoder().encode(payloadStr))}.${base64UrlEncode(new Uint8Array(signature))}`;
}

// Verify that a cookie value carries a valid signature and has not expired.
// The signature is checked against the exact payload bytes from the cookie
// (no re-encoding), and `crypto.subtle.verify` compares in constant time.
export async function verifySessionToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const key = await getSigningKey();
  if (!key) return false;

  const [payloadB64, signatureB64] = token.split('.');
  if (!payloadB64 || !signatureB64) return false;

  let payload: SessionPayload;
  let payloadStr: string;
  try {
    payloadStr = new TextDecoder().decode(base64UrlDecode(payloadB64));
    payload = JSON.parse(payloadStr);
  } catch {
    return false;
  }

  if (payload?.sub !== 'owner' || typeof payload.exp !== 'number' || payload.exp < Date.now()) {
    return false;
  }

  try {
    return await crypto.subtle.verify(
      'HMAC',
      key,
      base64UrlDecode(signatureB64),
      new TextEncoder().encode(payloadStr)
    );
  } catch {
    return false;
  }
}

// Constant-time password comparison: both inputs are hashed first, so length
// differences do not leak, and the digests are compared byte-by-byte without
// short-circuiting. Good enough for a single-user gate.
export async function constantTimeEqual(a: string, b: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [hashA, hashB] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ]);
  const bytesA = new Uint8Array(hashA);
  const bytesB = new Uint8Array(hashB);

  let diff = 0;
  for (let i = 0; i < bytesA.length; i++) diff |= bytesA[i] ^ bytesB[i];
  return diff === 0;
}

// Cookie options shared by the login/logout routes so the session cookie is
// always set the same way.
export const sessionCookieOptions = {
  httpOnly: true, // never readable from JavaScript (XSS-safe)
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production', // HTTPS-only in production
  path: '/',
};
