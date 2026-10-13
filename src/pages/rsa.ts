import { el, copyBtn, toast } from "../ui";
import { bytesToBigInt, bigIntToBytes, parseBigInt, modPow, modInv, gcd, isProbablePrime } from "../lib/bigint";
import { pemToDer, parseRsaPublic, parseRsaPrivate } from "../lib/der";
import { te, tryUtf8, toHex } from "../lib/b64";

function dec2hex(n: bigint): string {
  return "0x" + n.toString(16);
}

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  // ---------- PEM 解析 ----------
  const pemCard = el(`<div class="card">
    <h3>🔑 PEM 密钥解析 <span class="muted tag">PKCS#1 / PKCS#8 / 公钥 / 私钥</span></h3>
    <textarea id="pem-in" class="big" placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBg...&#10;-----END PUBLIC KEY-----"></textarea>
    <div class="btnrow"><button class="btn primary" id="pem-run">解析</button></div>
    <div class="kv" id="pem-out"></div>
  </div>`);
  root.appendChild(pemCard);
  const pemIn = pemCard.querySelector("#pem-in") as HTMLTextAreaElement;
  const pemOut = pemCard.querySelector("#pem-out") as HTMLElement;

  (pemCard.querySelector("#pem-run") as HTMLElement).addEventListener("click", () => {
    pemOut.innerHTML = "";
    const der = pemToDer(pemIn.value);
    if (!der) {
      pemOut.innerHTML = '<span class="err">未找到有效的 PEM 块 (需要 BEGIN/END 头)</span>';
      return;
    }
    const priv = parseRsaPrivate(der);
    const pub = priv ?? parseRsaPublic(der);
    if (!pub) {
      pemOut.innerHTML = '<span class="err">无法按 RSA 密钥解析 (可能是 EC 等其他算法)</span>';
      return;
    }
    const rows: [string, string][] = [
      ["类型", priv ? "私钥 (含 " + (priv.p !== undefined ? "p,q" : "仅d") + ")" : "公钥"],
      ["n (" + (pub.n.toString(2).length) + " bit)", dec2hex(pub.n)],
      ["e", String(pub.e)],
    ];
    if (priv?.d !== undefined) rows.push(["d", dec2hex(priv.d)]);
    if (priv?.p !== undefined) rows.push(["p", dec2hex(priv.p)]);
    if (priv?.q !== undefined) rows.push(["q", dec2hex(priv.q)]);
    pemOut.innerHTML = rows.map(([k, v]) => `<span class="k">${k}</span><span class="v" style="word-break:break-all">${v}</span>`).join("");
    // feed calculator
    if (priv?.p !== undefined && priv?.q !== undefined) {
      (root.querySelector("#rsa-p") as HTMLInputElement).value = priv.p.toString();
      (root.querySelector("#rsa-q") as HTMLInputElement).value = priv.q.toString();
      (root.querySelector("#rsa-e") as HTMLInputElement).value = priv.e.toString();
      toast("已自动填入 p / q / e");
    }
  });

  // ---------- p q e calculator ----------
  const calcCard = el(`<div class="card">
    <h3>🧮 RSA 参数计算 <span class="muted tag">已知 p,q,e → d(n, φ, dp, dq)</span></h3>
    <div class="grid3">
      <label class="fld"><span class="lb" id="rsa-p-lb">p (十进制)</span><input type="text" id="rsa-p"></label>
      <label class="fld"><span class="lb" id="rsa-q-lb">q</span><input type="text" id="rsa-q"></label>
      <label class="fld"><span class="lb">e</span><input type="text" id="rsa-e" value="65537"></label>
    </div>
    <div class="btnrow"><button class="btn primary" id="rsa-calc">计算</button>
    <button class="btn" id="rsa-calc-ned">改用 n,d,e 模式</button></div>
    <div class="kv" id="rsa-calc-out"></div>
  </div>`);
  root.appendChild(calcCard);
  const pIn = calcCard.querySelector("#rsa-p") as HTMLInputElement;
  const qIn = calcCard.querySelector("#rsa-q") as HTMLInputElement;
  const eIn = calcCard.querySelector("#rsa-e") as HTMLInputElement;
  const calcOut = calcCard.querySelector("#rsa-calc-out") as HTMLElement;
  let nedMode = false;
  const pLb = calcCard.querySelector("#rsa-p-lb") as HTMLElement;
  const qLb = calcCard.querySelector("#rsa-q-lb") as HTMLElement;

  function runCalc(): void {
    calcOut.innerHTML = "";
    try {
      const p = parseBigInt(pIn.value);
      const q = parseBigInt(qIn.value);
      const e = parseBigInt(eIn.value);
      if (nedMode) {
        const n = p, d = q;
        rows([[ "n", String(n) ], ["d", String(d) ], ["e", String(e) ],
          ["gcd(e, φ) 检查", "n,d 模式跳过"],
          ["提示", "密文 c 填到下方加解密区,用 n,d 解密"]]);
        (root.querySelector("#crypt-key-n") as HTMLInputElement).value = n.toString();
        (root.querySelector("#crypt-key-e") as HTMLInputElement).value = d.toString(); // reuse as exponent slot when decrypting we use d
        return;
      }
      if (!isProbablePrime(p)) { calcOut.innerHTML = '<span class="err">p 不是素数</span>'; return; }
      if (!isProbablePrime(q)) { calcOut.innerHTML = '<span class="err">q 不是素数</span>'; return; }
      const n = p * q;
      const phi = (p - 1n) * (q - 1n);
      if (gcd(e, phi) !== 1n) { calcOut.innerHTML = `<span class="err">gcd(e, φ) = ${gcd(e, phi)} ≠ 1,d 不存在</span>`; return; }
      const d = modInv(e, phi);
      rows([
        ["n", String(n)],
        ["n (hex)", dec2hex(n)],
        ["φ(n)", String(phi)],
        ["d", String(d)],
        ["dp = d mod (p-1)", String(d % (p - 1n))],
        ["dq = d mod (q-1)", String(d % (q - 1n))],
      ]);
      (root.querySelector("#crypt-key-n") as HTMLInputElement).value = n.toString();
      (root.querySelector("#crypt-key-e") as HTMLInputElement).value = e.toString();
    } catch (err) {
      calcOut.innerHTML = '<span class="err">' + (err as Error).message + "</span>";
    }
  }
  function rows(rs: [string, string][]): void {
    calcOut.innerHTML = rs.map(([k, v]) => `<span class="k">${k}</span><span class="v" style="word-break:break-all">${v}</span>`).join("");
  }
  (calcCard.querySelector("#rsa-calc") as HTMLElement).addEventListener("click", runCalc);
  (calcCard.querySelector("#rsa-calc-ned") as HTMLElement).addEventListener("click", () => {
    nedMode = !nedMode;
    pLb.textContent = nedMode ? "n (十进制)" : "p (十进制)";
    qLb.textContent = nedMode ? "d" : "q";
    (calcCard.querySelector("#rsa-calc-ned") as HTMLElement).textContent = nedMode ? "改用 p,q,e 模式" : "改用 n,d,e 模式";
  });

  // ---------- encrypt / decrypt ----------
  const cryptCard = el(`<div class="card">
    <h3>🔒 教科书 RSA 加解密 <span class="muted tag">c = m^e mod n / m = c^d mod n (BigInt)</span></h3>
    <div class="grid2">
      <label class="fld"><span class="lb">n</span><input type="text" id="crypt-key-n"></label>
      <label class="fld"><span class="lb">指数 (加密用 e,解密用 d)</span><input type="text" id="crypt-key-e"></label>
    </div>
    <textarea id="crypt-io" placeholder="输入:加密时为明文文本;解密时为密文 (十进制 / 0x hex / hex)"></textarea>
    <div class="btnrow">
      <button class="btn primary" id="crypt-enc">加密 m^e mod n</button>
      <button class="btn primary" id="crypt-dec">解密 c^d mod n</button>
    </div>
    <div class="copy-source"><pre class="code" id="crypt-out"></pre></div>
  </div>`);
  root.appendChild(cryptCard);
  const cn = cryptCard.querySelector("#crypt-key-n") as HTMLInputElement;
  const ce = cryptCard.querySelector("#crypt-key-e") as HTMLInputElement;
  const cIn = cryptCard.querySelector("#crypt-io") as HTMLTextAreaElement;
  const cOut = cryptCard.querySelector("#crypt-out") as HTMLElement;
  if (!cOut.querySelector("button")) cOut.appendChild(copyBtn(() => cOut.textContent ?? ""));

  function crypt(decrypt: boolean): void {
    try {
      const n = parseBigInt(cn.value);
      const exp = parseBigInt(ce.value);
      if (!decrypt) {
        const m = bytesToBigInt(te.encode(cIn.value));
        const c = modPow(m, exp, n);
        cOut.textContent = `密文 (十进制):\n${c}\n\n密文 (hex):\n${dec2hex(c)}`;
      } else {
        const c = parseBigInt(cIn.value);
        const m = modPow(c, exp, n);
        const bytes = bigIntToBytes(m);
        cOut.textContent =
          `明文 (十进制): ${m}\n\n明文 (hex): ${toHex(bytes)}\n\n明文 (UTF-8 尽力解码): ${JSON.stringify(tryUtf8(bytes))}`;
      }
    } catch (e) {
      cOut.textContent = "⚠ " + (e as Error).message;
    }
  }
  (cryptCard.querySelector("#crypt-enc") as HTMLElement).addEventListener("click", () => crypt(false));
  (cryptCard.querySelector("#crypt-dec") as HTMLElement).addEventListener("click", () => crypt(true));
}
