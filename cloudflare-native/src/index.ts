import { Hono } from 'hono'
import { html } from 'hono/html'

type Bindings = {
  DB: D1Database
  API_SECRET?: string
}

type Post = {
  slug: string
  title: string
  date: number
  excerpt: string | null
  content: string
  reading_minutes: number | null
  series: string | null
  series_order: number | null
  meta_title: string | null
  meta_description: string | null
  cover_image: string | null
}

const app = new Hono<{ Bindings: Bindings }>()

// Helper format date
function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Layout HTML chung
function Layout(props: { title: string; description?: string; children: any; canonical?: string }) {
  const siteTitle = props.title.includes('Quire Ink') ? props.title : `${props.title} · Quire Ink`
  const desc = props.description || 'Resonance Calendar — Tri thức & Công nghệ'
  const canonical = props.canonical || 'https://rc.gogl.be/'

  return html`<!DOCTYPE html>
<html lang="vi" data-motion="on" data-chrome-font="inter">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${siteTitle}</title>
  <meta name="description" content="${desc}">
  <link rel="canonical" href="${canonical}">
  <link rel="alternate" type="application/rss+xml" title="Quire Ink" href="/feed.xml">
  <link rel="stylesheet" href="/assets/site.fn5khyu4jd.css">
  <style>
    :root {
      --shell-w: 672px;
      --font-sans: system-ui, -apple-system, sans-serif;
      --font-reading: 'Literata', Georgia, serif;
      --c-bg: #fcfcfc;
      --c-text: #30302f;
      --c-heading: #1a1919;
      --c-meta: #6d6c6c;
      --c-rule: #e3e2e2;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --c-bg: #0e0e0e;
        --c-text: #d4d4d3;
        --c-heading: #f1f0f0;
        --c-meta: #868685;
        --c-rule: #2a2a29;
      }
    }
    body {
      background: var(--c-bg);
      color: var(--c-text);
      font-family: var(--font-reading);
      margin: 0;
      padding: 0;
      line-height: 1.7;
    }
    .wrap {
      max-width: var(--shell-w);
      margin: 0 auto;
      padding: 2rem 1.25rem 4rem;
    }
    header.site-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 2rem;
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--c-rule);
      font-family: var(--font-sans);
    }
    header.site-header a.logo {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--c-heading);
      text-decoration: none;
    }
    .post-item {
      margin-bottom: 2.5rem;
    }
    .post-item h2 {
      margin: 0 0 0.4rem;
      font-size: 1.45rem;
      line-height: 1.3;
    }
    .post-item h2 a {
      color: var(--c-heading);
      text-decoration: none;
    }
    .post-item h2 a:hover {
      text-decoration: underline;
    }
    .post-meta {
      font-size: 0.875rem;
      color: var(--c-meta);
      font-family: var(--font-sans);
      margin-bottom: 0.6rem;
    }
    .post-excerpt {
      color: var(--c-text);
      margin: 0;
      font-size: 1.05rem;
    }
    article.post-full h1 {
      font-size: 2rem;
      line-height: 1.25;
      color: var(--c-heading);
      margin-bottom: 0.5rem;
    }
    article.post-full .content {
      font-size: 1.125rem;
      line-height: 1.8;
      margin-top: 2rem;
    }
    article.post-full .content p { margin: 1.25rem 0; }
    article.post-full .content blockquote {
      border-left: 3px solid var(--c-rule);
      padding-left: 1.25rem;
      margin: 1.5rem 0;
      color: var(--c-meta);
      font-style: italic;
    }
    article.post-full .content pre {
      background: rgba(0,0,0,0.04);
      padding: 1rem;
      border-radius: 6px;
      overflow-x: auto;
    }
    footer.site-footer {
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 1px solid var(--c-rule);
      font-size: 0.875rem;
      color: var(--c-meta);
      font-family: var(--font-sans);
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="site-header">
      <a href="/" class="logo">Quire Ink</a>
      <nav>
        <a href="/search" style="color:var(--c-heading);text-decoration:none;margin-right:1rem;">Tìm kiếm</a>
        <a href="/feed.xml" style="color:var(--c-heading);text-decoration:none;">RSS</a>
      </nav>
    </header>
    <main>
      ${props.children}
    </main>
    <footer class="site-footer">
      <p>Resonance Calendar · Quire Ink on Cloudflare Edge</p>
    </footer>
  </div>
</body>
</html>`
}

// 1. Home listing
app.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT slug, title, date, excerpt, reading_minutes, series
    FROM posts
    WHERE status = 'published' AND deleted_at IS NULL
    ORDER BY date DESC
  `).all<Post>()

  const listHtml = html`
    <div class="posts-list">
      ${results.map((p) => html`
        <div class="post-item">
          <h2><a href="/${p.slug}">${p.title}</a></h2>
          <div class="post-meta">
            <time>${formatDate(p.date)}</time>
            ${p.reading_minutes ? html` · <span>${p.reading_minutes} phút đọc</span>` : ''}
            ${p.series ? html` · <span>Chuyên mục: <strong>${p.series}</strong></span>` : ''}
          </div>
          ${p.excerpt ? html`<p class="post-excerpt">${p.excerpt}</p>` : ''}
        </div>
      `)}
    </div>
  `

  return c.html(Layout({ title: 'Quire Ink', children: listHtml }))
})

// 2. RSS Feed
app.get('/feed.xml', async (c) => {
  const { results } = await c.env.DB.prepare(`
    SELECT slug, title, date, excerpt, content
    FROM posts
    WHERE status = 'published' AND deleted_at IS NULL
    ORDER BY date DESC
    LIMIT 20
  `).all<Post>()

  const rssItems = results.map((p) => `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>https://rc.gogl.be/${p.slug}</link>
      <guid isPermaLink="true">https://rc.gogl.be/${p.slug}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.excerpt || ''}]]></description>
    </item>
  `).join('')

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Quire Ink</title>
    <link>https://rc.gogl.be</link>
    <description>Resonance Calendar</description>
    <language>vi</language>
    <atom:link href="https://rc.gogl.be/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`

  c.header('Content-Type', 'application/xml; charset=utf-8')
  return c.body(rssXml)
})

// 3. Search Route
app.get('/search', async (c) => {
  const q = c.req.query('q')?.trim()
  let results: Post[] = []

  if (q) {
    const res = await c.env.DB.prepare(`
      SELECT slug, title, date, excerpt
      FROM posts
      WHERE status = 'published' AND deleted_at IS NULL
        AND (title LIKE ? OR excerpt LIKE ? OR content LIKE ?)
      ORDER BY date DESC
      LIMIT 30
    `).bind(`%${q}%`, `%${q}%`, `%${q}%`).all<Post>()
    results = res.results
  }

  const searchHtml = html`
    <div>
      <h1 style="font-size:1.75rem;margin-bottom:1.5rem;">Tìm kiếm bài viết</h1>
      <form method="GET" action="/search" style="margin-bottom:2rem;">
        <input type="text" name="q" value="${q || ''}" placeholder="Nhập từ khóa tìm kiếm..." 
          style="width:100%;max-width:400px;padding:0.6rem 0.8rem;font-size:1rem;border:1px solid var(--c-rule);border-radius:4px;box-sizing:border-box;">
        <button type="submit" style="padding:0.6rem 1.2rem;font-size:1rem;background:var(--c-heading);color:var(--c-bg);border:none;border-radius:4px;cursor:pointer;margin-left:0.5rem;">Tìm</button>
      </form>

      ${q ? html`
        <p style="color:var(--c-meta);margin-bottom:1.5rem;">Tìm thấy ${results.length} kết quả cho "<strong>${q}</strong>":</p>
        <div class="posts-list">
          ${results.map((p) => html`
            <div class="post-item">
              <h2><a href="/${p.slug}">${p.title}</a></h2>
              <div class="post-meta"><time>${formatDate(p.date)}</time></div>
              ${p.excerpt ? html`<p class="post-excerpt">${p.excerpt}</p>` : ''}
            </div>
          `)}
        </div>
      ` : ''}
    </div>
  `

  return c.html(Layout({ title: 'Tìm kiếm', children: searchHtml }))
})

// 4. API Direct Publish (dành cho Web Clipper / Agent đẩy trực tiếp vào D1)
app.post('/api/publish', async (c) => {
  const authHeader = c.req.header('Authorization')
  const secret = c.env.API_SECRET || 'goglbe-super-secret'

  if (authHeader !== `Bearer ${secret}`) {
    return c.json({ ok: false, error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json<any>()
  const { slug, title, content, excerpt, series, date } = body

  if (!slug || !title || !content) {
    return c.json({ ok: false, error: 'Missing required fields: slug, title, content' }, 400)
  }

  const now = Date.now()
  const postDate = date || now

  await c.env.DB.prepare(`
    INSERT OR REPLACE INTO posts (
      slug, title, date, status, excerpt, content, series, created_at, updated_at
    ) VALUES (?, ?, ?, 'published', ?, ?, ?, ?, ?)
  `).bind(slug, title, postDate, excerpt || null, content, series || null, now, now).run()

  return c.json({ ok: true, slug, url: `https://rc.gogl.be/${slug}` })
})

// 5. Post details (catch-all by slug)
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  
  const post = await c.env.DB.prepare(`
    SELECT slug, title, date, excerpt, content, reading_minutes, series, meta_title, meta_description
    FROM posts
    WHERE slug = ? AND status = 'published' AND deleted_at IS NULL
  `).bind(slug).first<Post>()

  if (!post) {
    return c.html(Layout({
      title: 'Không tìm thấy bài viết',
      children: html`<div style="text-align:center;padding:3rem 0;"><h1>404 - Không tìm thấy bài viết</h1><p><a href="/">Quay về trang chủ</a></p></div>`
    }), 404)
  }

  const articleHtml = html`
    <article class="post-full">
      <h1>${post.title}</h1>
      <div class="post-meta">
        <time>${formatDate(post.date)}</time>
        ${post.reading_minutes ? html` · <span>${post.reading_minutes} phút đọc</span>` : ''}
        ${post.series ? html` · <span>Chuyên mục: <strong>${post.series}</strong></span>` : ''}
      </div>
      <div class="content">
        ${html([post.content])}
      </div>
    </article>
  `

  return c.html(Layout({
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    canonical: `https://rc.gogl.be/${post.slug}`,
    children: articleHtml
  }))
})

export default app
