import { el } from "../ui";

export function render(root: HTMLElement): void {
  root.innerHTML = "";
  root.appendChild(
    el(`<div>
      <div class="card">
        <h3>ℹ️ CTF Toolbox v1.0.0</h3>
        <div class="kv">
          <span class="k">定位</span><span class="v">100% 离线运行的 CTF 常用工具箱,主打 Web 方向</span>
          <span class="k">运行依赖</span><span class="v">无 —— 不联网、不更新、不上传;所有计算在本地完成</span>
          <span class="k">技术栈</span><span class="v">Tauri 2 (Rust 壳 + 系统 WebView) + 原生 TypeScript,无 Electron</span>
          <span class="k">体积</span><span class="v">安装包 ≈ 10-25 MB (Windows 因内嵌 WebView2 离线安装器更大)</span>
          <span class="k">例外说明</span><span class="v">仅 HTTP 发送器按你的指令访问指定目标 (通常为本地靶机),应用自身永不联网</span>
        </div>
      </div>
      <div class="card">
        <h3>📦 致谢 / 第三方组件</h3>
        <div class="kv">
          <span class="k">CyberChef</span><span class="v">GCHQ · Apache License 2.0 · 内嵌 v11.5.0 完整离线版</span>
          <span class="k">反弹 Shell 数据</span><span class="v">pentestmonkey / 0dayCTF/reverse-shell-generator / PayloadsAllTheThings</span>
          <span class="k">Payload 速查</span><span class="v">swisskyrepo/PayloadsAllTheThings、OWASP、PortSwigger Web Security Academy</span>
          <span class="k">Tauri</span><span class="v">MIT / Apache License 2.0</span>
        </div>
        <div class="small muted" style="margin-top:8px">
          本工具仅用于授权的 CTF 竞赛、安全教学与自有环境测试。请遵守当地法律与目标授权范围。
        </div>
      </div>
      <div class="card">
        <h3>⌨️ 快捷键</h3>
        <div class="kv">
          <span class="k">Ctrl / ⌘ + K</span><span class="v">打开工具快速跳转面板</span>
          <span class="k">Esc</span><span class="v">关闭面板</span>
        </div>
      </div>
    </div>`)
  );
}
