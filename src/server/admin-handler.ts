import type { BoardStore } from './board-handler';

/**
 * Admin auth + credential management. Credentials are stored in the
 * SAME KV namespace that holds board posts (`BOARD`), under the key
 * `admin:credentials`, as JSON:
 *
 *   { username, salt (hex), hash (hex), iterations, updatedAt }
 *
 * Until a teacher changes them, the defaults below are accepted. Once
 * the teacher saves a new password, the record is created and the
 * defaults stop working — that's the lock-in moment.
 *
 * Trust model: HTTPS in transit (Cloudflare); password sent as Basic
 * auth on every admin request; PBKDF2-SHA-256 with 100k iterations at
 * rest. This is appropriate for a single-teacher classroom tool. It
 * is NOT designed for multi-tenant or hostile environments.
 */

const CREDS_KEY = 'admin:credentials';
const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;

export const DEFAULT_USERNAME = 'admin';
export const DEFAULT_PASSWORD = 'admin123';

interface StoredCredentials {
  username: string;
  salt: string;
  hash: string;
  iterations: number;
  updatedAt: number;
}

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminAuthError';
  }
}

export class AdminValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AdminValidationError';
  }
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.length % 2 === 0 ? hex : '0' + hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

async function pbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  // TS narrows Uint8Array to ArrayBufferLike-backed; SubtleCrypto wants
  // ArrayBuffer-backed. Copy through a fresh ArrayBuffer to satisfy
  // the type checker without changing the bytes.
  const passwordBuf = new TextEncoder().encode(password).slice().buffer;
  const saltBuf = salt.slice().buffer;
  const key = await crypto.subtle.importKey(
    'raw',
    passwordBuf,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations, hash: 'SHA-256' },
    key,
    HASH_BITS
  );
  return new Uint8Array(bits);
}

/** Constant-time-ish comparison. Length check first (which leaks length but
 *  both sides are fixed-size hashes here) then a full XOR sweep. */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function readStoredCreds(
  store: BoardStore
): Promise<StoredCredentials | null> {
  const raw = await store.get(CREDS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredCredentials;
    if (
      !parsed ||
      typeof parsed.username !== 'string' ||
      typeof parsed.salt !== 'string' ||
      typeof parsed.hash !== 'string' ||
      typeof parsed.iterations !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function writeStoredCreds(
  store: BoardStore,
  username: string,
  password: string
): Promise<StoredCredentials> {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
  const record: StoredCredentials = {
    username,
    salt: bytesToHex(salt),
    hash: bytesToHex(hash),
    iterations: PBKDF2_ITERATIONS,
    updatedAt: Date.now(),
  };
  await store.put(CREDS_KEY, JSON.stringify(record));
  return record;
}

/**
 * Verify (username, password) against KV. If KV has no record yet,
 * fall back to the defaults — that's the bootstrap path before a
 * teacher saves their own credentials.
 */
export async function verifyCredentials(
  store: BoardStore,
  username: string,
  password: string
): Promise<boolean> {
  if (!username || !password) return false;
  const stored = await readStoredCreds(store);
  if (!stored) {
    return username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD;
  }
  if (username !== stored.username) return false;
  const salt = hexToBytes(stored.salt);
  const expected = hexToBytes(stored.hash);
  const actual = await pbkdf2(password, salt, stored.iterations);
  return constantTimeEqual(actual, expected);
}

/**
 * Parse `Authorization: Basic <base64(user:pass)>` and verify it.
 * Throws AdminAuthError on any failure.
 */
export async function requireAdmin(
  store: BoardStore,
  authHeader: string | null | undefined
): Promise<void> {
  if (!authHeader || !authHeader.toLowerCase().startsWith('basic ')) {
    throw new AdminAuthError('Missing or malformed Authorization header.');
  }
  const encoded = authHeader.slice(6).trim();
  let decoded: string;
  try {
    decoded = atob(encoded);
  } catch {
    throw new AdminAuthError('Authorization header is not valid base64.');
  }
  const sep = decoded.indexOf(':');
  if (sep < 0) throw new AdminAuthError('Authorization header missing colon.');
  const username = decoded.slice(0, sep);
  const password = decoded.slice(sep + 1);
  const ok = await verifyCredentials(store, username, password);
  if (!ok) throw new AdminAuthError('Invalid username or password.');
}

/**
 * Change credentials. Caller must have already verified the OLD
 * password (typically via requireAdmin on the request). We re-verify
 * here too as defense-in-depth in case the caller is wired wrong.
 */
export async function updateCredentials(
  store: BoardStore,
  input: {
    currentUsername: string;
    currentPassword: string;
    newUsername: string;
    newPassword: string;
  }
): Promise<{ updatedAt: number; username: string }> {
  const ok = await verifyCredentials(
    store,
    input.currentUsername,
    input.currentPassword
  );
  if (!ok) throw new AdminAuthError('Current password is incorrect.');

  const username = (input.newUsername ?? '').trim();
  const password = input.newPassword ?? '';
  if (!username) throw new AdminValidationError('Username is required.');
  if (username.length > 40) {
    throw new AdminValidationError('Username must be 40 characters or fewer.');
  }
  if (password.length < 6) {
    throw new AdminValidationError(
      'New password must be at least 6 characters.'
    );
  }
  if (password.length > 200) {
    throw new AdminValidationError(
      'New password must be 200 characters or fewer.'
    );
  }

  const record = await writeStoredCreds(store, username, password);
  return { updatedAt: record.updatedAt, username: record.username };
}

/** Whether the admin record has been initialised (i.e. teacher has
 *  changed away from defaults). Useful for the UI to nag on first
 *  login. */
export async function isUsingDefaults(store: BoardStore): Promise<boolean> {
  const stored = await readStoredCreds(store);
  return stored === null;
}
