import { Database } from 'bun:sqlite'
import { join } from 'node:path'

const dbPath = join(process.env.HOME || '', 'Projects/goglbe/resonanceCalendar/data/quire.db')
const db = new Database(dbPath, { readonly: true })

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || ''
const CF_D1_ID = process.env.CLOUDFLARE_D1_ID || 'b8d47c58-581f-4839-8a42-c52290c41fdb'
const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ''

const posts = db.query<any, any>(`
  SELECT slug, title, date, status, featured_image, excerpt, reading_minutes, content, series, series_order, meta_title, meta_description, cover_image, created_at, updated_at, lang, deleted_at
  FROM posts WHERE status = 'published' AND deleted_at IS NULL
`).all()

const terms = db.query<any, any>(`
  SELECT post_slug, kind, term FROM post_terms
  WHERE post_slug IN (SELECT slug FROM posts WHERE status = 'published' AND deleted_at IS NULL)
`).all()

console.log(`Uploading ${posts.length} posts and ${terms.length} terms to D1 via API...`)

const endpoint = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_ID}/query`

async function runQueries(queries: { sql: string; params: any[] }[]) {
  // Batch in chunks of 50
  for (let i = 0; i < queries.length; i += 25) {
    const chunk = queries.slice(i, i + 25)
    // Cloudflare D1 query API takes single sql statement or statements
    // We can execute one by one or batch
    for (const q of chunk) {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CF_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sql: q.sql,
          params: q.params
        })
      })
      const data = await res.json() as any
      if (!data.success) {
        console.error(`Error on query ${q.params[0]}:`, data.errors)
      }
    }
    process.stdout.write(`Processed ${Math.min(i + 25, queries.length)} / ${queries.length}\r`)
  }
}

const postQueries = posts.map(p => ({
  sql: `INSERT OR REPLACE INTO posts (slug, title, date, status, featured_image, excerpt, reading_minutes, content, series, series_order, meta_title, meta_description, cover_image, created_at, updated_at, lang, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
  params: [
    p.slug, p.title, p.date, p.status, p.featured_image, p.excerpt, p.reading_minutes,
    p.content, p.series, p.series_order, p.meta_title, p.meta_description, p.cover_image,
    p.created_at, p.updated_at, p.lang, p.deleted_at
  ]
}))

console.log('Sending posts...')
await runQueries(postQueries)
console.log('\n✓ Finished posts!')

const termQueries = terms.map(t => ({
  sql: `INSERT OR REPLACE INTO post_terms (post_slug, kind, term) VALUES (?, ?, ?);`,
  params: [t.post_slug, t.kind, t.term]
}))

console.log('Sending terms...')
await runQueries(termQueries)
console.log('\n✓ Finished terms!')
