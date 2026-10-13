import { el, outputCard } from "../ui";
import {
  te, b64encode, b64decode, b64urlEncode, b64urlDecode,
  base32Encode, base32Decode, toHex, fromHex, toBinary, toDecimal,
  hexdump, latin1ToBytes, unicodeEscape, unicodeUnescape,
  htmlEntityEncode, htmlEntityDecode, tryUtf8, latin1, detectEncoding,
} from "../lib/b64";

function rot13(s: string): string {
  return s.replace(/[a-zA-Z]/g, (c) => {
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

export function render(root: HTMLElement): void {
  root.innerHTML = "";

  root.appendChild(
    el(`<div class="card">
      <h3>📥 输入 <span class="muted tag">任意文本,下方所有卡片实时转换</span></h3>
      <textarea id="in" class="big" placeholder="粘贴任何内容:base64 / hex / URL 编码 / 乱码 / JWT..."></textarea>
      <div class="btnrow" id="in-actions"></div>
      <div id="detect" class="small muted"></div>
    </div>`)
  );

  const input = root.querySelector("#in") as HTMLTextAreaElement;
  const detect = root.querySelector("#detect") as HTMLElement;

  const setInput = (s: string) => {
    input.value = s;
    run();
  };

  const cardsGrid = el('<div class="cards-grid"></div>');
  root.appendChild(cardsGrid);

  interface CardDef {
    title: string;
    run: (s: string) => string;
  }
  const defs: CardDef[] = [
    { title: "URL 编码 (安全字符)", run: (s) => encodeURIComponent(s) },
    { title: "URL 编码 (全部)", run: (s) => [...te.encode(s)].map((b) => "%" + b.toString(16).padStart(2, "0").toUpperCase()).join("") },
    { title: "URL 解码", run: (s) => decodeURIComponent(s.replace(/\+/g, " ")) },
    { title: "Base64 编码", run: (s) => b64encode(te.encode(s)) },
    { title: "Base64 解码 → UTF-8", run: (s) => tryUtf8(b64decode(s)) },
    { title: "Base64 解码 → Latin1", run: (s) => latin1(b64decode(s)) },
    { title: "Base64URL 编码", run: (s) => b64urlEncode(te.encode(s)) },
    { title: "Base64URL 解码", run: (s) => tryUtf8(b64urlDecode(s)) },
    { title: "Base32 编码", run: (s) => base32Encode(te.encode(s)) },
    { title: "Base32 解码", run: (s) => tryUtf8(base32Decode(s)) },
    { title: "Hex 编码", run: (s) => toHex(te.encode(s)) },
    { title: "Hex 编码 (带空格)", run: (s) => toHex(te.encode(s), " ") },
    { title: "Hex 解码", run: (s) => tryUtf8(fromHex(s)) },
    { title: "二进制 (8bit)", run: (s) => toBinary(te.encode(s)) },
    { title: "十进制字节", run: (s) => toDecimal(te.encode(s)) },
    { title: "Unicode \\u 转义", run: (s) => unicodeEscape(s) },
    { title: "Unicode 反转义", run: (s) => unicodeUnescape(s) },
    { title: "HTML 实体编码 (符号)", run: (s) => htmlEntityEncode(s, false) },
    { title: "HTML 实体编码 (全部)", run: (s) => htmlEntityEncode(s, true) },
    { title: "HTML 实体解码", run: (s) => htmlEntityDecode(s) },
    { title: "ROT13", run: (s) => rot13(s) },
    { title: "字符串反转", run: (s) => [...s].reverse().join("") },
    { title: "Mojibake 修复", run: (s) => tryUtf8(latin1ToBytes(s)), },
    { title: "Hexdump 视图", run: (s) => hexdump(te.encode(s)) },
  ];

  const cards = defs.map((d) => {
    const c = outputCard(d.title, { onUseAsInput: setInput });
    cardsGrid.appendChild(c.root);
    return c;
  });

  // extra actions on input
  const actions = root.querySelector("#in-actions") as HTMLElement;
  const clearBtn = el('<button class="btn mini">清空</button>');
  clearBtn.addEventListener("click", () => setInput(""));
  actions.append(clearBtn);

  function run(): void {
    const s = input.value;
    const notes = detectEncoding(s);
    detect.innerHTML = notes.length
      ? "💡 " + notes.map((n) => `<span class="badge y">${n}</span>`).join(" ")
      : "";
    defs.forEach((d, i) => {
      if (!s) {
        cards[i].set("");
        return;
      }
      try {
        const out = d.run(s);
        cards[i].set(out === "" && s ? "(空结果)" : out);
      } catch (e) {
        cards[i].set("⚠ " + (e as Error).message, "err");
      }
    });
  }

  input.addEventListener("input", run);
  setInput("CTF Toolbox");
}
