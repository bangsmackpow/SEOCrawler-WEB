/**
 * SEO Report HTML Renderer
 * Ported from Python to TypeScript for Cloudflare Workers
 */

interface ReportData {
  client: string
  period: string
  domain: string
  overallScore: number
  pagesCrawled: number
  sitemapUrls: number
  categories: { name: string; score: number; status: string }[]
  issues: { severity: string; category: string; issue: string; impact: string }[]
  keywords: { keyword: string; intent: string; searchVolume: string }[]
  trafficUplift: string
  criticalCount: number
  highCount: number
  mediumCount: number
}

// Utility functions
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function scoreColor(score: number): string {
  if (score <= 30) return '#ef4444'
  if (score <= 55) return '#f59e0b'
  if (score <= 75) return '#3b82f6'
  return '#10b981'
}

function scoreStatus(score: number): [string, string] {
  if (score <= 30) return ['Critical', 'status-critical']
  if (score <= 55) return ['Needs Work', 'status-needs-work']
  if (score <= 75) return ['Good', 'status-good']
  return ['Excellent', 'status-excellent']
}

function severityClass(sev: string): string {
  const s = sev.toLowerCase()
  if (s === 'critical') return 'severity-critical'
  if (s === 'high') return 'severity-high'
  if (s === 'medium') return 'severity-medium'
  return 'severity-low'
}

function intentClass(intent: string): string {
  const i = intent.toLowerCase()
  if (i.includes('transactional')) return 'intent-transactional'
  if (i.includes('local')) return 'intent-local'
  if (i.includes('branded')) return 'intent-branded'
  return 'intent-commercial'
}

// Build SVG score ring
function buildScoreRing(score: number, size = 160): string {
  const r = size / 2 - 10
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 100)
  const color = scoreColor(score)
  
  return `<svg class="score-ring" viewBox="0 0 ${size} ${size}" style="width:${size}px;height:${size}px;">
    <circle class="track" cx="${size/2}" cy="${size/2}" r="${r}"/>
    <circle class="fill" cx="${size/2}" cy="${size/2}" r="${r}" stroke="${color}" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${offset.toFixed(2)}" transform="rotate(-90 ${size/2} ${size/2})"/>
    <text class="score-text" x="${size/2}" y="${size/2}" text-anchor="middle" dominant-baseline="central">${score}</text>
    <text class="score-suffix" x="${size/2}" y="${size/2 + 20}" text-anchor="middle">/100</text>
  </svg>`
}

// Parse markdown to sections (simplified)
function extractSections(mdText: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const lines = mdText.split('\n')
  let currentHeading = ''
  let currentContent: string[] = []
  
  for (const line of lines) {
    const match = line.match(/^##\s+(.+)$/)
    if (match) {
      if (currentHeading) {
        sections[currentHeading] = currentContent.join('\n').trim()
      }
      currentHeading = match[1].trim()
      currentContent = []
    } else {
      currentContent.push(line)
    }
  }
  if (currentHeading) {
    sections[currentHeading] = currentContent.join('\n').trim()
  }
  return sections
}

// Extract score from markdown
function extractOverallScore(mdText: string): number {
  const match = mdText.match(/(?:Overall\s+SEO\s+Health\s+Score|SEO\s+Health\s+Score)[:\s]*\*?\*?(\d+)\/100/)
  return match ? parseInt(match[1]) : 0
}

export function renderSeoReport(data: ReportData): string {
  const { client, period, domain, overallScore, pagesCrawled, sitemapUrls, categories, issues, keywords, trafficUplift, criticalCount, highCount, mediumCount } = data

  const scoreRing = buildScoreRing(overallScore)
  
  // Build category cards
  const categoryCards = categories.map(cat => {
    const [statusText, statusClass] = scoreStatus(cat.score)
    return `<div class="score-card">
      <div class="score-card-top">
        <h3>${escapeHtml(cat.name)}</h3>
        <span class="status-badge ${statusClass}">${statusText}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" style="width:${cat.score}%;background:${scoreColor(cat.score)}"></div>
      </div>
      <div class="score-card-bottom">
        <span class="score-num">${cat.score}</span>
        <span class="score-card-desc">${escapeHtml(cat.status)}</span>
      </div>
    </div>`
  }).join('')

  // Build issues table
  const issuesTable = issues.length > 0 ? `<table class="data-table">
    <thead><tr><th>#</th><th>Severity</th><th>Category</th><th>Issue</th><th>Impact</th></tr></thead>
    <tbody>
      ${issues.map((issue, i) => `<tr>
        <td>${i + 1}</td>
        <td><span class="severity ${severityClass(issue.severity)}">${escapeHtml(issue.severity)}</span></td>
        <td>${escapeHtml(issue.category)}</td>
        <td>${escapeHtml(issue.issue)}</td>
        <td>${escapeHtml(issue.impact)}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''

  // Build keyword table
  const keywordsTable = keywords.length > 0 ? `<table class="data-table">
    <thead><tr><th>Keyword</th><th>Intent</th><th>Search Volume</th></tr></thead>
    <tbody>
      ${keywords.map(kw => `<tr>
        <td>${escapeHtml(kw.keyword)}</td>
        <td><span class="intent-badge ${intentClass(kw.intent)}">${escapeHtml(kw.intent)}</span></td>
        <td>${escapeHtml(kw.searchVolume)}</td>
      </tr>`).join('')}
    </tbody>
  </table>` : ''

  const CSS = `:root {
    --bg: #fafafa; --surface: #ffffff; --ink: #09090b; --body: #3f3f46;
    --muted: #71717a; --border: #e4e4e7; --border-subtle: #f4f4f5;
    --indigo: #6366f1; --indigo-light: #a5b4fc; --emerald: #10b981;
    --amber: #f59e0b; --red: #ef4444; --sky: #0ea5e9;
    --radius: 16px; --radius-sm: 10px;
    --shadow: 0 1px 3px rgba(0,0,0,.04), 0 1px 2px rgba(0,0,0,.06);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: var(--body); background: var(--bg); line-height: 1.6; }
  .report { max-width: 1140px; margin: 0 auto; padding: 24px 20px 80px; }
  strong { color: var(--ink); }
  a { color: var(--indigo); }

  .hero { background: linear-gradient(135deg, #09090b 0%, #18181b 40%, #1e1b4b 100%); border-radius: 24px; padding: 48px; color: #fff; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,.15), transparent 70%); top: -300px; right: -100px; }
  .hero-inner { display: flex; justify-content: space-between; align-items: center; gap: 40px; position: relative; z-index: 1; }
  .badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--indigo-light); background: rgba(99,102,241,.12); border: 1px solid rgba(99,102,241,.2); border-radius: 999px; padding: 6px 14px; margin-bottom: 16px; }
  .hero h1 { font-size: clamp(32px, 5vw, 48px); font-weight: 900; letter-spacing: -.03em; line-height: 1.05; color: #fff; }
  .hero-sub { color: rgba(255,255,255,.65); font-size: 17px; margin-top: 10px; }
  .hero-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 16px; }
  .chip { font-size: 12px; font-weight: 500; color: rgba(255,255,255,.75); background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); border-radius: 999px; padding: 6px 14px; }
  .hero-score { text-align: center; flex-shrink: 0; }
  .hero-score p { color: rgba(255,255,255,.5); font-size: 13px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; margin-top: 8px; }
  .score-ring .track { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 10; }
  .score-ring .fill { fill: none; stroke-width: 10; stroke-linecap: round; }
  .score-ring .score-text { fill: #fff; font-family: 'Inter', sans-serif; font-weight: 900; font-size: 38px; }
  .score-ring .score-suffix { fill: rgba(255,255,255,.45); font-family: 'Inter', sans-serif; font-weight: 600; font-size: 16px; }

  .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-top: 20px; }
  .kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
  .kpi-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); }
  .kpi-value { font-size: 32px; font-weight: 800; color: var(--ink); margin-top: 6px; line-height: 1; }
  .kpi-desc { font-size: 13px; color: var(--muted); margin-top: 6px; }

  .section { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 32px; margin-top: 16px; box-shadow: var(--shadow); }
  .section-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
  .section-num { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; background: linear-gradient(135deg, var(--indigo), #818cf8); color: #fff; border-radius: 10px; font-size: 14px; font-weight: 800; flex-shrink: 0; }
  .section h2 { font-size: 22px; font-weight: 800; letter-spacing: -.02em; color: var(--ink); }

  .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 12px; margin-top: 8px; }
  .score-card { border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 20px; display: flex; flex-direction: column; gap: 10px; }
  .score-card-top { display: flex; justify-content: space-between; align-items: center; }
  .score-card h3 { font-size: 15px; font-weight: 700; color: var(--ink); margin: 0; }
  .status-badge { font-size: 11px; font-weight: 700; letter-spacing: .04em; padding: 4px 10px; border-radius: 999px; }
  .status-critical { background: #fef2f2; color: #dc2626; }
  .status-needs-work { background: #fffbeb; color: #d97706; }
  .status-good { background: #ecfdf5; color: #059669; }
  .status-excellent { background: #eff6ff; color: #2563eb; }
  .progress-track { height: 6px; background: var(--border-subtle); border-radius: 99px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 99px; }
  .score-card-bottom { display: flex; align-items: baseline; gap: 10px; }
  .score-num { font-size: 28px; font-weight: 800; color: var(--ink); flex-shrink: 0; line-height: 1; }
  .score-card-desc { font-size: 13px; color: var(--muted); }

  .data-table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
  .data-table thead th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); padding: 10px 14px; border-bottom: 2px solid var(--border); background: var(--border-subtle); }
  .data-table tbody td { padding: 12px 14px; border-bottom: 1px solid var(--border); }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover { background: #fafafa; }

  .severity { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; letter-spacing: .03em; padding: 3px 10px; border-radius: 999px; }
  .severity-critical { background: #fef2f2; color: #dc2626; }
  .severity-high { background: #fff7ed; color: #ea580c; }
  .severity-medium { background: #fffbeb; color: #d97706; }
  .severity-low { background: #f0fdf4; color: #16a34a; }

  .intent-badge { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
  .intent-commercial { background: #eff6ff; color: #2563eb; }
  .intent-transactional { background: #f0fdf4; color: #059669; }
  .intent-local { background: #faf5ff; color: #7c3aed; }
  .intent-branded { background: #fefce8; color: #a16207; }

  .report-footer { margin-top: 24px; padding: 24px 32px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--muted); }

  @media (max-width: 700px) { .hero { padding: 32px 24px; } .hero-inner { flex-direction: column; text-align: center; } .section { padding: 24px 20px; } .score-grid { grid-template-columns: 1fr; } }
  @media print { body { background: #fff; } .report { padding: 0; max-width: none; } .hero { border-radius: 0; box-shadow: none; } .section, .kpi { box-shadow: none; } }`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SEO Audit Report — ${escapeHtml(client)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
<div class="report">
  <header class="hero">
    <div class="hero-inner">
      <div>
        <div class="badge">SEO Audit Report</div>
        <h1>Website Health<br>Assessment</h1>
        <p class="hero-sub">${escapeHtml(client)} — ${escapeHtml(domain)}</p>
        <div class="hero-chips">
          <span class="chip">Prepared ${escapeHtml(period)}</span>
          <span class="chip">${pagesCrawled} Pages Analyzed</span>
          ${sitemapUrls ? `<span class="chip">${sitemapUrls} Sitemap URLs</span>` : ''}
        </div>
      </div>
      <div class="hero-score">
        ${scoreRing}
        <p>Overall Health</p>
      </div>
    </div>
  </header>

  <section class="kpis">
    <div class="kpi"><div class="kpi-label">Pages Crawled</div><div class="kpi-value">${pagesCrawled || '—'}</div><div class="kpi-desc">of ${sitemapUrls || '—'} sitemap URLs</div></div>
    <div class="kpi"><div class="kpi-label">Critical Issues</div><div class="kpi-value" style="color:var(--red)">${criticalCount}</div><div class="kpi-desc">Require immediate action</div></div>
    <div class="kpi"><div class="kpi-label">Warnings</div><div class="kpi-value" style="color:var(--amber)">${highCount + mediumCount}</div><div class="kpi-desc">${highCount} high · ${mediumCount} medium</div></div>
    <div class="kpi"><div class="kpi-label">Traffic Uplift</div><div class="kpi-value" style="color:var(--emerald)">${trafficUplift || 'N/A'}</div><div class="kpi-desc">Projected at 90 days</div></div>
  </section>

  <section class="section">
    <div class="section-header"><span class="section-num">01</span><h2>Score Breakdown</h2></div>
    <div class="score-grid">${categoryCards}</div>
  </section>

  ${issuesTable ? `<section class="section">
    <div class="section-header"><span class="section-num">02</span><h2>Critical Issues Log</h2></div>
    ${issuesTable}
  </section>` : ''}

  ${keywordsTable ? `<section class="section">
    <div class="section-header"><span class="section-num">03</span><h2>Keyword Opportunities</h2></div>
    ${keywordsTable}
  </section>` : ''}

  <footer class="report-footer">
    <div><strong>Confidential</strong> — Prepared for ${escapeHtml(client)}</div>
    <div>Generated ${escapeHtml(period)}</div>
  </footer>
</div>
</body>
</html>`
}

export function renderOnePager(data: ReportData): string {
  const { client, period, domain, overallScore, trafficUplift } = data
  const scoreRing = buildScoreRing(overallScore, 120)
  
  const CSS = `:root {
    --bg: #fafafa; --surface: #ffffff; --ink: #09090b; --body: #3f3f46;
    --muted: #71717a; --border: #e4e4e7; --border-subtle: #f4f4f5;
    --indigo: #6366f1; --emerald: #10b981; --amber: #f59e0b; --red: #ef4444;
    --radius: 16px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', system-ui, sans-serif; color: var(--body); background: var(--bg); line-height: 1.6; }
  .page { max-width: 900px; margin: 0 auto; padding: 24px 20px 64px; }
  strong { color: var(--ink); }

  .hero { background: linear-gradient(135deg, #09090b 0%, #18181b 40%, #1e1b4b 100%); border-radius: 24px; padding: 48px; color: #fff; position: relative; }
  .hero::before { content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(99,102,241,.15), transparent 70%); top: -300px; right: -100px; }
  .hero-inner { display: flex; justify-content: space-between; align-items: center; gap: 40px; position: relative; z-index: 1; }
  .badge { display: inline-flex; font-size: 11px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: var(--indigo-light); background: rgba(99,102,241,.12); border: 1px solid rgba(99,102,241,.2); border-radius: 999px; padding: 6px 14px; margin-bottom: 16px; }
  .hero h1 { font-size: clamp(32px, 5vw, 48px); font-weight: 900; color: #fff; }
  .hero-sub { color: rgba(255,255,255,.65); font-size: 17px; margin-top: 10px; }
  .hero-chips { display: flex; gap: 8px; margin-top: 16px; }
  .chip { font-size: 12px; color: rgba(255,255,255,.75); background: rgba(255,255,255,.07); border-radius: 999px; padding: 6px 14px; }
  .hero-score { text-align: center; }
  .hero-score p { color: rgba(255,255,255,.5); font-size: 13px; text-transform: uppercase; margin-top: 8px; }
  .score-ring .track { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 8; }
  .score-ring .fill { fill: none; stroke-width: 8; stroke-linecap: round; }
  .score-ring .score-text { fill: #fff; font-weight: 900; font-size: 32px; }
  .score-ring .score-suffix { fill: rgba(255,255,255,.45); font-size: 14px; }

  .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 16px; }
  .metric { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; text-align: center; }
  .metric-value { font-size: 28px; font-weight: 800; color: var(--ink); }
  .metric-label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--muted); margin-top: 4px; }

  @media (max-width: 700px) { .hero { padding: 32px 24px; } .hero-inner { flex-direction: column; } .metrics { grid-template-columns: 1fr; } }`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>SEO Executive Summary — ${escapeHtml(client)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
<div class="page">
  <header class="hero">
    <div class="hero-inner">
      <div>
        <div class="badge">Executive Summary</div>
        <h1>SEO Health Snapshot</h1>
        <p class="hero-sub">${escapeHtml(client)} — ${escapeHtml(domain)}</p>
        <div class="hero-chips"><span class="chip">${escapeHtml(period)}</span></div>
      </div>
      <div class="hero-score">
        ${scoreRing}
        <p>Health Score</p>
      </div>
    </div>
  </header>
  <section class="metrics">
    <div class="metric"><div class="metric-value" style="color:var(--red)">${overallScore}/100</div><div class="metric-label">Health Score</div></div>
    <div class="metric"><div class="metric-value" style="color:var(--emerald)">${trafficUplift || 'N/A'}</div><div class="metric-label">Traffic Uplift (90 Days)</div></div>
  </section>
  <div style="margin-top:20px;text-align:center;font-size:12px;color:var(--muted);">Confidential — Prepared for ${escapeHtml(client)} · ${escapeHtml(period)}</div>
</div>
</body>
</html>`
}