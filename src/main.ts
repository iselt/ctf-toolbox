import "./style.css";
import { TOOLS } from "./tools";
import { el } from "./ui";

const app = document.getElementById("app")!;

app.innerHTML = "";

// ---------- layout ----------
const sidebar = el(`<aside class="sidebar">
  <div class="brand">
    <img src="/icon.png" alt="logo">
    <div><div class="t1">CTF Toolbox</div><div class="t2">100% OFFLINE</div></div>
  </div>
  <nav class="nav" id="nav"></nav>
  <div class="sidebar-foot"><span class="offline-dot"></span>无遥测 · 无网络依赖</div>
</aside>`) as HTMLElement;

const main = el(`<div class="main">
  <div class="topbar">
    <h1 id="page-title"></h1>
    <span class="desc" id="page-desc"></span>
    <span class="spacer"></span>
    <span class="badge g">Ctrl/⌘+K</span>
  </div>
  <div id="view"></div>
</div>`) as HTMLElement;

app.append(sidebar, main);

const nav = sidebar.querySelector("#nav") as HTMLElement;
const view = main.querySelector("#view") as HTMLElement;
const pageTitle = main.querySelector("#page-title") as HTMLElement;
const pageDesc = main.querySelector("#page-desc") as HTMLElement;

// ---------- nav ----------
const groups = [...new Set(TOOLS.map((t) => t.group))];
for (const g of groups) {
  nav.appendChild(el(`<div class="nav-group">${g}</div>`));
  for (const t of TOOLS.filter((x) => x.group === g)) {
    const item = el(`<div class="nav-item" data-id="${t.id}"><span class="ico">${t.icon}</span>${t.title}</div>`);
    item.addEventListener("click", () => {
      location.hash = "#/" + t.id;
    });
    nav.appendChild(item);
  }
}

function activeTool(): (typeof TOOLS)[number] {
  const id = location.hash.replace(/^#\//, "") || "home";
  return TOOLS.find((t) => t.id === id) ?? TOOLS[0];
}

function route(): void {
  const t = activeTool();
  for (const item of nav.querySelectorAll(".nav-item")) {
    (item as HTMLElement).classList.toggle("active", item.getAttribute("data-id") === t.id);
  }
  pageTitle.textContent = `${t.icon} ${t.title}`;
  pageDesc.textContent = t.desc ?? "";
  view.innerHTML = "";
  t.render(view);
  view.scrollTop = 0;
}

window.addEventListener("hashchange", route);

// ---------- command palette (Ctrl/Cmd+K) ----------
function openPalette(): void {
  if (document.querySelector(".palette-mask")) return;
  const mask = el(`<div class="palette-mask"><div class="palette">
    <input type="text" placeholder="跳转到工具… (输入名称,↑↓ 选择,回车确认)">
    <div class="p-list"></div>
  </div></div>`) as HTMLElement;
  document.body.appendChild(mask);
  const input = mask.querySelector("input") as HTMLInputElement;
  const list = mask.querySelector(".p-list") as HTMLElement;
  let sel = 0;

  function renderList(): void {
    const q = input.value.trim().toLowerCase();
    const items = TOOLS.filter((t) => !q || t.title.toLowerCase().includes(q) || (t.desc ?? "").toLowerCase().includes(q) || t.id.includes(q));
    list.innerHTML = "";
    sel = Math.min(sel, Math.max(0, items.length - 1));
    items.forEach((t, i) => {
      const it = el(`<div class="p-item ${i === sel ? "sel" : ""}"><span>${t.icon}</span><span>${t.title}</span><span class="muted small">${t.group}</span></div>`);
      it.addEventListener("click", () => {
        close();
        location.hash = "#/" + t.id;
      });
      list.appendChild(it);
    });
    (list as HTMLElement & { _items?: unknown })._items = items;
  }

  function close(): void {
    mask.remove();
  }

  input.addEventListener("input", () => {
    sel = 0;
    renderList();
  });
  input.addEventListener("keydown", (e) => {
    const items = ((list as HTMLElement & { _items?: typeof TOOLS })._items ?? []) as typeof TOOLS;
    if (e.key === "Escape") {
      close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      sel = Math.min(sel + 1, items.length - 1);
      renderList();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      sel = Math.max(sel - 1, 0);
      renderList();
    } else if (e.key === "Enter" && items[sel]) {
      close();
      location.hash = "#/" + items[sel].id;
    }
  });
  mask.addEventListener("click", (e) => {
    if (e.target === mask) close();
  });
  renderList();
  input.focus();
}

window.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    openPalette();
  }
});

route();
