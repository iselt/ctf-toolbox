/** BigInt helpers for RSA-style math. */

export function bytesToBigInt(b: Uint8Array): bigint {
  if (b.length === 0) return 0n;
  let h = "0x";
  for (const x of b) h += x.toString(16).padStart(2, "0");
  return BigInt(h);
}

export function bigIntToBytes(n: bigint): Uint8Array {
  if (n < 0n) throw new Error("暂不支持负数");
  if (n === 0n) return new Uint8Array(0);
  let h = n.toString(16);
  if (h.length % 2 !== 0) h = "0" + h;
  const out = new Uint8Array(h.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
  return out;
}

/** Parse bigint from decimal / hex / bytes-hex input. */
export function parseBigInt(s: string): bigint {
  const t = s.trim().replace(/\s+/g, "");
  if (!t) throw new Error("空输入");
  if (/^0x[0-9a-f]+$/i.test(t)) return BigInt(t);
  if (/^[0-9]+$/.test(t)) return BigInt(t);
  if (/^[0-9a-f]+$/i.test(t) && t.length % 2 === 0) return BigInt("0x" + t);
  // maybe raw text
  const bytes = new TextEncoder().encode(t);
  return bytesToBigInt(bytes);
}

export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod === 1n) return 0n;
  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    b = (b * b) % mod;
    e >>= 1n;
  }
  return result;
}

export function modInv(a: bigint, m: bigint): bigint {
  let oldR = a % m;
  let r = m;
  let oldS = 1n;
  let s = 0n;
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== 1n) throw new Error("逆元不存在 (gcd != 1)");
  return ((oldS % m) + m) % m;
}

export function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) [a, b] = [b, a % b];
  return a < 0n ? -a : a;
}

export function isProbablePrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n]) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  // Miller-Rabin, 20 rounds
  let d = n - 1n;
  let r = 0n;
  while (d % 2n === 0n) {
    d /= 2n;
    r += 1n;
  }
  const randBig = (max: bigint): bigint => {
    const bits = max.toString(2).length;
    let v = 0n;
    const buf = new Uint32Array(Math.ceil(bits / 32));
    crypto.getRandomValues(buf);
    for (const w of buf) v = (v << 32n) | BigInt(w);
    return v % max;
  };
  for (let i = 0; i < 20; i++) {
    const a = randBig(n - 3n) + 2n;
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    let ok = false;
    for (let j = 1n; j < r; j++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        ok = true;
        break;
      }
    }
    if (!ok) return false;
  }
  return true;
}
