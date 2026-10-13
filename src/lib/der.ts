/** Minimal DER / PEM parsing for RSA keys. */

export interface DerNode {
  tag: number;
  content: Uint8Array;
  children: DerNode[];
}

function readDer(buf: Uint8Array, pos: number): { node: DerNode; next: number } | null {
  if (pos + 2 > buf.length) return null;
  const tag = buf[pos];
  let len = buf[pos + 1];
  let hdr = 2;
  if (len & 0x80) {
    const n = len & 0x7f;
    if (n === 0 || pos + 2 + n > buf.length) return null;
    len = 0;
    for (let i = 0; i < n; i++) len = len * 256 + buf[pos + 2 + i];
    hdr = 2 + n;
  }
  if (pos + hdr + len > buf.length) return null;
  const content = buf.subarray(pos + hdr, pos + hdr + len);
  const children: DerNode[] = [];
  if (tag === 0x30 || tag === 0x31) {
    let p = 0;
    while (p < content.length) {
      const r = readDer(content, p);
      if (!r) break;
      children.push(r.node);
      p = r.next;
    }
  }
  return { node: { tag, content, children }, next: pos + hdr + len };
}

export function parseDer(buf: Uint8Array): DerNode | null {
  const r = readDer(buf, 0);
  return r ? r.node : null;
}

export function pemToDer(pem: string): Uint8Array | null {
  const b64 = pem
    .replace(/-----BEGIN [^-]+-----/, "")
    .replace(/-----END [^-]+-----/, "")
    .replace(/\s+/g, "");
  if (!b64) return null;
  try {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

export interface RsaPublic {
  n: bigint;
  e: bigint;
}

export interface RsaPrivate extends RsaPublic {
  d?: bigint;
  p?: bigint;
  q?: bigint;
  dp?: bigint;
  dq?: bigint;
  qinv?: bigint;
}

function intAt(node: DerNode | undefined, i: number): bigint | undefined {
  const c = node?.children[i];
  if (!c || c.tag !== 0x02) return undefined;
  let h = "0x";
  for (const b of c.content) h += b.toString(16).padStart(2, "0");
  return h === "0x" ? 0n : BigInt(h);
}

export function parseRsaPublic(der: Uint8Array): RsaPublic | null {
  const root = parseDer(der);
  if (!root || root.tag !== 0x30) return null;
  // SPKI: SEQ { SEQ{OID,...}, BITSTRING { SEQ { n, e } } }
  const bit = root.children[1];
  if (bit && bit.tag === 0x03) {
    const inner = bit.content.subarray(1); // skip unused-bits byte
    const seq = parseDer(inner);
    if (seq && seq.children.length >= 2) {
      const n = intAt(seq, 0);
      const e = intAt(seq, 1);
      if (n !== undefined && e !== undefined) return { n, e };
    }
  }
  // bare PKCS#1 public: SEQ { n, e }
  if (root.children.length >= 2 && root.children[0].tag === 0x02) {
    const n = intAt(root, 0);
    const e = intAt(root, 1);
    if (n !== undefined && e !== undefined) return { n, e };
  }
  return null;
}

export function parseRsaPrivate(der: Uint8Array): RsaPrivate | null {
  const root = parseDer(der);
  if (!root || root.tag !== 0x30) return null;

  const fromPkcs1 = (seq: DerNode): RsaPrivate | null => {
    if (seq.children.length < 3 || seq.children[0].tag !== 0x02) return null;
    const n = intAt(seq, 1);
    const e = intAt(seq, 2);
    if (n === undefined || e === undefined) return null;
    return {
      n,
      e,
      d: intAt(seq, 3),
      p: intAt(seq, 4),
      q: intAt(seq, 5),
      dp: intAt(seq, 6),
      dq: intAt(seq, 7),
      qinv: intAt(seq, 8),
    };
  };

  // PKCS#8: SEQ { version, SEQ{OID..}, OCTETSTRING { PKCS#1 } }
  const octet = root.children.find((c) => c.tag === 0x04);
  if (octet && root.children.length >= 3 && root.children[1].tag === 0x30) {
    const inner = parseDer(octet.content);
    if (inner) {
      const r = fromPkcs1(inner);
      if (r) return r;
    }
  }
  // direct PKCS#1
  return fromPkcs1(root);
}
