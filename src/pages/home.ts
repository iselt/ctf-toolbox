import { el } from "../ui";
import { TOOLS } from "../tools";

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  root.appendChild(
    el(`<div style="margin-bottom:18px">
      <div style="font-size:22px;font-weight:700;letter-spacing:.5px">CTF Toolbox</div>
      <div class="muted" style="margin-top:6px">
        <span class="offline-dot"></span>100% 离线 · Web/杂项/Crypto 常用工具集 · 按 <span class="mono accent">Ctrl/⌘+K</span> 快速跳转
      </div>
    </div>`)
  );

  const grid = el('<div class="home-grid"></div>');
  for (const t of TOOLS) {
    if (t.id === "home") continue;
    const c = el(`<div class="home-card">
      <div class="hc-title"><span>${t.icon}</span>${t.title}</div>
      <div class="hc-desc">${t.desc ?? ""}</div>
    </div>`);
    c.addEventListener("click", () => {
      location.hash = "#/" + t.id;
    });
    grid.appendChild(c);
  }
  root.appendChild(grid);

  // notepad, persisted in localStorage
  const card = el(`<div class="card" style="margin-top:18px">
    <h3>🗒️ 临时记事本 <span class="badge g">本地存储 · 不出网</span></h3>
    <textarea id="np" class="big" placeholder="flag{...} / 思路 / 目标信息...自动保存在本地"></textarea>
  </div>`);
  root.appendChild(card);
  const ta = card.querySelector("#np") as HTMLTextAreaElement;
  ta.value = localStorage.getItem("ctf-notepad") ?? "";
  ta.addEventListener("input", () => localStorage.setItem("ctf-notepad", ta.value));
}
