import { el, copyBtn, debounce, fmtBytes } from "../ui";
import { md5 } from "../lib/md5";
import { crc32 } from "../lib/crc32";
import { te } from "../lib/b64";
import { JWT_SECRETS } from "../data/jwt-secrets";

async function sha(name: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512", bytes: Uint8Array): Promise<string> {
  const h = await crypto.subtle.digest(name, bytes as unknown as ArrayBuffer);
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

const HASH_TYPES: { re: RegExp; names: string }[] = [
  { re: /^[a-f0-9]{32}$/i, names: "MD5 / MD4 / NTLM / LM / MD2 (32位)" },
  { re: /^[a-f0-9]{16}$/i, names: "MySQL323 / 半个MD5 (16位)" },
  { re: /^\*[a-f0-9]{40}$/i, names: "MySQL5+ (SHA1带*前缀)" },
  { re: /^[a-f0-9]{40}$/i, names: "SHA1 / RIPEMD160 (40位)" },
  { re: /^[a-f0-9]{56}$/i, names: "SHA224 / SHA3-224 (56位)" },
  { re: /^[a-f0-9]{64}$/i, names: "SHA256 / SHA3-256 / BLAKE2s (64位)" },
  { re: /^[a-f0-9]{96}$/i, names: "SHA384 / SHA3-384 (96位)" },
  { re: /^[a-f0-9]{128}$/i, names: "SHA512 / SHA3-512 / BLAKE2b (128位)" },
  { re: /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/, names: "bcrypt" },
  { re: /^\$6\$[^\s]+/, names: "sha512crypt (Linux shadow)" },
  { re: /^\$1\$[^\s]+/, names: "md5crypt" },
  { re: /^\$y\$[^\s]+/, names: "yescrypt (新版 shadow)" },
  { re: /^[A-Za-z0-9+/]{27}=$/, names: "SHA1 Base64 (28字符)" },
  { re: /^[A-Za-z0-9+/]{43}=$/, names: "SHA256 Base64 (44字符)" },
  { re: /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.?$/, names: "这是 JWT!" },
];

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  const card = el(`<div class="card">
    <h3>#️⃣ 哈希计算 <span class="muted tag">文本 / 文件 · 全部本地计算</span></h3>
    <textarea id="h-in" placeholder="输入文本,实时计算..."></textarea>
    <div class="btnrow">
      <input type="file" id="h-file" style="display:none">
      <button class="btn" id="h-file-btn">📁 选择文件</button>
      <span class="muted small" id="h-file-info"></span>
    </div>
    <div id="h-out"></div>
    <hr class="sep">
    <h3>🔍 哈希识别</h3>
    <div class="row">
      <input type="text" id="h-target" placeholder="粘贴待识别/比对的哈希值" style="flex:1">
      <button class="btn" id="h-dict">内置字典爆破</button>
    </div>
    <div id="h-identify" class="small"></div>
  </div>`);
  root.appendChild(card);

  const input = card.querySelector("#h-in") as HTMLTextAreaElement;
  const out = card.querySelector("#h-out") as HTMLElement;
  const target = card.querySelector("#h-target") as HTMLInputElement;
  const identify = card.querySelector("#h-identify") as HTMLElement;

  interface Row { name: string; el: HTMLElement }
  const rows: Row[] = [];
  for (const name of ["MD5", "SHA-1", "SHA-256", "SHA-384", "SHA-512", "CRC32"]) {
    const r = el(`<div class="kv" style="margin-bottom:6px">
      <span class="k">${name}</span><span class="v mono" style="display:flex;gap:6px;align-items:center"><span class="hv" style="word-break:break-all"></span></span>
    </div>`);
    const hv = r.querySelector(".hv") as HTMLElement;
    hv.appendChild(copyBtn(() => hv.textContent ?? ""));
    out.appendChild(r);
    rows.push({ name, el: hv });
  }

  function markMatch(): void {
    const t = target.value.trim().toLowerCase();
    for (const r of rows) {
      const v = r.el.textContent ?? "";
      r.el.parentElement!.style.background = t && v === t ? "rgba(74,222,128,.1)" : "";
    }
    identifyHash();
  }

  function identifyHash(): void {
    const t = target.value.trim();
    if (!t) {
      identify.innerHTML = "";
      return;
    }
    const hits = HASH_TYPES.filter((h) => h.re.test(t));
    identify.innerHTML = hits.length
      ? "可能的类型: " + hits.map((h) => `<span class="badge g">${h.names}</span>`).join(" ")
      : '<span class="muted">未匹配常见格式</span>';
  }

  async function compute(bytes: Uint8Array): Promise<void> {
    const vals: Record<string, string> = {
      MD5: md5(bytes),
      "SHA-1": await sha("SHA-1", bytes),
      "SHA-256": await sha("SHA-256", bytes),
      "SHA-384": await sha("SHA-384", bytes),
      "SHA-512": await sha("SHA-512", bytes),
      CRC32: crc32(bytes),
    };
    for (const r of rows) r.el.textContent = vals[r.name];
    markMatch();
  }

  const run = debounce(() => void compute(te.encode(input.value)), 150);
  input.addEventListener("input", run);

  target.addEventListener("input", markMatch);

  const fileBtn = card.querySelector("#h-file-btn") as HTMLElement;
  const fileInput = card.querySelector("#h-file") as HTMLInputElement;
  const fileInfo = card.querySelector("#h-file-info") as HTMLElement;
  fileBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    fileInfo.textContent = `${f.name} (${fmtBytes(f.size)})`;
    const buf = new Uint8Array(await f.arrayBuffer());
    await compute(buf);
  });

  // dictionary attack using embedded wordlist
  (card.querySelector("#h-dict") as HTMLElement).addEventListener("click", () => {
    const t = target.value.trim().toLowerCase();
    if (!t) {
      identify.innerHTML = '<span class="err">请先填入目标哈希</span>';
      return;
    }
    const algo = ["MD5", "SHA-1", "SHA-256"].includes(rows.find((r) => (r.el.textContent ?? "").toLowerCase() === t)?.name ?? "")
      ? rows.find((r) => (r.el.textContent ?? "").toLowerCase() === t)!.name
      : /^[a-f0-9]{32}$/i.test(t) ? "MD5" : /^[a-f0-9]{40}$/i.test(t) ? "SHA-1" : /^[a-f0-9]{64}$/i.test(t) ? "SHA-256" : null;
    if (!algo) {
      identify.innerHTML = '<span class="err">仅支持 MD5 / SHA1 / SHA256 字典爆破</span>';
      return;
    }
    void (async () => {
      for (const w of JWT_SECRETS) {
        const bytes = te.encode(w);
        let h: string;
        if (algo === "MD5") h = md5(bytes);
        else if (algo === "SHA-1") h = await sha("SHA-1", bytes);
        else h = await sha("SHA-256", bytes);
        if (h === t) {
          identify.innerHTML = `<span class="ok">✅ 破解成功:</span> <span class="mono hl-yellow">${w}</span>`;
          return;
        }
      }
      identify.innerHTML = '<span class="err">内置字典未命中,可把更大字典粘贴进 JWT 工具页的字典框爆破</span>';
    })();
  });

  input.value = "flag{offline_hash}";
  void compute(te.encode(input.value));
}
