import { el, copyBtn } from "../ui";
import { te, b64encode, fromHex, toHex, tryUtf8 } from "../lib/b64";

function caesar(s: string, shift: number): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + shift + 26) % 26) + base);
  });
}

function atbash(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(base + 25 - (c.charCodeAt(0) - base));
  });
}

function vigenere(s: string, key: string, decode: boolean): string {
  const k = key.replace(/[^a-zA-Z]/g, "").toLowerCase();
  if (!k) return s;
  let ki = 0;
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    const shift = k.charCodeAt(ki % k.length) - 97;
    ki++;
    const eff = decode ? 26 - shift : shift;
    return String.fromCharCode(((c.charCodeAt(0) - base + eff) % 26) + base);
  });
}

function rot47(s: string): string {
  return s.replace(/[!-~]/g, (c) => String.fromCharCode(33 + ((c.charCodeAt(0) + 14) % 94)));
}

function xorBytes(data: Uint8Array, key: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ key[i % key.length];
  return out;
}

function printableScore(b: Uint8Array): number {
  let n = 0;
  for (const x of b) if ((x >= 0x20 && x < 0x7f) || x === 0x0a || x === 0x0d || x === 0x09) n++;
  return n / b.length;
}

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  // ---------- Caesar / ROT ----------
  const caesarCard = el(`<div class="card">
    <h3> 凯撒 / ROT-N <span class="muted tag">凯撒位移暴力破解</span></h3>
    <textarea id="caesar-in" placeholder="密文..."></textarea>
    <div class="btnrow">
      <input type="number" id="caesar-n" value="13" min="0" max="25" style="width:70px">
      <button class="btn" id="caesar-run">位移</button>
      <button class="btn" id="rot13-btn">ROT13</button>
      <button class="btn" id="rot47-btn">ROT47</button>
      <button class="btn" id="atbash-btn">Atbash</button>
    </div>
    <pre class="code" id="caesar-out"></pre>
    <div class="small muted" style="margin:8px 0 4px">全部 25 种位移:</div>
    <div id="caesar-brute" class="small"></div>
  </div>`);
  root.appendChild(caesarCard);

  const cIn = caesarCard.querySelector("#caesar-in") as HTMLTextAreaElement;
  const cOut = caesarCard.querySelector("#caesar-out") as HTMLElement;
  const cBrute = caesarCard.querySelector("#caesar-brute") as HTMLElement;

  function runCaesar(): void {
    const s = cIn.value;
    const n = parseInt((caesarCard.querySelector("#caesar-n") as HTMLInputElement).value, 10) || 0;
    cOut.textContent = caesar(s, n);
    cBrute.innerHTML = "";
    for (let i = 1; i <= 25; i++) {
      const row = el(`<div class="row" style="padding:2px 0">
        <span class="badge">${i}</span>
        <span class="mono" style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${caesar(s, i)}</span>
      </div>`);
      row.title = caesar(s, i);
      cBrute.appendChild(row);
    }
  }
  (caesarCard.querySelector("#caesar-run") as HTMLElement).addEventListener("click", () => runCaesar());
  (caesarCard.querySelector("#rot13-btn") as HTMLElement).addEventListener("click", () => {
    cOut.textContent = caesar(cIn.value, 13);
  });
  (caesarCard.querySelector("#rot47-btn") as HTMLElement).addEventListener("click", () => {
    cOut.textContent = rot47(cIn.value);
  });
  (caesarCard.querySelector("#atbash-btn") as HTMLElement).addEventListener("click", () => {
    cOut.textContent = atbash(cIn.value);
  });
  cIn.addEventListener("input", runCaesar);

  // ---------- Vigenère ----------
  const vigCard = el(`<div class="card">
    <h3> Vigenère 维吉尼亚</h3>
    <div class="row">
      <input type="text" id="vig-key" placeholder="密钥 key" style="width:180px">
      <button class="btn" id="vig-enc">加密</button>
      <button class="btn" id="vig-dec">解密</button>
    </div>
    <pre class="code" id="vig-out"></pre>
  </div>`);
  root.appendChild(vigCard);
  const vigOut = vigCard.querySelector("#vig-out") as HTMLElement;
  const vigKey = () => (vigCard.querySelector("#vig-key") as HTMLInputElement).value;
  (vigCard.querySelector("#vig-enc") as HTMLElement).addEventListener("click", () => {
    vigOut.textContent = vigenere(cIn.value, vigKey(), false);
  });
  (vigCard.querySelector("#vig-dec") as HTMLElement).addEventListener("click", () => {
    vigOut.textContent = vigenere(cIn.value, vigKey(), true);
  });

  // ---------- XOR ----------
  const xorCard = el(`<div class="card">
    <h3> XOR 异或 <span class="muted tag">循环密钥 + 单字节爆破</span></h3>
    <div class="row">
      <input type="text" id="xor-key" placeholder="密钥 (文本)" style="width:200px">
      <input type="text" id="xor-hexkey" placeholder="或 hex 密钥 如 1f2e" style="width:160px">
      <select id="xor-fmt" style="width:110px">
        <option value="text">→ 文本</option>
        <option value="hex">→ Hex</option>
        <option value="b64">→ Base64</option>
      </select>
      <button class="btn primary" id="xor-run">XOR</button>
    </div>
    <pre class="code" id="xor-out"></pre>
    <hr class="sep">
    <button class="btn" id="xor-brute">单字节密钥爆破 (0x00-0xff)</button>
    <div id="xor-brute-out" class="small"></div>
  </div>`);
  root.appendChild(xorCard);

  const xorOut = xorCard.querySelector("#xor-out") as HTMLElement;
  (xorCard.querySelector("#xor-run") as HTMLElement).addEventListener("click", () => {
    const hexKey = (xorCard.querySelector("#xor-hexkey") as HTMLInputElement).value.trim();
    const txtKey = (xorCard.querySelector("#xor-key") as HTMLInputElement).value;
    const fmt = (xorCard.querySelector("#xor-fmt") as HTMLSelectElement).value;
    try {
      const key = hexKey ? fromHex(hexKey) : te.encode(txtKey);
      if (key.length === 0) throw new Error("请提供密钥");
      const out = xorBytes(te.encode(cIn.value), key);
      xorOut.textContent = fmt === "hex" ? toHex(out) : fmt === "b64" ? b64encode(out) : tryUtf8(out);
    } catch (e) {
      xorOut.textContent = "⚠ " + (e as Error).message;
    }
  });

  (xorCard.querySelector("#xor-brute") as HTMLElement).addEventListener("click", () => {
    const box = xorCard.querySelector("#xor-brute-out") as HTMLElement;
    box.innerHTML = "";
    const data = te.encode(cIn.value);
    if (data.length === 0) return;
    const results: { k: number; s: string }[] = [];
    for (let k = 1; k < 256; k++) {
      const dec = xorBytes(data, new Uint8Array([k]));
      const score = printableScore(dec);
      if (score > 0.95) {
        results.push({ k, s: tryUtf8(dec) });
      }
    }
    if (results.length === 0) {
      box.innerHTML = '<span class="muted">没有高可打印率的结果,可能不是单字节 XOR</span>';
      return;
    }
    for (const r of results.slice(0, 20)) {
      const row = el(`<div class="row" style="padding:2px 0">
        <span class="badge">0x${r.k.toString(16).padStart(2, "0")}</span>
        <span class="mono" style="flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${r.s}</span>
      </div>`);
      row.title = r.s;
      row.appendChild(copyBtn(() => r.s));
      box.appendChild(row);
    }
    if (results.length > 20) box.appendChild(el(`<div class="muted small">… 共 ${results.length} 条,仅显示前 20</div>`));
  });

  cIn.value = "Wkh vlq rid jhqwxh pdq";
  runCaesar();
}
