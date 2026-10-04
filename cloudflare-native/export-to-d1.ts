import { Database } from 'bun:sqlite'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const dbPath = join(process.env.HOME || '', 'Projects/goglbe/resonanceCalendar/data/quire.db')
const db = new Database(dbPath, { readonly: true })

const outDir = join(process.env.HOME || '', 'Projects/goglbe/resonanceCalendar/cloudflare-native')

// 1. D1 Schema
const schemaSql = `-- Cloudflare D1 Schema for ResonanceCalendar Blog

CREATE TABLE IF NOT EXISTS posts (
  slug             TEXT PRIMARY KEY,
  title            TEXT NOT NULL DEFAULT '',
  date             INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'published',
  featured_image   TEXT,
  excerpt          TEXT,
  reading_minutes  INTEGER,
  content          TEXT NOT NULL DEFAULT '',
  series           TEXT,
  series_order     INTEGER NOT NULL DEFAULT 0,
  meta_title       TEXT,
  meta_description TEXT,
  cover_image      TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  lang             TEXT DEFAULT 'vi',
  deleted_at       INTEGER
);

CREATE INDEX IF NOT EXISTS idx_posts_status_date ON posts (status, date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_series ON posts (series);

CREATE TABLE IF NOT EXISTS post_terms (
  post_slug TEXT NOT NULL,
  kind      TEXT NOT NULL,
  term      TEXT NOT NULL,
  PRIMARY KEY (post_slug, kind, term)
);

CREATE INDEX IF NOT EXISTS idx_post_terms_lookup ON post_terms (kind, term, post_slug);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

writeFileSync(join(outDir, 'schema.sql'), schemaSql, 'utf-8')
console.log('✓ Generated schema.sql')

// 2. Dump Posts & Terms
const posts = db.query<any, any>(`
  SELECT slug, title, date, status, featured_image, excerpt, reading_minutes, content, series, series_order, meta_title, meta_description, cover_image, created_at, updated_at, lang, deleted_at
  FROM posts WHERE status = 'published' AND deleted_at IS NULL
`).all()

const terms = db.query<any, any>(`
  SELECT post_slug, kind, term FROM post_terms
  WHERE post_slug IN (SELECT slug FROM posts WHERE status = 'published' AND deleted_at IS NULL)
`).all()

function escapeSql(val: any): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'number') return val.toString()
  return `'${String(val).replace(/'/g, "''")}'`
}

let seedSql = `-- Cloudflare D1 Seed Data (${posts.length} posts)\n\n`

for (const p of posts) {
  seedSql += `INSERT OR REPLACE INTO posts (slug, title, date, status, featured_image, excerpt, reading_minutes, content, series, series_order, meta_title, meta_description, cover_image, created_at, updated_at, lang, deleted_at) VALUES (\n`
  seedSql += `  ${escapeSql(p.slug)},\n`
  seedSql += `  ${escapeSql(p.title)},\n`
  seedSql += `  ${escapeSql(p.date)},\n`
  seedSql += `  ${escapeSql(p.status)},\n`
  seedSql += `  ${escapeSql(p.featured_image)},\n`
  seedSql += `  ${escapeSql(p.excerpt)},\n`
  seedSql += `  ${escapeSql(p.reading_minutes)},\n`
  seedSql += `  ${escapeSql(p.content)},\n`
  seedSql += `  ${escapeSql(p.series)},\n`
  seedSql += `  ${escapeSql(p.series_order)},\n`
  seedSql += `  ${escapeSql(p.meta_title)},\n`
  seedSql += `  ${escapeSql(p.meta_description)},\n`
  seedSql += `  ${escapeSql(p.cover_image)},\n`
  seedSql += `  ${escapeSql(p.created_at)},\n`
  seedSql += `  ${escapeSql(p.updated_at)},\n`
  seedSql += `  ${escapeSql(p.lang)},\n`
  seedSql += `  ${escapeSql(p.deleted_at)}\n`
  seedSql += `);\n\n`
}

for (const t of terms) {
  seedSql += `INSERT OR REPLACE INTO post_terms (post_slug, kind, term) VALUES (${escapeSql(t.post_slug)}, ${escapeSql(t.kind)}, ${escapeSql(t.term)});\n`
}

writeFileSync(join(outDir, 'seed.sql'), seedSql, 'utf-8')
console.log(`✓ Generated seed.sql with ${posts.length} posts and ${terms.length} terms!`)
