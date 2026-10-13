import { el, copyBtn, fmtBytes } from "../ui";

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  root.appendChild(
    el(`<div class="notice info">
      手工 HTTP 请求发送器(类似 Burp Repeater 的轻量版)。通过本地 Tauri 层直连目标——适合打本地/内网靶机;
      应用本身不发起任何其他网络请求。浏览器 dev 模式下受 CORS 限制,打包版无此限制。
    </div>`)
  );

  const card = el(`<div class="card">
    <div class="row" style="align-items:flex-start">
      <select id="hs-method" style="width:110px">
        <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
        <option>HEAD</option><option>OPTIONS</option><option>PATCH</option>
      </select>
      <input type="text" id="hs-url" placeholder="http://127.0.0.1:8080/api?x=1" style="flex:1" value="http://127.0.0.1:8080/">
      <button class="btn primary" id="hs-send">🚀 发送</button>
    </div>
    <div class="row" style="margin-top:8px">
      <label class="ck"><input type="checkbox" id="hs-follow" checked> 跟随重定向</label>
    </div>
    <div class="grid2" style="margin-top:10px">
      <div>
        <div class="small muted" style="margin-bottom:4px">请求头 (每行 Key: Value)</div>
        <textarea id="hs-headers" style="min-height:130px">User-Agent: CTF-Toolbox/1.0
Content-Type: application/x-www-form-urlencoded</textarea>
      </div>
      <div>
        <div class="small muted" style="margin-bottom:4px">请求体</div>
        <textarea id="hs-body" style="min-height:130px" placeholder="username=admin&password=123"></textarea>
      </div>
    </div>
  </div>`);
  root.appendChild(card);

  const out = el(`<div class="card" id="hs-resp-card" style="display:none">
    <h3>响应 <span id="hs-meta" class="muted tag"></span></h3>
    <div class="kv" id="hs-resp-headers" style="margin-bottom:10px"></div>
    <div class="copy-source"><pre class="code" id="hs-resp-body" style="max-height:420px;overflow:auto"></pre></div>
  </div>`);
  root.appendChild(out);

  const method = card.querySelector("#hs-method") as HTMLSelectElement;
  const urlIn = card.querySelector("#hs-url") as HTMLInputElement;
  const headersIn = card.querySelector("#hs-headers") as HTMLTextAreaElement;
  const bodyIn = card.querySelector("#hs-body") as HTMLTextAreaElement;
  const follow = card.querySelector("#hs-follow") as HTMLInputElement;
  const sendBtn = card.querySelector("#hs-send") as HTMLButtonElement;

  const respBody = out.querySelector("#hs-resp-body") as HTMLElement;
  const respMeta = out.querySelector("#hs-meta") as HTMLElement;
  const respHeaders = out.querySelector("#hs-resp-headers") as HTMLElement;

  if (!respBody.querySelector("button")) respBody.appendChild(copyBtn(() => respBody.textContent ?? ""));

  sendBtn.addEventListener("click", () => {
    void (async () => {
      const url = urlIn.value.trim();
      if (!url) {
        respMeta.textContent = "请输入 URL";
        out.style.display = "";
        return;
      }
      const headers = new Headers();
      for (const line of headersIn.value.split(/\r?\n/)) {
        const i = line.indexOf(":");
        if (i > 0) headers.set(line.slice(0, i).trim(), line.slice(i + 1).trim());
      }
      const hasBody = !["GET", "HEAD"].includes(method.value);
      sendBtn.disabled = true;
      sendBtn.textContent = "发送中…";
      out.style.display = "";
      respBody.textContent = "…";
      const t0 = performance.now();
      try {
        let doFetch: typeof globalThis.fetch;
        try {
          const mod = await import("@tauri-apps/plugin-http");
          doFetch = mod.fetch as unknown as typeof globalThis.fetch;
        } catch {
          doFetch = globalThis.fetch;
        }
        const resp = await doFetch(url, {
          method: method.value,
          headers,
          body: hasBody && bodyIn.value ? bodyIn.value : undefined,
          redirect: follow.checked ? "follow" : "manual",
        });
        const ms = (performance.now() - t0).toFixed(0);
        const text = await resp.text();
        respMeta.innerHTML = `<span class="${resp.ok ? "ok" : "err"}">${resp.status} ${resp.statusText}</span> · ${fmtBytes(text.length)} · ${ms}ms`;
        const hRows: string[] = [];
        resp.headers.forEach((v, k) => hRows.push(`<span class="k">${k}</span><span class="v">${v}</span>`));
        respHeaders.innerHTML = hRows.join("");
        let display = text;
        const ct = resp.headers.get("content-type") ?? "";
        if (ct.includes("json")) {
          try {
            display = JSON.stringify(JSON.parse(text), null, 2);
          } catch { /* keep raw */ }
        }
        respBody.textContent = display || "(空响应体)";
      } catch (e) {
        respMeta.textContent = "";
        respHeaders.innerHTML = "";
        respBody.textContent = "⚠ " + (e as Error).message + "\n\n提示:目标是 https 自签名时请在打包版中重试;纯浏览器预览模式有 CORS 限制。";
      } finally {
        sendBtn.disabled = false;
        sendBtn.textContent = "🚀 发送";
      }
    })();
  });
}
