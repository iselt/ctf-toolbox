/** Tiny DOM / UX helpers shared by all tool pages. */

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Build an element from an HTML string (first element). */
export function el(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

export function toast(msg: string): void {
  const t = el(`<div class="toast">${esc(msg)}</div>`);
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 1400);
}

export async function copyText(s: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(s);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = s;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
  toast("已复制到剪贴板");
}

/** A <button> that copies fixed-or-dynamic text. */
export function copyBtn(getText: string | (() => string), label = "复制"): HTMLButtonElement {
  const b = el(`<button class="btn mini">${esc(label)}</button>`) as HTMLButtonElement;
  b.addEventListener("click", () => void copyText(typeof getText === "function" ? getText() : getText));
  return b;
}

/** Card with title + <pre> content + copy / use-as-input buttons. */
export function outputCard(
  title: string,
  opts: { onUseAsInput?: (s: string) => void } = {}
): { root: HTMLElement; set: (text: string, cls?: string) => void; get: () => string } {
  const root = el(`<div class="card output-card"></div>`);
  const head = el(`<div class="oc-head"><span class="oc-title">${esc(title)}</span><span class="btnrow"></span></div>`);
  const pre = el(`<pre class="code"></pre>`) as HTMLElement;
  const btns = head.querySelector(".btnrow") as HTMLElement;
  btns.appendChild(copyBtn(() => pre.textContent ?? ""));
  if (opts.onUseAsInput) {
    const ub = el(`<button class="btn mini">↑ 作为输入</button>`) as HTMLButtonElement;
    ub.addEventListener("click", () => opts.onUseAsInput!(pre.textContent ?? ""));
    btns.appendChild(ub);
  }
  root.appendChild(head);
  root.appendChild(pre);
  return {
    root,
    set(text: string, cls?: string) {
      pre.textContent = text;
      pre.className = "code" + (cls ? " " + cls : "");
      btns.style.display = text ? "" : "none";
    },
    get: () => pre.textContent ?? "",
  };
}

export function debounce<A extends unknown[]>(fn: (...a: A) => void, ms: number): (...a: A) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...a: A) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/** Download text as a local file (offline, blob URL). */
export function downloadText(name: string, text: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}
