const PASSWORD_HASH_PREFIX = 'sha256$';
const HASH_HEX_LENGTH = 64;

const toHex = (buffer: ArrayBuffer): string => {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const timingSafeEqual = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;

  let mismatch = 0;
  for (let index = 0; index < a.length; index += 1) {
    mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return mismatch === 0;
};

export const isPasswordHash = (value: string): boolean => {
  const normalized = String(value || '').trim().toLowerCase();
  return (
    normalized.startsWith(PASSWORD_HASH_PREFIX)
    && normalized.length === PASSWORD_HASH_PREFIX.length + HASH_HEX_LENGTH
    && /^[a-f0-9]+$/.test(normalized.slice(PASSWORD_HASH_PREFIX.length))
  );
};

export const hashPassword = async (plainText: string): Promise<string> => {
  const normalized = String(plainText || '');
  if (!normalized) {
    throw new Error('Password cannot be empty');
  }

  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure hashing is not available in this runtime');
  }

  const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
  return `${PASSWORD_HASH_PREFIX}${toHex(digest)}`;
};

export const verifyPassword = async (
  plainText: string,
  storedPassword: string
): Promise<{ matched: boolean; needsUpgrade: boolean }> => {
  const normalizedPlain = String(plainText || '');
  const normalizedStored = String(storedPassword || '').trim();

  if (!normalizedPlain || !normalizedStored) {
    return { matched: false, needsUpgrade: false };
  }

  if (isPasswordHash(normalizedStored)) {
    const expectedHash = normalizedStored.toLowerCase();
    const incomingHash = (await hashPassword(normalizedPlain)).toLowerCase();

    return {
      matched: timingSafeEqual(incomingHash, expectedHash),
      needsUpgrade: false
    };
  }

  const matched = timingSafeEqual(normalizedPlain, normalizedStored);
  return {
    matched,
    needsUpgrade: matched
  };
};
