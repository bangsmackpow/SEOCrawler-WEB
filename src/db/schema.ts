import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// Users table
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  isAdmin: integer('is_admin', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default(sql`datetime('now')`),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

// Reports (SEO audits)
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id),
  domain: text('domain').notNull(),
  clientName: text('client_name'),
  status: text('status').default('pending'),
  overallScore: integer('overall_score'),
  criticalIssues: integer('critical_issues'),
  highIssues: integer('high_issues'),
  mediumIssues: integer('medium_issues'),
  lowIssues: integer('low_issues'),
  trafficUplift: text('traffic_uplift'),
  crawledPageCount: integer('crawled_page_count'),
  sitemapUrlCount: integer('sitemap_url_count'),
  createdAt: text('created_at').default(sql`datetime('now')`),
  completedAt: text('completed_at'),
})

// Crawled Pages (per report)
export const crawledPages = sqliteTable('crawled_pages', {
  id: text('id').primaryKey(),
  reportId: text('report_id').references(() => reports.id),
  url: text('url').notNull(),
  statusCode: integer('status_code'),
  title: text('title'),
  metaDescription: text('meta_description'),
  h1Count: integer('h1_count'),
  h2Count: integer('h2_count'),
  wordCount: integer('word_count'),
  hasNoIndex: integer('has_noindex', { mode: 'boolean' }),
  hasCanonical: integer('has_canonical', { mode: 'boolean' }),
  canonicalUrl: text('canonical_url'),
  imagesTotal: integer('images_total'),
  imagesMissingAlt: integer('images_missing_alt'),
  internalLinks: integer('internal_links'),
  externalLinks: integer('external_links'),
  hasStructuredData: integer('has_structured_data', { mode: 'boolean' }),
  structuredDataType: text('structured_data_type'),
  pageLoadTime: real('page_load_time'),
  loadedAt: text('loaded_at').default(sql`datetime('now')`),
})

// SEO Issues found
export const issues = sqliteTable('issues', {
  id: text('id').primaryKey(),
  reportId: text('report_id').references(() => reports.id),
  pageUrl: text('page_url'),
  severity: text('severity').notNull(),
  category: text('category').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  impact: text('impact'),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

// Keyword Opportunities
export const keywords = sqliteTable('keywords', {
  id: text('id').primaryKey(),
  reportId: text('report_id').references(() => reports.id),
  keyword: text('keyword').notNull(),
  intent: text('intent'),
  searchVolume: text('search_volume'),
  difficulty: text('difficulty'),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

// Shared Reports
export const sharedReports = sqliteTable('shared_reports', {
  id: text('id').primaryKey(),
  reportId: text('report_id').references(() => reports.id),
  sharedWithEmail: text('shared_with_email').notNull(),
  createdAt: text('created_at').default(sql`datetime('now')`),
})

// Settings
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').default(sql`datetime('now')`),
})

// Type exports
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type Report = typeof reports.$inferSelect
export type NewReport = typeof reports.$inferInsert
export type CrawledPage = typeof crawledPages.$inferSelect
export type NewCrawledPage = typeof crawledPages.$inferInsert
export type Issue = typeof issues.$inferSelect
export type NewIssue = typeof issues.$inferInsert
export type Keyword = typeof keywords.$inferSelect
export type NewKeyword = typeof keywords.$inferInsert
export type SharedReport = typeof sharedReports.$inferSelect
export type Setting = typeof settings.$inferSelect

// Category scores for SEO reports
export const categoryScores = sqliteTable('category_scores', {
  id: text('id').primaryKey(),
  reportId: text('report_id').references(() => reports.id),
  category: text('category').notNull(),
  score: integer('score').notNull(),
  status: text('status').notNull(),
  createdAt: text('created_at').default(sql`datetime('now')`),
})
export type CategoryScore = typeof categoryScores.$inferSelect