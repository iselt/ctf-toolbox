# CTF Toolbox

**100% 离线运行的 CTF 工具箱**(主打 Web 方向)。基于 Tauri 2 —— Rust 壳 + 系统 WebView,安装包 ~10-25 MB、内存占用远低于 Electron,启动秒开。

> 📴 应用运行时**零网络依赖**:所有计算、数据、CyberChef 完整版全部内嵌本地。唯一的例外是「HTTP 发送器」按你的指令访问你指定的目标(通常是本地靶机)。

## 内置工具

| 分类 | 工具 | 说明 |
|------|------|------|
| 🍳 | **CyberChef v11.5.0** | GCHQ 官方完整离线版,300+ 操作的"网络瑞士军刀" |
| 🔐 | **JWT 工具箱** | 比 jwt.io 更顺手:解码(时间字段人性化)/ HS256·384·512 验签 / 内置字典爆破 / 伪造签发 / **RS256→HS256 公钥混淆** |
| 🐚 | **反弹 Shell 生成器** | 25+ 语言一句话(自动替换 LHOST/LPORT)+ 监听命令 + TTY 交互升级 + msfvenom 全家桶,对标 0dayCTF/reverse-shell-generator |
| 💉 | **Payload 速查** | XSS / SQLi / 命令注入 / SSTI / LFI / 文件上传 / SSRF / XXE / 请求头 / 反序列化,搜索 + 分类 + 一键复制 |
| ♻️ | **万能转换** | Base64/URL/Hex/Base32/Unicode/HTML 实体/二进制/mojibake 修复/hexdump,24 张卡片实时互转 |
| ⚗️ | **古典密码** | 凯撒暴力 / ROT47 / Atbash / 维吉尼亚 / XOR(循环密钥 + 单字节爆破) |
| #️⃣ | **哈希工具** | MD5/SHA-1/256/384/512/CRC32、哈希类型识别、目标比对、内置字典爆破 |
| 🔑 | **RSA 工具** | PEM 公私钥解析(PKCS#1/#8)、p q e → d 计算、BigInt 教科书加解密 |
| 📡 | **HTTP 发送器** | Burp Repeater 式手工请求,本地直连无 CORS(适合内网/本机靶机) |
| 🌐 | **网络计算** | 子网 CIDR 计算、IP 多进制(SSRF 绕过变体一键生成)、常用端口速查 |
| 🧰 | **杂项** | 密码生成(熵估算)、口令变形字典(leet/年份/后缀)、时间戳转换、UUID |

快捷键 `Ctrl/⌘ + K` 任意页面秒跳工具。

## 下载安装

到 [Releases](../../releases) 页面按平台下载:

| 平台 | 文件 |
|------|------|
| macOS Apple Silicon | `*_aarch64.dmg` |
| macOS Intel | `*_x64.dmg` |
| Linux | `.deb` / `.rpm` / `.AppImage` |
| Windows | `*-setup.exe` / `.msi`(内嵌 WebView2 离线安装器,无网环境也能装) |

- **macOS 未签名**:首次打开请右键 → 打开(或 `xattr -cr /Applications/CTF\ Toolbox.app`)。
- **Windows 未签名**:SmartScreen 提示时选「仍要运行」。

## 本地开发

```bash
npm install                 # 前端依赖
npm run fetch:cyberchef     # 拉取锁定版本的 CyberChef (SHA256 校验,仅构建时联网)
npm run tauri dev           # 开发运行
npm run tauri build         # 打包
```

依赖:Node 20+、Rust stable、(macOS)Xcode CLT / (Linux)webkit2gtk-4.1 / (Windows)WebView2。

## 发布

推送 `v*` tag 自动触发 GitHub Actions,四平台全量构建并发布 Release:

```bash
git tag v1.0.1 && git push origin v1.0.1
```

## 许可

- 本项目代码:MIT
- 内嵌的 CyberChef:Apache License 2.0 © Crown Copyright GCHQ
- Payload/反弹 Shell 数据整理自公开速查表(pentestmonkey、PayloadsAllTheThings、OWASP 等)

仅用于授权的 CTF 竞赛、安全教学与自有环境测试。
