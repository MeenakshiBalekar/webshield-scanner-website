export const SCAN_TYPES = {
  vuln: {
    title: 'Web Vulnerability Scanner',
    subtitle: 'Comprehensive security scan covering headers, methods, server config, and OWASP Top 10.',
    badge: 'Full Coverage',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    features: ['Security Headers', 'OWASP Top 10', 'IIS Config', 'Network Ports'],
    resultFilter: null,
    showHeatmap: false,
  },
  xss: {
    title: 'XSS Detector',
    subtitle: 'Detect missing XSS protections — Content Security Policy, X-Frame-Options, and MIME sniffing controls.',
    badge: 'XSS Protection',
    badgeColor: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    features: ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options', 'Error Disclosure'],
    resultFilter: (r) =>
      ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options', 'Error Disclosure']
        .some((k) => r.checkName?.toLowerCase().includes(k.toLowerCase())),
    showHeatmap: false,
  },
  sqli: {
    title: 'SQL Injection Tester',
    subtitle: 'Identify database exposure risks — error disclosure, sensitive file access, and directory listing.',
    badge: 'SQLi Testing',
    badgeColor: 'text-red-400 bg-red-500/10 border-red-500/30',
    features: ['Error Disclosure', 'Sensitive File Exposure', 'Directory Browsing', 'WebDAV'],
    resultFilter: (r) =>
      ['Error Disclosure', 'Sensitive Files', 'Directory Browsing', 'WebDAV']
        .some((k) => r.checkName?.toLowerCase().includes(k.toLowerCase())),
    showHeatmap: false,
  },
  owasp: {
    title: 'OWASP Scanner',
    subtitle: 'Full OWASP Top 10 compliance audit with a risk heatmap grouped by category.',
    badge: 'OWASP Top 10',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    features: ['A02 Cryptographic Failures', 'A05 Security Misconfiguration', 'A06 Vulnerable Components', 'A07 Auth Failures'],
    resultFilter: null,
    showHeatmap: true,
  },
  api: {
    title: 'API Security',
    subtitle: 'Test API endpoints for dangerous HTTP methods, WebDAV, TRACE, and missing security controls.',
    badge: 'API Testing',
    badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    features: ['TRACE Method', 'Dangerous Methods', 'WebDAV Exposure', 'Allow Header'],
    resultFilter: (r) =>
      ['TRACE', 'Method', 'WebDAV', 'Allow', 'Dangerous']
        .some((k) => r.checkName?.toLowerCase().includes(k.toLowerCase())),
    showHeatmap: false,
  },
}

export const getScanType = (type) => SCAN_TYPES[type] || SCAN_TYPES.vuln
