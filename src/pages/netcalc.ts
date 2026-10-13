import { el, copyBtn } from "../ui";

const ip2int = (ip: string): number => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) throw new Error("非法 IPv4: " + ip);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
};

const int2ip = (n: number): string => [24, 16, 8, 0].map((s) => (n >>> s) & 0xff).join(".");

function privateNote(n: number): string {
  const b = (n >>> 24) & 0xff;
  if (b === 10) return "A 类私网 (10.0.0.0/8)";
  if (b === 172 && ((n >>> 16) & 0xff) >= 16 && ((n >>> 16) & 0xff) <= 31) return "B 类私网 (172.16/12)";
  if (b === 192 && ((n >>> 16) & 0xff) === 168) return "C 类私网 (192.168/16)";
  if (b === 127) return "环回地址";
  if (n >= 0xa9fe0000 && n <= 0xa9feffff) return "链路本地 (169.254/16)";
  return "公网地址";
}

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  // ---------- subnet ----------
  const subCard = el(`<div class="card">
    <h3>🌐 子网计算器 (CIDR)</h3>
    <div class="row">
      <input type="text" id="sub-in" value="192.168.1.100/24" style="width:220px">
      <button class="btn primary" id="sub-run">计算</button>
    </div>
    <div class="kv" id="sub-out" style="margin-top:10px"></div>
  </div>`);
  root.appendChild(subCard);

  function runSub(): void {
    const out = subCard.querySelector("#sub-out") as HTMLElement;
    try {
      const [ipStr, maskStr] = (subCard.querySelector("#sub-in") as HTMLInputElement).value.trim().split("/");
      const ip = ip2int(ipStr);
      const prefix = maskStr === undefined ? 24 : parseInt(maskStr, 10);
      if (prefix < 0 || prefix > 32) throw new Error("前缀 0-32");
      const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
      const network = (ip & mask) >>> 0;
      const broadcast = (network | (~mask >>> 0)) >>> 0;
      const hosts = prefix >= 31 ? 2 ** (32 - prefix) : 2 ** (32 - prefix) - 2;
      const rows: [string, string][] = [
        ["网络地址", `${int2ip(network)}/${prefix}`],
        ["子网掩码", int2ip(mask)],
        ["反掩码 (wildcard)", int2ip(~mask >>> 0)],
        ["广播地址", int2ip(broadcast)],
        ["主机范围", prefix >= 31 ? int2ip(network) : `${int2ip(network + 1)} ~ ${int2ip(broadcast - 1)}`],
        ["可用主机数", String(hosts)],
        ["IP 类型", privateNote(ip)],
        ["hex", "0x" + ip.toString(16).padStart(8, "0")],
        ["int", String(ip)],
      ];
      out.innerHTML = rows.map(([k, v]) => `<span class="k">${k}</span><span class="v mono">${v}</span>`).join("");
    } catch (e) {
      out.innerHTML = '<span class="err">' + (e as Error).message + "</span>";
    }
  }
  (subCard.querySelector("#sub-run") as HTMLElement).addEventListener("click", runSub);
  runSub();

  // ---------- ip formats ----------
  const fmtCard = el(`<div class="card">
    <h3>🔀 IP 多进制表示 <span class="muted tag">SSRF 绕过 / 进制转换</span></h3>
    <div class="row">
      <input type="text" id="ip-in" value="127.0.0.1" style="width:180px">
      <button class="btn primary" id="ip-run">转换</button>
    </div>
    <div id="ip-out" style="margin-top:10px"></div>
  </div>`);
  root.appendChild(fmtCard);

  function runIp(): void {
    const out = fmtCard.querySelector("#ip-out") as HTMLElement;
    out.innerHTML = "";
    try {
      const ipStr = (fmtCard.querySelector("#ip-in") as HTMLInputElement).value.trim();
      const n = ip2int(ipStr);
      const compact = (keep: number): string => {
        const parts = int2ip(n).split(".");
        const kept = parts.slice(0, keep);
        const rest = parts.slice(keep).reduce((a, p) => a * 256 + Number(p), 0);
        return [...kept, String(rest)].join(".");
      };
      const items: [string, string][] = [
        ["点分十进制", ipStr],
        ["十进制整数", String(n)],
        ["十六进制", "0x" + n.toString(16)],
        ["八进制", "0" + n.toString(8)],
        ["二进制", n.toString(2).padStart(32, "0")],
        ["缩写 x.y", compact(2)],
        ["缩写 x.y.z", compact(3)],
      ];
      for (const [name, val] of items) {
        const row = el(`<div class="row" style="padding:3px 0">
          <span class="badge" style="width:96px;text-align:center">${name}</span>
          <span class="mono" style="flex:1">${val}</span>
        </div>`);
        row.appendChild(copyBtn(val));
        out.appendChild(row);
      }
      const urlRow = el(`<div class="row" style="padding:3px 0;margin-top:4px">
        <span class="badge g" style="width:96px;text-align:center">URL 形式</span>
        <span class="mono" style="flex:1">http://${n}/ · http://0x${n.toString(16)}/ · http://${compact(2)}/</span>
      </div>`);
      urlRow.appendChild(copyBtn(`http://${n}/`));
      out.appendChild(urlRow);
    } catch (e) {
      out.innerHTML = '<span class="err">' + (e as Error).message + "</span>";
    }
  }
  (fmtCard.querySelector("#ip-run") as HTMLElement).addEventListener("click", runIp);
  runIp();

  // ---------- common ports ----------
  const portCard = el(`<div class="card">
    <h3>📌 常用端口速查</h3>
    <table class="tbl">
      <tr><th>端口</th><th>服务</th><th>CTF 打法</th></tr>
      <tr><td>21</td><td>FTP</td><td>匿名登录 (anonymous/空)、目录穿越</td></tr>
      <tr><td>22</td><td>SSH</td><td>弱口令、用户名枚举、私钥泄露</td></tr>
      <tr><td>23</td><td>Telnet</td><td>明文凭证</td></tr>
      <tr><td>25/465/587</td><td>SMTP</td><td>用户枚举 (VRFY)、邮件伪造</td></tr>
      <tr><td>53</td><td>DNS</td><td>区域传送 AXFR、DNS 隧道</td></tr>
      <tr><td>80/443</td><td>HTTP(S)</td><td>Web 漏洞主战场</td></tr>
      <tr><td>110/143/993</td><td>POP3/IMAP</td><td>邮件取证、弱口令</td></tr>
      <tr><td>135/139/445</td><td>SMB/RPC</td><td>永恒系列、共享枚举</td></tr>
      <tr><td>1433/3306/5432</td><td>MSSQL/MySQL/PG</td><td>弱口令、UDF 提权、文件读写</td></tr>
      <tr><td>6379</td><td>Redis</td><td>未授权写 crontab/SSH key/webshell</td></tr>
      <tr><td>11211</td><td>Memcached</td><td>未授权读 session</td></tr>
      <tr><td>27017</td><td>MongoDB</td><td>未授权、NoSQL 注入</td></tr>
      <tr><td>9200</td><td>Elasticsearch</td><td>未授权读数据</td></tr>
      <tr><td>8080/8443</td><td>HTTP 备用</td><td>Tomcat/Jenkins manager 等</td></tr>
    </table>
  </div>`);
  root.appendChild(portCard);
}
