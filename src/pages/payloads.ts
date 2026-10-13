import { el, esc, copyBtn } from "../ui";
import { PAYLOADS, PAYLOAD_CATS, type PayloadCat } from "../data/payloads";

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  root.appendChild(
    el(`<div class="notice info">Web CTF Payload 速查:XSS / SQLi / 命令注入 / SSTI / LFI / 上传 / SSRF / XXE / 头部 / 反序列化。搜索 + 分类过滤,一键复制。</div>`)
  );

  const bar = el(`<div class="row" style="margin-bottom:10px">
    <input type="text" id="p-search" placeholder="🔍 搜索 payload (如: svg / sleep / php://filter)..." style="flex:1">
  </div>`);
  root.appendChild(bar);
  const chips = el('<div class="chips"></div>');
  root.appendChild(chips);
  const list = el('<div id="p-list"></div>');
  root.appendChild(list);

  let activeCat: PayloadCat | "全部" = "全部";
  const search = bar.querySelector("#p-search") as HTMLInputElement;

  function renderChips(): void {
    chips.innerHTML = "";
    const mk = (name: PayloadCat | "全部") => {
      const c = el(`<span class="chip ${activeCat === name ? "on" : ""}">${name}</span>`);
      c.addEventListener("click", () => {
        activeCat = name;
        renderChips();
        renderList();
      });
      chips.appendChild(c);
    };
    mk("全部");
    for (const cat of PAYLOAD_CATS) {
      const n = PAYLOADS.filter((p) => p.cat === cat).length;
      const c = el(`<span class="chip ${activeCat === cat ? "on" : ""}">${cat} <span class="muted">${n}</span></span>`);
      c.addEventListener("click", () => {
        activeCat = cat;
        renderChips();
        renderList();
      });
      chips.appendChild(c);
    }
  }

  function renderList(): void {
    list.innerHTML = "";
    const q = search.value.trim().toLowerCase();
    const items = PAYLOADS.filter(
      (p) =>
        (activeCat === "全部" || p.cat === activeCat) &&
        (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q) || (p.note ?? "").toLowerCase().includes(q))
    );
    if (items.length === 0) {
      list.innerHTML = '<div class="muted" style="padding:20px;text-align:center">无匹配结果</div>';
      return;
    }
    for (const p of items) {
      const d = el(`<details class="payload">
        <summary>
          <span><span class="badge g" style="margin-right:8px">${esc(p.cat)}</span>${esc(p.name)}</span>
          <span class="muted small mono" style="max-width:45%;overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${esc(p.code.slice(0, 60))}</span>
        </summary>
        <div class="body">
          <div class="copy-source"><pre class="code"></pre></div>
          ${p.note ? `<div class="small muted" style="margin-top:6px">💡 ${esc(p.note)}</div>` : ""}
        </div>
      </details>`) as HTMLElement;
      const pre = d.querySelector("pre") as HTMLElement;
      pre.textContent = p.code;
      pre.appendChild(copyBtn(() => p.code));
      list.appendChild(d);
    }
  }

  search.addEventListener("input", () => renderList());
  renderChips();
  renderList();
}
