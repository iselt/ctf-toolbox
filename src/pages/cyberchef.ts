import { el } from "../ui";

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  const wrap = el(`<div>
    <div id="cc-missing" class="notice" style="display:none">
      未检测到 CyberChef 静态资源。开发模式下请先运行 <span class="mono">npm run fetch:cyberchef</span>;
      正式 Release 构建已自动内嵌。
    </div>
    <div class="tool-iframe-wrap"><iframe id="cc-frame" src="cyberchef/index.html"></iframe></div>
  </div>`);
  root.appendChild(wrap);

  void fetch("cyberchef/index.html", { method: "HEAD" }).then((r) => {
    if (!r.ok) {
      const n = wrap.querySelector("#cc-missing") as HTMLElement;
      n.style.display = "";
      (wrap.querySelector("#cc-frame") as HTMLIFrameElement).style.display = "none";
    }
  }).catch(() => {
    /* iframe will show its own error */
  });
}
