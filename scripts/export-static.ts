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

const BASE_PATH = process.env.BASE_PATH !== undefined ? process.env.BASE_PATH : ''
console.log(`Starting static export to ${OUT_DIR} with BASE_PATH="${BASE_PATH}"...`)

const app = createApp()

const server = Bun.serve({
  port: 3999,
  fetch(req) {
    return app.fetch(req)
  }
})

console.log(`Local crawler server running on http://127.0.0.1:${server.port}`)

const discoveredAssets = new Set<string>()

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

      // Track assets referenced in html
      const matches = text.matchAll(/(?:href|src)="(\/assets\/[^"]+|\/fonts\/[^"]+|\/app-icon\.png|\/favicon\.ico)"/g)
      for (const m of matches) {
        discoveredAssets.add(m[1])
      }

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
      content = content.replace(/(["'])\/(assets|fonts|app-icon\.png|favicon\.ico|manifest\.webmanifest|feed\.xml|feed\.json|search)/g, `$1${BASE_PATH}/$2`)
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
  // 1. Fetch main routes
  console.log('Fetching main pages...')
  await download('/', join(OUT_DIR, 'index.html'))
  await download('/search', join(OUT_DIR, 'search/index.html'))
  await download('/feed.xml', join(OUT_DIR, 'feed.xml'))
  await download('/feed.json', join(OUT_DIR, 'feed.json'))

  // 2. Fetch all posts
  const posts = await getPublicPosts()
  console.log(`Exporting ${posts.length} posts...`)
  for (const p of posts) {
    await download(`/${p.slug}`, join(OUT_DIR, p.slug, 'index.html'))
  }

  // 2b. Add redirect for the obsolete English "giai-ma-..." slug to the clean Vietnamese slug
  const legacySlug = 'giai-ma-kien-truc-deepseek-understand-grouped-query-attention-gqa-the-final-frontier-before-latent-attention'
  const targetSlug = 'kien-truc-deepseek-understand-grouped-query-attention-gqa-the-final-frontier-before-latent-attention'
  const redirectHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Đang chuyển hướng...</title>
  <link rel="canonical" href="${BASE_PATH}/${targetSlug}/">
  <meta http-equiv="refresh" content="0; url=${BASE_PATH}/${targetSlug}/">
</head>
<body>
  <p>Bài viết đã được chuyển sang bản dịch Tiếng Việt hoàn chỉnh: <a href="${BASE_PATH}/${targetSlug}/">bấm vào đây</a>.</p>
</body>
</html>`
  const legacyDir = join(OUT_DIR, legacySlug)
  mkdirSync(legacyDir, { recursive: true })
  writeFileSync(join(legacyDir, 'index.html'), redirectHtml, 'utf-8')
  console.log(`✓ Created redirect from ${legacySlug} -> ${targetSlug}`)

  // 3. Download dynamically generated assets
  console.log(`Downloading ${discoveredAssets.size} discovered server assets...`)
  for (const assetPath of discoveredAssets) {
    const target = join(OUT_DIR, assetPath.replace(/^\//, ''))
    await download(assetPath, target)
  }

  // Copy font files
  const fontsDir = join(process.cwd(), 'src/assets/static/fonts')
  if (existsSync(fontsDir)) {
    cpSync(fontsDir, join(OUT_DIR, 'fonts'), { recursive: true })
  }

  // Rewrite URLs for repository subdirectory if BASE_PATH is set
  if (BASE_PATH) {
    console.log(`Rewriting root-relative paths for sub-path (${BASE_PATH})...`)
    rewritePrefix(OUT_DIR)
  }

  // Add .nojekyll for compatibility
  writeFileSync(join(OUT_DIR, '.nojekyll'), '', 'utf-8')

  console.log('✓ Static export completed successfully!')
} finally {
  server.stop(true)
  closeDatabases()
}
