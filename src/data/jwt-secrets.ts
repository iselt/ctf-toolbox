/** Embedded weak-secret wordlist for JWT cracking (fully offline). */

export const JWT_SECRETS: string[] = [
  // jwt 生态常见默认值
  "secret", "secretkey", "secret_key", "secretKey", "jwt_secret", "jwt-secret", "jwtsecret",
  "your-256-bit-secret", "your_jwt_secret", "yourjwtsecret", "your_secret_key", "mysecret",
  "supersecret", "super_secret", "supersecretkey", "topsecret", "s3cr3t", "s3cret", "secretpassword",
  "key", "key1", "keys", "token", "tokens", "apikey", "api_key", "appkey", "app_key",
  "jwt", "jwttoken", "jwtkey", "jwt_key", "jsonwebtokensecret", "json_web_token",
  "default", "defaultsecret", "default_secret", "changeme", "change_me", "change-me",
  "password", "password123", "password1", "passw0rd", "passwd", "pass", "p@ssw0rd", "P@ssw0rd",
  "admin", "admin123", "administrator", "root", "toor", "test", "test123", "guest", "user", "login",
  "123456", "1234567", "12345678", "123456789", "1234567890", "123123", "121212", "000000", "111111",
  "abc123", "abcd1234", "aabbcc", "qwerty", "qwerty123", "qwertyuiop", "asdfgh", "zxcvbn", "1q2w3e",
  "letmein", "welcome", "monkey", "dragon", "master", "sunshine", "princess", "football",
  "iloveyou", "whatever", "computer", "internet", "hello", "helloworld", "hello123",
  // 框架/教程示例常见
  "this_is_a_secret", "thisisasecret", "my_secret_key", "mysecretkey", "the_secret", "thesecret",
  "shhh", "shhhhh", "shhhhhh", "keyboard cat", "keyboardcat", "nodejs", "node", "express",
  "django", "flask", "spring", "springboot", "java", "laravel", "rails", "gem", "dev", "development",
  "production", "prod", "staging", "qa", "insecure", "insecurekey", "notsosecret", "notasecret",
  "testsecret", "samplesecret", "demosecret", "example", "examples", "examplekey", "sample", "demo",
  // CTF 常见
  "flag", "flag{}", "ctf", "ctfsecret", "hack", "hacker", "hacked", "security", "pentest",
  "pentestlab", "vulnerable", "vuln", "challenge", "ctfchallenge", "jwtchallenge", "token_secret",
  "access_token_secret", "accesstokensecret", "auth", "authkey", "auth_key", "authsecret",
  "signingkey", "signing_key", "signkey", "sign_key", "signing", "signature", "hmac", "hmacsecret",
  "salt", "pepper", "hash", "hashkey", "crypto", "cryptosecret", "privatekey", "publickey",
  // 常见中文环境拼音
  "mima", "jiemi", "jiade", "ceshi", "ceshi123", "woaini", "woaini520", "520520", "521521",
  // 弱组合
  "secret123", "secret1234", "key123456", "testkey", "testkey123", "devkey", "devkey123",
  "1qaz2wsx", "1qaz@WSX", "qazwsx", "123321", "654321", "888888", "666666", "999999",
  "abcdef", "abcdefg", "abcdefgh", "abcdef123", "testtest", "temp", "temp123", "tmp",
  // base64/hex 变体常被误用
  "c2VjcmV0", "c2VjcmV0a2V5", "MTIzNDU2", "amVzdA==",
];
