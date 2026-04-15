import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'
import type { Bindings } from '../env'

export interface PageData {
  url: string
  statusCode: number
  title: string
  metaDescription: string
  h1Count: number
  h2Count: number
  wordCount: number
  hasNoIndex: boolean
  hasCanonical: boolean
  canonicalUrl: string
  imagesTotal: number
  imagesMissingAlt: number
  internalLinks: number
  externalLinks: number
  hasStructuredData: boolean
  structuredDataType: string
  pageLoadTime: number
}

export interface CrawlResult {
  pages: PageData[]
  issues: {
    pageUrl: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    category: string
    title: string
    description: string
    impact: string
  }[]
  overallScore: number
  categoryScores: {
    category: string
    score: number
    status: string
  }
}

function extractMeta(html: string, selector: string): string {
  const match = html.match(new RegExp(`<meta[^>]*name=["']${selector}["'][^>]*content=["']([^"']*)["']`, 'i'))
  if (match) return match[1]
  const match2 = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${selector}["']`, 'i'))
  return match2 ? match2[1] : ''
}

function extractTag(html: string, selector: string): string {
  const match = html.match(new RegExp(`<${selector}[^>]*>([^<]*)`, 'i'))
  return match ? match[1].trim() : ''
}

function countTags(html: string, selector: string): number {
  const regex = new RegExp(`<${selector}[^>]*>`, 'gi')
  return (html.match(regex) || []).length
}

function getLinks(html: string, baseUrl: string): { internal: number; external: number } {
  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>/gi
  let internal = 0
  let external = 0
  let match
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    if (href.startsWith('/') || href.startsWith(baseUrl)) {
      internal++
    } else if (href.startsWith('http')) {
      external++
    }
  }
  return { internal, external }
}

function analyzePage(html: string, url: string, loadTime: number): PageData {
  const title = extractTag(html, 'title')
  const metaDescription = extractMeta(html, 'description')
  const robots = extractMeta(html, 'robots')
  const canonical = extractMeta(html, 'canonical')
  const h1Count = countTags(html, 'h1')
  const h2Count = countTags(html, 'h2')
  const wordCount = html.split(/\s+/).length
  const hasNoIndex = robots.toLowerCase().includes('noindex')
  const hasCanonical = !!canonical

  const imgRegex = /<img[^>]*>/gi
  const images = (html.match(imgRegex) || [])
  const imagesTotal = images.length
  const imagesMissingAlt = images.filter(img => !img.includes('alt=') || img.match(/alt=["']\s*["']/)).length

  const links = getLinks(html, url)
  const structuredMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
  const hasStructuredData = !!structuredMatch
  const structuredDataType = structuredMatch ? JSON.parse(structuredMatch[1])?.['@type'] || '' : ''

  return {
    url,
    statusCode: 200,
    title,
    metaDescription,
    h1Count,
    h2Count,
    wordCount,
    hasNoIndex,
    hasCanonical,
    canonicalUrl: canonical,
    imagesTotal,
    imagesMissingAlt: imagesMissingAlt,
    internalLinks: links.internal,
    externalLinks: links.external,
    hasStructuredData,
    structuredDataType,
    pageLoadTime: loadTime,
  }
}

function calculateScore(pages: PageData[]): number {
  if (pages.length === 0) return 0

  let score = 100
  let titleIssues = 0
  let descIssues = 0
  let h1Issues = 0
  let noIndexCount = 0
  let noCanonicalCount = 0
  let altIssues = 0

  for (const page of pages) {
    if (!page.title) titleIssues++
    if (!page.metaDescription) descIssues++
    if (page.h1Count !== 1) h1Issues++
    if (page.hasNoIndex) noIndexCount++
    if (!page.hasCanonical) noCanonicalCount++
    if (page.imagesMissingAlt > 0) altIssues++
  }

  // Deduct points
  score -= titleIssues * 8
  score -= descIssues * 6
  score -= h1Issues * 5
  score -= noIndexCount * 10
  score -= noCanonicalCount * 5
  score -= Math.min(altIssues * 2, 20)

  return Math.max(0, Math.min(100, score))
}

function generateIssues(pages: PageData[], domain: string) {
  const issues = []

  const missingTitles = pages.filter(p => !p.title)
  if (missingTitles.length > 0) {
    issues.push({
      pageUrl: domain,
      severity: 'high' as const,
      category: 'On-Page',
      title: `${missingTitles.length} pages missing title tags`,
      description: `Found ${missingTitles.length} pages without title tags`,
      impact: 'Title tags are critical for SEO ranking'
    })
  }

  const noIndexCount = pages.filter(p => p.hasNoIndex).length
  if (noIndexCount > 0) {
    issues.push({
      pageUrl: domain,
      severity: 'critical' as const,
      category: 'Crawlability',
      title: `${noIndexCount} pages have noindex directive`,
      description: `These pages won't be indexed by search engines`,
      impact: 'Direct loss of potential rankings'
    })
  }

  return issues
}

export async function crawlDomain(
  domain: string,
  db: ReturnType<typeof drizzle>,
  reportId: string,
  signal?: AbortSignal
): Promise<CrawlResult> {
  const baseUrl = domain.startsWith('https://') ? domain : `https://${domain}`
  const startTime = Date.now()
  const pages: PageData[] = []

  // Fetch homepage first
  try {
    const res = await fetch(baseUrl, { signal })
    const html = await res.text()
    const loadTime = Date.now() - startTime

    if (res.ok) {
      const pageData = analyzePage(html, baseUrl, loadTime)
      pageData.statusCode = res.status
      pages.push(pageData)
    }
  } catch (e) {
    // Failed to fetch homepage
    pages.push({
      url: baseUrl,
      statusCode: 0,
      title: '',
      metaDescription: '',
      h1Count: 0,
      h2Count: 0,
      wordCount: 0,
      hasNoIndex: false,
      hasCanonical: false,
      canonicalUrl: '',
      imagesTotal: 0,
      imagesMissingAlt: 0,
      internalLinks: 0,
      externalLinks: 0,
      hasStructuredData: false,
      structuredDataType: '',
      pageLoadTime: 0,
    })
  }

  // Try to get sitemap
  const sitemapUrls = [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap_index.xml`]
  let sitemapUrlsList: string[] = []

  for (const sitemapUrl of sitemapUrls) {
    try {
      const res = await fetch(sitemapUrl, { signal })
      if (res.ok) {
        const xml = await res.text()
        const urlMatches = xml.match(/<loc>([^<]*)<\/loc>/g)
        if (urlMatches) {
          sitemapUrlsList = urlMatches.map(m => m.replace(/<\/?loc>/g, ''))
            .filter(u => u.includes(domain))
            .slice(0, 20) // Limit to 20 pages
        }
        break
      }
    } catch {
      // Continue to next option
    }
  }

  // Crawl sitemap URLs
  for (const url of sitemapUrlsList) {
    try {
      const res = await fetch(url, { signal })
      if (res.ok) {
        const html = await res.text()
        const loadTime = Date.now() - startTime
        pages.push(analyzePage(html, url, loadTime))
      }
    } catch {
      // Skip failed pages
    }
  }

  // Calculate overall score
  const overallScore = calculateScore(pages)

  // Generate issues
  const issues = generateIssues(pages, baseUrl)

  // Count issues by severity
  const criticalIssues = issues.filter(i => i.severity === 'critical').length
  const highIssues = issues.filter(i => i.severity === 'high').length
  const mediumIssues = issues.filter(i => i.severity === 'medium').length
  const lowIssues = issues.filter(i => i.severity === 'low').length

  // Save to DB
  await db.update(schema.reports).set({
    status: 'completed',
    overallScore,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    crawledPageCount: pages.length,
    sitemapUrlCount: sitemapUrlsList.length,
    completedAt: new Date().toISOString(),
  }).where(eq(schema.reports.id, reportId))

  // Save pages
  for (const page of pages) {
    await db.insert(schema.crawledPages).values({
      id: crypto.randomUUID(),
      reportId,
      ...page,
    })
  }

  // Save issues
  for (const issue of issues) {
    await db.insert(schema.issues).values({
      id: crypto.randomUUID(),
      reportId,
      ...issue,
    })
  }

  return {
    pages,
    issues,
    overallScore,
    categoryScores: {
      category: 'Overall',
      score: overallScore,
      status: overallScore >= 70 ? 'Good' : overallScore >= 40 ? 'Needs Work' : 'Critical',
    }
  }
}