import { el, downloadText, toast } from "../ui";

// rejection sampling for unbiased random chars from a pool
function pick(pool: string): () => string {
  return () => {
    const max = 256 - (256 % pool.length);
    for (;;) {
      const b = new Uint32Array(1);
      crypto.getRandomValues(b);
      const v = b[0] & 0xff;
      if (v < max) return pool[v % pool.length];
    }
  };
}

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  // ---------- password ----------
  const pwCard = el(`<div class="card">
    <h3>🎲 密码生成器 <span class="badge g" id="pw-entropy"></span></h3>
    <div class="row">
      <label class="fld" style="margin:0"><span class="lb">长度</span><input type="number" id="pw-len" value="20" min="4" max="128" style="width:80px"></label>
      <label class="fld" style="margin:0"><span class="lb">数量</span><input type="number" id="pw-count" value="5" min="1" max="200" style="width:80px"></label>
      <label class="ck"><input type="checkbox" id="pw-lower" checked> a-z</label>
      <label class="ck"><input type="checkbox" id="pw-upper" checked> A-Z</label>
      <label class="ck"><input type="checkbox" id="pw-digit" checked> 0-9</label>
      <label class="ck"><input type="checkbox" id="pw-symbol" checked> !@#$%</label>
      <label class="ck"><input type="checkbox" id="pw-noamb"> 去混淆 (0O1lI)</label>
    </div>
    <div class="btnrow"><button class="btn primary" id="pw-gen">生成</button></div>
    <pre class="code" id="pw-out"></pre>
  </div>`);
  root.appendChild(pwCard);

  function genPw(): void {
    const len = parseInt((pwCard.querySelector("#pw-len") as HTMLInputElement).value, 10) || 16;
    const count = parseInt((pwCard.querySelector("#pw-count") as HTMLInputElement).value, 10) || 1;
    let pool = "";
    if ((pwCard.querySelector("#pw-lower") as HTMLInputElement).checked) pool += "abcdefghijklmnopqrstuvwxyz";
    if ((pwCard.querySelector("#pw-upper") as HTMLInputElement).checked) pool += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if ((pwCard.querySelector("#pw-digit") as HTMLInputElement).checked) pool += "0123456789";
    if ((pwCard.querySelector("#pw-symbol") as HTMLInputElement).checked) pool += "!@#$%^&*()-_=+[]{};:,.?/";
    if ((pwCard.querySelector("#pw-noamb") as HTMLInputElement).checked) pool = pool.replace(/[0O1lI|`'"]/g, "");
    const out = pwCard.querySelector("#pw-out") as HTMLElement;
    if (!pool) {
      out.textContent = "⚠ 至少选择一个字符集";
      return;
    }
    const next = pick(pool);
    const lines: string[] = [];
    for (let i = 0; i < count; i++) {
      let s = "";
      for (let j = 0; j < len; j++) s += next();
      lines.push(s);
    }
    out.textContent = lines.join("\n");
    const bits = Math.round(len * Math.log2(pool.length));
    (pwCard.querySelector("#pw-entropy") as HTMLElement).textContent = `熵 ≈ ${bits} bits · 池 ${pool.length} 字符`;
  }
  (pwCard.querySelector("#pw-gen") as HTMLElement).addEventListener("click", genPw);
  genPw();

  // ---------- mutations ----------
  const mutCard = el(`<div class="card">
    <h3>🧬 口令变形器 <span class="muted tag">社工/弱口令猜测字典 · 全本地生成</span></h3>
    <textarea id="mut-in" placeholder="基础词,每行一个:&#10;admin&#10;zhangsan" style="min-height:70px"></textarea>
    <div class="row" style="margin:8px 0">
      <label class="ck"><input type="checkbox" id="mut-case" checked> 大小写变形</label>
      <label class="ck"><input type="checkbox" id="mut-leet" checked> leet (@3!0$)</label>
      <label class="ck"><input type="checkbox" id="mut-num" checked> 追加数字 0-99</label>
      <label class="ck"><input type="checkbox" id="mut-year" checked> 追加年份 1990-2030</label>
      <label class="ck"><input type="checkbox" id="mut-suf" checked> 常见后缀 (! 123 ...)</label>
    </div>
    <div class="btnrow">
      <button class="btn primary" id="mut-gen">生成字典</button>
      <button class="btn" id="mut-dl">下载 .txt</button>
    </div>
    <pre class="code" id="mut-out" style="max-height:200px;overflow:auto"></pre>
  </div>`);
  root.appendChild(mutCard);

  let mutResult = "";
  function genMut(): void {
    const words = (mutCard.querySelector("#mut-in") as HTMLTextAreaElement).value
      .split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    const set = new Set<string>();
    const leet = (s: string): string => s.replace(/[aeiost]/g, (c) => ({ a: "4", e: "3", i: "1", o: "0", s: "$", t: "7" } as Record<string, string>)[c]);
    for (const w of words) {
      const variants = new Set<string>([w]);
      if ((mutCard.querySelector("#mut-case") as HTMLInputElement).checked) {
        variants.add(w.toUpperCase());
        variants.add(w[0].toUpperCase() + w.slice(1));
      }
      if ((mutCard.querySelector("#mut-leet") as HTMLInputElement).checked) variants.add(leet(w));
      const suffixes: string[] = [""];
      if ((mutCard.querySelector("#mut-num") as HTMLInputElement).checked) {
        for (let i = 0; i <= 99; i++) suffixes.push(String(i));
      }
      if ((mutCard.querySelector("#mut-year") as HTMLInputElement).checked) {
        for (let y = 1990; y <= 2030; y++) suffixes.push(String(y));
      }
      if ((mutCard.querySelector("#mut-suf") as HTMLInputElement).checked) suffixes.push("!", "@", "123", "1234", "12345", "888", "666", "@123", "!@#");
      for (const v of variants) {
        for (const suf of suffixes) set.add(v + suf);
      }
    }
    mutResult = [...set].sort().join("\n");
    const out = mutCard.querySelector("#mut-out") as HTMLElement;
    out.textContent = mutResult.split("\n").slice(0, 300).join("\n") + (set.size > 300 ? `\n… 共 ${set.size} 条 (下载查看全部)` : "");
  }
  (mutCard.querySelector("#mut-gen") as HTMLElement).addEventListener("click", genMut);
  (mutCard.querySelector("#mut-dl") as HTMLElement).addEventListener("click", () => {
    if (!mutResult) {
      toast("请先生成字典");
      return;
    }
    downloadText("wordlist.txt", mutResult);
  });
  (mutCard.querySelector("#mut-in") as HTMLTextAreaElement).value = "admin";
  genMut();

  // ---------- timestamp ----------
  const tsCard = el(`<div class="card">
    <h3>⏱️ Unix 时间戳转换</h3>
    <div class="row">
      <input type="text" id="ts-in" style="width:220px" placeholder="1699999999 或 1699999999999">
      <button class="btn" id="ts-now">当前时间</button>
    </div>
    <div class="kv" id="ts-out" style="margin-top:10px"></div>
  </div>`);
  root.appendChild(tsCard);

  function runTs(): void {
    const out = tsCard.querySelector("#ts-out") as HTMLElement;
    const v = (tsCard.querySelector("#ts-in") as HTMLInputElement).value.trim();
    const isoRe = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?/;
    let d: Date;
    if (!v) d = new Date();
    else if (isoRe.test(v)) d = new Date(v.replace(" ", "T"));
    else if (/^\d{13}$/.test(v)) d = new Date(Number(v));
    else if (/^\d{10}$/.test(v)) d = new Date(Number(v) * 1000);
    else {
      out.innerHTML = '<span class="err">无法识别 (支持 10/13 位时间戳或 ISO 日期)</span>';
      return;
    }
    const rows: [string, string][] = [
      ["本地时间", d.toLocaleString("zh-CN", { hour12: false })],
      ["UTC", d.toISOString()],
      ["Unix 秒", String(Math.floor(d.getTime() / 1000))],
      ["Unix 毫秒", String(d.getTime())],
    ];
    out.innerHTML = rows.map(([k, val]) => `<span class="k">${k}</span><span class="v mono">${val}</span>`).join("");
  }
  (tsCard.querySelector("#ts-in") as HTMLInputElement).addEventListener("input", runTs);
  (tsCard.querySelector("#ts-now") as HTMLElement).addEventListener("click", () => {
    (tsCard.querySelector("#ts-in") as HTMLInputElement).value = String(Math.floor(Date.now() / 1000));
    runTs();
  });
  runTs();

  // ---------- uuid ----------
  const uuidCard = el(`<div class="card">
    <h3>🆔 UUID v4</h3>
    <div class="row">
      <input type="number" id="uuid-n" value="5" min="1" max="100" style="width:80px">
      <button class="btn primary" id="uuid-gen">生成</button>
    </div>
    <pre class="code" id="uuid-out"></pre>
  </div>`);
  root.appendChild(uuidCard);
  function genUuid(): void {
    const n = parseInt((uuidCard.querySelector("#uuid-n") as HTMLInputElement).value, 10) || 1;
    const lines: string[] = [];
    for (let i = 0; i < n; i++) lines.push(crypto.randomUUID());
    (uuidCard.querySelector("#uuid-out") as HTMLElement).textContent = lines.join("\n");
  }
  (uuidCard.querySelector("#uuid-gen") as HTMLElement).addEventListener("click", genUuid);
  genUuid();
}
