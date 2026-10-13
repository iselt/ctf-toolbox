import { el, copyBtn, toast } from "../ui";
import { te, b64urlEncode, b64urlDecode, tryUtf8 } from "../lib/b64";
import { JWT_SECRETS } from "../data/jwt-secrets";

type Alg = "HS256" | "HS384" | "HS512";

async function hmac(alg: Alg, key: Uint8Array, msg: Uint8Array): Promise<Uint8Array> {
  const hash = "SHA-" + alg.slice(2);
  const k = await crypto.subtle.importKey("raw", key as unknown as ArrayBuffer, { name: "HMAC", hash }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", k, msg as unknown as ArrayBuffer));
}

function prettyJson(s: string): string {
  try {
    return JSON.stringify(JSON.parse(s), null, 2);
  } catch {
    return s;
  }
}

interface Decoded {
  headerRaw: string;
  payloadRaw: string;
  sig: Uint8Array;
  signingInput: Uint8Array;
  alg: string;
}

function decodeToken(token: string): Decoded {
  const parts = token.trim().replace(/^Bearer\s+/i, "").split(".");
  if (parts.length < 2 || parts.length > 3) throw new Error("JWT 格式应为 header.payload.signature");
  const headerRaw = tryUtf8(b64urlDecode(parts[0]));
  const payloadRaw = tryUtf8(b64urlDecode(parts[1]));
  const header = JSON.parse(headerRaw);
  return {
    headerRaw,
    payloadRaw,
    sig: parts[2] ? b64urlDecode(parts[2]) : new Uint8Array(0),
    signingInput: te.encode(parts[0] + "." + parts[1]),
    alg: String(header.alg ?? "?"),
  };
}

function tsHuman(v: unknown): string | null {
  if (typeof v !== "number") return null;
  const d = new Date(v * 1000);
  return `${d.toLocaleString("zh-CN")} (${d.toISOString()})`;
}

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  root.appendChild(
    el(`<div class="notice info">
      JWT 工具箱:解码 / 验签 / 字典爆破 / 伪造 / <b>RS256→HS256 算法混淆</b>。全部本地计算,支持 HS256/384/512。
    </div>`)
  );

  // ---------- decode ----------
  const decCard = el(`<div class="card">
    <h3>🔓 解码 <span class="muted tag">粘贴 token 自动解析</span></h3>
    <textarea id="j-in" class="big" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.签名"></textarea>
    <div class="grid2" style="margin-top:10px">
      <div><div class="small muted" style="margin-bottom:4px">Header</div><pre class="code" id="j-header" style="min-height:90px"></pre></div>
      <div><div class="small muted" style="margin-bottom:4px">Payload</div><pre class="code" id="j-payload" style="min-height:90px"></pre></div>
    </div>
    <div id="j-claims" class="kv" style="margin-top:10px"></div>
  </div>`);
  root.appendChild(decCard);

  const tIn = decCard.querySelector("#j-in") as HTMLTextAreaElement;
  const hOut = decCard.querySelector("#j-header") as HTMLElement;
  const pOut = decCard.querySelector("#j-payload") as HTMLElement;
  const claimsOut = decCard.querySelector("#j-claims") as HTMLElement;

  let current: Decoded | null = null;

  function runDecode(): void {
    claimsOut.innerHTML = "";
    if (!tIn.value.trim()) {
      hOut.textContent = pOut.textContent = "";
      current = null;
      return;
    }
    try {
      const d = decodeToken(tIn.value);
      current = d;
      hOut.textContent = prettyJson(d.headerRaw);
      pOut.textContent = prettyJson(d.payloadRaw);
      const payload = JSON.parse(d.payloadRaw) as Record<string, unknown>;
      const claimRows: string[] = [];
      for (const [k, v] of Object.entries(payload)) {
        const human = tsHuman(v);
        let vs: string;
        if (typeof v === "object") vs = JSON.stringify(v);
        else vs = String(v);
        let extra = "";
        if (human) {
          const expired = k === "exp" && Date.now() / 1000 > Number(v);
          extra = expired ? ` <span class="err">⏰ 已过期: ${human}</span>` : ` <span class="muted">= ${human}</span>`;
        }
        claimRows.push(`<span class="k">${k}</span><span class="v mono">${vs}${extra}</span>`);
      }
      claimsOut.innerHTML = claimRows.join("");
    } catch (e) {
      hOut.textContent = "⚠ " + (e as Error).message;
      pOut.textContent = "";
      current = null;
    }
  }
  tIn.addEventListener("input", runDecode);

  // ---------- verify & crack ----------
  const vcCard = el(`<div class="card">
    <h3>🔑 验签 / 爆破</h3>
    <div class="row">
      <input type="text" id="j-secret" placeholder="HMAC 密钥" style="flex:1">
      <button class="btn primary" id="j-verify">验证签名</button>
      <button class="btn" id="j-crack">内置字典爆破</button>
    </div>
    <div class="row" style="margin-top:8px">
      <textarea id="j-wordlist" placeholder="自定义字典 (可选,每行一个;留空用内置 ~200 条弱密钥)" style="min-height:60px"></textarea>
    </div>
    <div id="j-vc-out"></div>
  </div>`);
  root.appendChild(vcCard);
  const secretIn = vcCard.querySelector("#j-secret") as HTMLInputElement;
  const wordlistIn = vcCard.querySelector("#j-wordlist") as HTMLTextAreaElement;
  const vcOut = vcCard.querySelector("#j-vc-out") as HTMLElement;

  async function tryAlg(d: Decoded, key: Uint8Array): Promise<Alg | null> {
    for (const alg of ["HS256", "HS384", "HS512"] as Alg[]) {
      const sig = await hmac(alg, key, d.signingInput);
      if (sig.length === d.sig.length && sig.every((b, i) => b === d.sig[i])) return alg;
    }
    return null;
  }

  (vcCard.querySelector("#j-verify") as HTMLElement).addEventListener("click", () => {
    void (async () => {
      if (!current) {
        vcOut.innerHTML = '<span class="err">请先解码一个有效 token</span>';
        return;
      }
      const key = te.encode(secretIn.value);
      if (key.length === 0) {
        vcOut.innerHTML = '<span class="err">请输入密钥</span>';
        return;
      }
      const hit = await tryAlg(current, key);
      if (hit) {
        secretIn.style.borderColor = "var(--accent)";
        vcOut.innerHTML = `<span class="ok">✅ 签名正确</span> — 密钥 <span class="mono hl-yellow">${secretIn.value}</span> (算法 ${hit})`;
      } else if (current.alg === "none") {
        vcOut.innerHTML = '<span class="hl-yellow">⚠ 该 token 算法为 none,无签名</span>';
      } else {
        secretIn.style.borderColor = "var(--red)";
        vcOut.innerHTML = `<span class="err">❌ 签名不匹配 (token 算法 ${current.alg})</span>`;
      }
    })();
  });

  (vcCard.querySelector("#j-crack") as HTMLElement).addEventListener("click", () => {
    void (async () => {
      if (!current) {
        vcOut.innerHTML = '<span class="err">请先解码一个有效 token</span>';
        return;
      }
      if (!current.alg.startsWith("HS")) {
        vcOut.innerHTML = `<span class="err">算法 ${current.alg} 不是 HMAC,无法字典爆破</span>`;
        return;
      }
      const words = wordlistIn.value.trim() ? wordlistIn.value.split(/\r?\n/) : JWT_SECRETS;
      vcOut.innerHTML = `<span class="muted">爆破中… ${words.length} 个候选</span>`;
      const t0 = performance.now();
      for (let i = 0; i < words.length; i++) {
        const w = words[i].trim();
        if (!w) continue;
        const hit = await tryAlg(current, te.encode(w));
        if (hit) {
          secretIn.value = w;
          vcOut.innerHTML = `<span class="ok">✅ 爆破成功:</span> 密钥 = <span class="mono hl-yellow">${w}</span> (${hit}),耗时 ${(performance.now() - t0).toFixed(0)}ms,已填入上方密钥框`;
          secretIn.style.borderColor = "var(--accent)";
          return;
        }
        if (i % 200 === 0) await new Promise((r) => setTimeout(r));
      }
      vcOut.innerHTML = `<span class="err">❌ ${words.length} 个候选均未命中 (${(performance.now() - t0).toFixed(0)}ms)</span>`;
    })();
  });

  // ---------- forge ----------
  const forgeCard = el(`<div class="card">
    <h3>🔨 伪造 / 签发</h3>
    <div class="grid2">
      <div>
        <div class="small muted" style="margin-bottom:4px">Header (JSON)</div>
        <textarea id="f-header" style="min-height:110px"></textarea>
      </div>
      <div>
        <div class="small muted" style="margin-bottom:4px">Payload (JSON)</div>
        <textarea id="f-payload" style="min-height:110px"></textarea>
      </div>
    </div>
    <div class="row" style="margin-top:10px">
      <select id="f-alg" style="width:210px">
        <option value="HS256">HS256 (对称,密钥签名)</option>
        <option value="HS384">HS384</option>
        <option value="HS512">HS512</option>
        <option value="none">none (空签名 · 经典绕过)</option>
        <option value="RS2HS">RS256→HS256 混淆 (公钥当 HMAC 密钥)</option>
      </select>
      <input type="text" id="f-secret" placeholder="密钥 / 公钥 PEM" style="flex:1">
      <button class="btn primary" id="f-run">生成 Token</button>
      <button class="btn" id="f-load">⬇ 载入左侧解码结果</button>
    </div>
    <div class="row small muted" style="margin-top:4px">
      RS→HS 混淆:目标用公钥验 HMAC 时,把服务器公钥 PEM 全文粘贴为密钥即可伪造合法 token。
    </div>
    <pre class="code" id="f-out" style="margin-top:10px;min-height:60px"></pre>
  </div>`);
  root.appendChild(forgeCard);

  const fHeader = forgeCard.querySelector("#f-header") as HTMLTextAreaElement;
  const fPayload = forgeCard.querySelector("#f-payload") as HTMLTextAreaElement;
  const fAlg = forgeCard.querySelector("#f-alg") as HTMLSelectElement;
  const fSecret = forgeCard.querySelector("#f-secret") as HTMLInputElement;
  const fOut = forgeCard.querySelector("#f-out") as HTMLElement;

  (forgeCard.querySelector("#f-load") as HTMLElement).addEventListener("click", () => {
    if (!current) return;
    try {
      fHeader.value = prettyJson(current.headerRaw);
      fPayload.value = prettyJson(current.payloadRaw);
    } catch {
      toast("载入失败");
    }
  });

  (forgeCard.querySelector("#f-run") as HTMLElement).addEventListener("click", () => {
    void (async () => {
      let header: Record<string, unknown>;
      let payload: unknown;
      try {
        header = JSON.parse(fHeader.value);
        payload = JSON.parse(fPayload.value);
      } catch (e) {
        fOut.textContent = "⚠ JSON 解析失败: " + (e as Error).message;
        return;
      }
      const mode = fAlg.value;
      const h64 = b64urlEncode(te.encode(JSON.stringify(header)));
      const p64 = b64urlEncode(te.encode(JSON.stringify(payload)));
      const body = `${h64}.${p64}`;
      if (mode === "none") {
        fOut.textContent = body + ".";
        return;
      }
      let alg: Alg;
      if (mode === "RS2HS") {
        alg = "HS256";
        header.alg = "HS256";
      } else {
        alg = mode as Alg;
        header.alg = alg;
      }
      const h64b = b64urlEncode(te.encode(JSON.stringify(header)));
      const signingInput = te.encode(`${h64b}.${p64}`);
      const key = te.encode(fSecret.value);
      if (key.length === 0) {
        fOut.textContent = "⚠ 请输入签名密钥";
        return;
      }
      const sig = await hmac(alg, key, signingInput);
      fOut.textContent = `${h64b}.${p64}.${b64urlEncode(sig)}`;
    })();
  });

  fOut.appendChild(copyBtn(() => fOut.textContent ?? ""));

  // example token (jwt.io 样例 header/payload)
  tIn.value =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMiwiZXhwIjo5OTk5OTk5OTk5fQ.tR8v6ZVeTQqID7ZzXLzQm9Gm6eU3mV2Z1nW4yO8a9jE";
  runDecode();
  fHeader.value = '{\n  "alg": "HS256",\n  "typ": "JWT"\n}';
  fPayload.value = '{\n  "sub": "1234567890",\n  "name": "Jane Doe",\n  "admin": true\n}';
}
