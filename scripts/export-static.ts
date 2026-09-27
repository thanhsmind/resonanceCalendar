import { openDatabases, closeDatabases } from '@/store/db'
import { readEnv } from '@/env'
import { getPublicPosts } from '@/content/posts'
import { ensureBlobStore } from '@/media/blob-local'
import { createApp } from '@/web/app'
import { mkdirSync, writeFileSync, readFileSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const env = readEnv()
openDatabases(env.dataDir)
ensureBlobStore()

const OUT_DIR = join(process.cwd(), 'dist')
mkdirSync(OUT_DIR, { recursive: true })

const BASE_PATH = '/resonanceCalendar'
console.log(`Starting static export to ${OUT_DIR} with BASE_PATH=${BASE_PATH}...`)

const app = createApp()

// Start local server in background to crawl
const server = Bun.serve({
  port: 3999,
  fetch(req) {
    return app.fetch(req)
  }
})

console.log(`Local crawler server running on http://127.0.0.1:${server.port}`)

async function download(path: string, outPath: string) {
  try {
    const res = await fetch(`http://127.0.0.1:${server.port}${path}`)
    if (!res.ok) {
      console.warn(`[WARN] Failed to fetch ${path}: ${res.status}`)
      return false
    }
    const contentType = res.headers.get('content-type') || ''
    const dir = join(outPath, '..')
    mkdirSync(dir, { recursive: true })
    if (contentType.includes('text') || contentType.includes('json') || contentType.includes('xml')) {
      let text = await res.text()
      writeFileSync(outPath, text, 'utf-8')
    } else {
      const buffer = await res.arrayBuffer()
      writeFileSync(outPath, Buffer.from(buffer))
    }
    return true
  } catch (err: any) {
    console.error(`[ERROR] Crawling ${path}:`, err?.message || err)
    return false
  }
}

function rewritePrefix(dir: string) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const p = join(dir, entry)
    const st = statSync(p)
    if (st.isDirectory()) {
      rewritePrefix(p)
    } else if (p.endsWith('.html') || p.endsWith('.xml') || p.endsWith('.json') || p.endsWith('.css') || p.endsWith('.js')) {
      let content = readFileSync(p, 'utf-8')
      // replace root paths /assets/, /fonts/, /post/ etc with /resonanceCalendar/
      content = content.replace(/(["'])\/(assets|fonts|app-icon\.png|favicon\.ico|manifest\.webmanifest|feed\.xml|feed\.json|search)/g, `$1${BASE_PATH}/$2`)
      // replace post links: href="/kien-truc-..." or href="/12-nam-..." or href="/cai-gia-..." or href="/"
      content = content.replace(/href="\/([a-zA-Z0-9_-]+)"/g, (match, slug) => {
        if (slug === 'assets' || slug === 'fonts') return match
        return `href="${BASE_PATH}/${slug}"`
      })
      content = content.replace(/href="\/"/g, `href="${BASE_PATH}/"`)
      writeFileSync(p, content, 'utf-8')
    }
  }
}

try {
  // 1. Copy static assets
  console.log('Copying static assets...')
  const assetsDir = join(process.cwd(), 'src/assets/dist')
  if (existsSync(assetsDir)) {
    cpSync(assetsDir, join(OUT_DIR, 'assets'), { recursive: true })
  }
  const fontsDir = join(process.cwd(), 'src/assets/static/fonts')
  if (existsSync(fontsDir)) {
    cpSync(fontsDir, join(OUT_DIR, 'fonts'), { recursive: true })
  }
  const staticDir = join(process.cwd(), 'src/assets/static')
  if (existsSync(staticDir)) {
    cpSync(staticDir, OUT_DIR, { recursive: true })
  }

  // 2. Fetch main routes
  console.log('Fetching main pages...')
  await download('/', join(OUT_DIR, 'index.html'))
  await download('/search', join(OUT_DIR, 'search/index.html'))
  await download('/feed.xml', join(OUT_DIR, 'feed.xml'))
  await download('/feed.json', join(OUT_DIR, 'feed.json'))

  // 3. Fetch all posts
  const posts = await getPublicPosts()
  console.log(`Exporting ${posts.length} posts...`)
  for (const p of posts) {
    console.log(`- /${p.slug}`)
    await download(`/${p.slug}`, join(OUT_DIR, p.slug, 'index.html'))
  }

  // Rewrite URLs for GitHub Pages repository subdirectory
  console.log('Rewriting root-relative paths for GitHub Pages sub-path...')
  rewritePrefix(OUT_DIR)

  // Add .nojekyll for GitHub Pages
  writeFileSync(join(OUT_DIR, '.nojekyll'), '', 'utf-8')

  console.log('✓ Static export completed successfully!')
} finally {
  server.stop(true)
  closeDatabases()
}
