const UINT32_MAX_PLUS_ONE = 0x100000000;

function getCrypto(): Crypto {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Web Crypto API is required for tarot card randomization.');
  }

  return globalThis.crypto;
}

function randomUint32(): number {
  const value = new Uint32Array(1);
  getCrypto().getRandomValues(value);
  return value[0];
}

export function cryptoRandomInt(maxExclusive: number): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
    throw new Error('cryptoRandomInt requires a positive integer bound.');
  }

  const unbiasedLimit = Math.floor(UINT32_MAX_PLUS_ONE / maxExclusive) * maxExclusive;
  let value = randomUint32();

  while (value >= unbiasedLimit) {
    value = randomUint32();
  }

  return value % maxExclusive;
}

export function cryptoRandomBoolean(): boolean {
  return cryptoRandomInt(2) === 0;
}

export function cryptoShuffle<T>(items: T[]): T[] {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = cryptoRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}
