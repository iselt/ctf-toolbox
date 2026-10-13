import { render as home } from "./pages/home";
import { render as cyberchef } from "./pages/cyberchef";
import { render as transformer } from "./pages/transformer";
import { render as classical } from "./pages/classical";
import { render as hash } from "./pages/hash";
import { render as jwt } from "./pages/jwt";
import { render as revshell } from "./pages/revshell";
import { render as payloads } from "./pages/payloads";
import { render as httpsender } from "./pages/httpsender";
import { render as rsa } from "./pages/rsa";
import { render as netcalc } from "./pages/netcalc";
import { render as misc } from "./pages/misc";
import { render as about } from "./pages/about";

export interface Tool {
  id: string;
  title: string;
  icon: string;
  group: string;
  desc?: string;
  render: (root: HTMLElement) => void;
}

export const TOOLS: Tool[] = [
  { id: "home", title: "首页", icon: "🏠", group: "常用", render: home, desc: "工具总览 + 本地记事本" },
  { id: "cyberchef", title: "CyberChef", icon: "🍳", group: "常用", render: cyberchef, desc: "完整离线版网络瑞士军刀 (v11.5.0)" },
  { id: "jwt", title: "JWT 工具箱", icon: "🔐", group: "常用", render: jwt, desc: "解码 / 验签 / 爆破 / 伪造 / RS→HS 混淆" },
  { id: "revshell", title: "反弹 Shell", icon: "🐚", group: "常用", render: revshell, desc: "25+ 语言反弹一句话 + 监听/TTY升级/msfvenom" },
  { id: "payloads", title: "Payload 速查", icon: "💉", group: "常用", render: payloads, desc: "XSS/SQLi/SSTI/LFI/SSRF 等分类速查一键复制" },
  { id: "transformer", title: "万能转换", icon: "♻️", group: "编码 & 密码", render: transformer, desc: "Base64/Hex/URL/Unicode/HTML 实时多卡片互转" },
  { id: "classical", title: "古典密码", icon: "⚗️", group: "编码 & 密码", render: classical, desc: "凯撒/ROT47/Atbash/维吉尼亚/XOR 爆破" },
  { id: "hash", title: "哈希工具", icon: "#️⃣", group: "编码 & 密码", render: hash, desc: "MD5/SHA/CRC32 计算 + 哈希识别 + 字典爆破" },
  { id: "rsa", title: "RSA 工具", icon: "🔑", group: "编码 & 密码", render: rsa, desc: "PEM 解析 / p q e→d / BigInt 教科书加解密" },
  { id: "httpsender", title: "HTTP 发送器", icon: "📡", group: "Web", render: httpsender, desc: "Burp Repeater 式手工请求 (本地/内网目标)" },
  { id: "netcalc", title: "网络计算", icon: "🌐", group: "Web", render: netcalc, desc: "子网计算 / IP 多进制 SSRF 变体 / 端口速查" },
  { id: "misc", title: "杂项工具", icon: "🧰", group: "实用", render: misc, desc: "密码生成 / 口令变形字典 / 时间戳 / UUID" },
  { id: "about", title: "关于", icon: "ℹ️", group: "实用", render: about, desc: "版本 / 许可 / 致谢" },
];
