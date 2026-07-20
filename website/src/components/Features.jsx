import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, Cloud, Code2, Brain, Shield, FileText, CheckCircle2, ArrowRight } from 'lucide-react'

const features = [
  {
    icon: Globe,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    title: 'Web & API Security',
    description:
      'OWASP Top 10, HTTP security headers, TLS/SSL grading, cookie flags, API authentication, and CORS policy — with live scan progress and per-finding severity.',
    points: ['OWASP Top 10 (2024)', 'TLS/SSL grading', 'API auth & CORS', 'Per-finding severity ratings'],
    route: '/products/web',
  },
  {
    icon: Cloud,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    title: 'Cloud Security',
    description:
      'Configuration auditing for AWS (EC2, S3, RDS, IAM, CloudTrail), Azure, GCP, and Oracle Cloud. Catches public buckets, open security groups, and missing MFA.',
    points: ['AWS, Azure, GCP, OCI', 'Public bucket detection', 'Open security groups', 'IAM & MFA checks'],
    route: '/products/cloud',
  },
  {
    icon: Code2,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    title: 'Code & DevSecOps',
    description:
      'IaC scanning (Terraform, CloudFormation), Dockerfile hardening, Kubernetes RBAC, secrets detection, SAST, and CI/CD pipeline security.',
    points: ['Terraform & CloudFormation', 'Secrets detection', 'Kubernetes RBAC', 'CI/CD pipeline checks'],
    route: '/products/code',
  },
  {
    icon: Brain,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    title: 'Threat Intelligence',
    description:
      'MITRE ATT&CK mapping, IOC checking via AbuseIPDB and VirusTotal, CISA Known Exploited Vulnerabilities feed, EPSS exploitation scoring, and Shodan host enrichment.',
    points: ['MITRE ATT&CK mapping', 'AbuseIPDB & VirusTotal', 'CISA KEV feed', 'EPSS scoring'],
    route: '/threat',
  },
  {
    icon: Shield,
    color: 'text-crimson-600',
    bg: 'bg-red-50',
    title: 'Security Operations',
    description:
      'Full VMDR workflow — score vulnerabilities (0–100, A–F grade), track remediation, integrate with SIEM (Splunk/Elastic), and receive Slack and email alerts.',
    points: ['VMDR remediation tracking', 'A–F risk grading', 'SIEM integration', 'Slack & email alerts'],
    route: '/products/vmdr',
  },
  {
    icon: FileText,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    title: 'Compliance Reports',
    description:
      'Automated PCI-DSS, ISO 27001, SOC 2 Type II, and HIPAA gap analysis. PDF reports and scheduled email delivery for your auditors and exec team.',
    points: ['PCI-DSS, ISO 27001', 'SOC 2 Type II & HIPAA', 'PDF & email delivery', 'Scheduled reporting'],
    route: '/reports',
  },
]

export default function Features() {
  const navigate = useNavigate()

  return (
    <section id="products" className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <span className="section-tag">Platform Capabilities</span>
          <h2 className="section-heading mb-4">
            Complete Security Coverage
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            One platform to detect, prioritize, and remediate security risks across your web apps, cloud, code, and endpoints — with compliance reporting built in.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${f.color}`} />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">{f.description}</p>
                <ul className="space-y-1.5 mb-5">
                  {f.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(f.route)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-crimson-500 hover:gap-2 transition-all"
                >
                  Learn more <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
