import { el, copyBtn } from "../ui";
import { REV_SHELLS, LISTENERS, TTY_UPGRADES, MSFVENOM } from "../data/revshell";

function subst(cmd: string, ip: string, port: string): string {
  return cmd.replaceAll("{ip}", ip).replaceAll("{port}", port);
}

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  const bar = el(`<div class="card">
    <h3>🎯 目标参数 <span class="muted tag">自动替换所有 payload 中的 {ip} / {port}</span></h3>
    <div class="row">
      <label class="fld" style="margin:0"><span class="lb">LHOST 本机 IP</span><input type="text" id="rs-ip" value="10.10.14.1" style="width:170px"></label>
      <label class="fld" style="margin:0"><span class="lb">LPORT 端口</span><input type="number" id="rs-port" value="9001" style="width:110px"></label>
      <label class="fld" style="margin:0"><span class="lb">搜索语言</span><input type="text" id="rs-filter" placeholder="bash / nc / php..." style="width:180px"></label>
      <label class="ck"><input type="checkbox" id="rs-upper" checked> 显示命令行提示</label>
    </div>
  </div>`);
  root.appendChild(bar);

  const listWrap = el(`<div id="rs-list"></div>`);
  root.appendChild(listWrap);

  const listenerCard = el(`<div class="card">
    <h3>🎧 监听命令</h3><div id="ls-list"></div>
  </div>`);
  root.appendChild(listenerCard);

  const ttyCard = el(`<div class="card">
    <h3>⬆️ 交互式 TTY 升级</h3><div id="tty-list"></div>
  </div>`);
  root.appendChild(ttyCard);

  const msfCard = el(`<div class="card">
    <h3>🎁 msfvenom 生成器 <span class="muted tag">LHOST/LPORT 同步替换</span></h3><div id="msf-list"></div>
  </div>`);
  root.appendChild(msfCard);

  function cmdBlock(name: string, cmd: string, note?: string): HTMLElement {
    const d = el(`<details class="payload">
      <summary><span>${name}</span><span class="muted small">点击展开 · 一键复制</span></summary>
      <div class="body">
        <div class="copy-source"><pre class="code"></pre></div>
        ${note ? `<div class="small muted" style="margin-top:6px">💡 ${note}</div>` : ""}
      </div>
    </details>`) as HTMLElement;
    const pre = d.querySelector("pre") as HTMLElement;
    pre.textContent = cmd;
    pre.appendChild(copyBtn(() => pre.textContent ?? ""));
    return d;
  }

  function renderAll(): void {
    const ip = (bar.querySelector("#rs-ip") as HTMLInputElement).value.trim() || "0.0.0.0";
    const port = (bar.querySelector("#rs-port") as HTMLInputElement).value.trim() || "4444";
    const q = (bar.querySelector("#rs-filter") as HTMLInputElement).value.trim().toLowerCase();

    listWrap.innerHTML = "";
    for (const s of REV_SHELLS) {
      if (q && !s.lang.toLowerCase().includes(q) && !s.cmd.toLowerCase().includes(q)) continue;
      listWrap.appendChild(cmdBlock(s.lang, subst(s.cmd, ip, port), s.note));
    }

    const lsList = listenerCard.querySelector("#ls-list") as HTMLElement;
    lsList.innerHTML = "";
    for (const l of LISTENERS) lsList.appendChild(cmdBlock(l.name, subst(l.cmd, ip, port), l.note));

    const ttyList = ttyCard.querySelector("#tty-list") as HTMLElement;
    ttyList.innerHTML = "";
    for (const t of TTY_UPGRADES) ttyList.appendChild(cmdBlock(t.name, subst(t.cmd, ip, port), t.note));

    const msfList = msfCard.querySelector("#msf-list") as HTMLElement;
    msfList.innerHTML = "";
    for (const m of MSFVENOM) msfList.appendChild(cmdBlock(m.name, subst(m.cmd, ip, port)));
  }

  for (const id of ["#rs-ip", "#rs-port", "#rs-filter"]) {
    (bar.querySelector(id) as HTMLElement).addEventListener("input", renderAll);
  }
  renderAll();
}
