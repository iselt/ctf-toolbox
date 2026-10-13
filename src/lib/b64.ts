/** Encoding helpers: bytes <-> base64/base64url/base32/hex/binary etc. */

export const te = new TextEncoder();
export const td = new TextDecoder();
const tdStrict = new TextDecoder("utf-8", { fatal: true });

export function b64encode(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function b64decode(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function b64urlEncode(bytes: Uint8Array): string {
  return b64encode(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(s: string): Uint8Array {
  let t = s.replace(/-/g, "+").replace(/_/g, "/").replace(/\s+/g, "");
  while (t.length % 4 !== 0) t += "=";
  return b64decode(t);
}

const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes: Uint8Array): string {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  while (out.length % 8 !== 0) out += "=";
  return out;
}

export function base32Decode(s: string): Uint8Array {
  const clean = s.toUpperCase().replace(/=+$/, "").replace(/\s+/g, "");
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const c of clean) {
    const idx = B32.indexOf(c);
    if (idx === -1) throw new Error(`非法 Base32 字符: ${c}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export function toHex(bytes: Uint8Array, sep = ""): string {
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join(sep);
}

export function fromHex(s: string): Uint8Array {
  const clean = s.replace(/0x/gi, "").replace(/[\s,]+/g, "");
  if (clean.length === 0) return new Uint8Array(0);
  if (clean.length % 2 !== 0 || /[^0-9a-f]/i.test(clean)) throw new Error("非法十六进制输入");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

export function utf8(bytes: Uint8Array): string {
  return td.decode(bytes);
}

export function latin1(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return s;
}

export function toBinary(bytes: Uint8Array, sep = " "): string {
  return [...bytes].map((b) => b.toString(2).padStart(8, "0")).join(sep);
}

export function toDecimal(bytes: Uint8Array, sep = " "): string {
  return [...bytes].join(sep);
}

/** Hexdump view: offset / hex / ascii */
export function hexdump(bytes: Uint8Array, maxBytes = 4096): string {
  const lines: string[] = [];
  const n = Math.min(bytes.length, maxBytes);
  for (let i = 0; i < n; i += 16) {
    const row = bytes.subarray(i, Math.min(i + 16, n));
    const hex = [...row].map((b) => b.toString(16).padStart(2, "0")).join(" ").padEnd(47, " ");
    const ascii = [...row].map((b) => (b >= 0x20 && b < 0x7f ? String.fromCharCode(b) : ".")).join("");
    lines.push(`${i.toString(16).padStart(8, "0")}  ${hex}  |${ascii}|`);
  }
  if (bytes.length > n) lines.push(`… 共 ${bytes.length} 字节 (仅显示前 ${n})`);
  return lines.join("\n");
}

/** Treat each char's code point as a byte (mojibake fix / latin1). */
export function latin1ToBytes(s: string): Uint8Array {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) {
    const c = s.codePointAt(i)!;
    out[i] = c & 0xff;
    if (c > 0xff) throw new Error(`字符 U+${c.toString(16)} 超出单字节范围`);
  }
  return out;
}

export function unicodeEscape(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c > 0xffff) {
      const h = Math.floor((c - 0x10000) / 0x400) + 0xd800;
      const l = ((c - 0x10000) % 0x400) + 0xdc00;
      out += `\\u${h.toString(16).padStart(4, "0")}\\u${l.toString(16).padStart(4, "0")}`;
    } else {
      out += `\\u${c.toString(16).padStart(4, "0")}`;
    }
  }
  return out;
}

export function unicodeUnescape(s: string): string {
  return s.replace(/\\u\{([0-9a-f]+)\}|\\u([0-9a-f]{4})|\\x([0-9a-f]{2})/gi, (_m, br, u, x) => {
    const cp = br ? parseInt(br, 16) : u ? parseInt(u, 16) : parseInt(x, 16);
    return String.fromCodePoint(cp);
  });
}

const HTML_SPECIALS = '<>&"\'/';

export function htmlEntityEncode(s: string, all = false): string {
  return s.replace(/[\u0080-\uFFFF<>&"'/a-zA-Z0-9;]/g, (ch) => {
    if (!all && !HTML_SPECIALS.includes(ch)) return ch;
    if (!all) {
      const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;", "/": "&#47;" };
      return map[ch] ?? ch;
    }
    return `&#${ch.codePointAt(0)};`;
  });
}

export function htmlEntityDecode(s: string): string {
  const ta = document.createElement("textarea");
  ta.innerHTML = s;
  return ta.value;
}

export function tryUtf8(bytes: Uint8Array): string {
  try {
    return tdStrict.decode(bytes);
  } catch {
    return td.decode(bytes);
  }
}

/** Simple heuristic detection summary for a string. */
export function detectEncoding(s: string): string[] {
  const notes: string[] = [];
  const t = s.trim();
  if (!t) return notes;
  if (/^[0-9a-fA-F\s]+$/.test(t) && t.replace(/\s/g, "").length % 2 === 0 && t.replace(/\s/g, "").length >= 2)
    notes.push("看起来是 Hex (十六进制)");
  if (/^[A-Za-z0-9+/=\s]+$/.test(t) && t.length % 4 === (t.includes("=") ? 0 : t.length % 4) && /[A-Z]/.test(t) && t.length >= 8)
    notes.push("可能是 Base64");
  if (/^[A-Z2-7=\s]+$/.test(t) && t.length >= 8) notes.push("可能是 Base32");
  if (/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.?$/.test(t)) notes.push("这是一个 JWT (去 JWT 工具页!)");
  if (/^[01\s]+$/.test(t) && t.replace(/\s/g, "").length % 8 === 0) notes.push("看起来是二进制位串");
  if (/\\u[0-9a-fA-F]{4}/.test(t)) notes.push("含 \\uXXXX Unicode 转义");
  if (/&#?\w+;/.test(t)) notes.push("含 HTML 实体");
  if (/^\d{10}$/.test(t)) notes.push("10 位数字,可能是 Unix 时间戳(秒)");
  if (/^\d{13}$/.test(t)) notes.push("13 位数字,可能是 Unix 时间戳(毫秒)");
  return notes;
}
