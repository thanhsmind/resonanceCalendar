import { Hono } from 'hono'
import { marked } from 'marked'

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
  created_at: number
}

const app = new Hono<{ Bindings: Bindings }>()

// Inline styles Quire Ink hoàn chỉnh (Fonts, Palette, Theme variables)
const HEAD_STYLES = `
<style>
@font-face{font-family:'Inter';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/inter-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Inter';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/inter-latin-ext.woff2') format('woff2');unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF,U+FB00-FB06}
@font-face{font-family:'Inter';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/inter-vietnamese.woff2') format('woff2');unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/jetbrainsmono-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'JetBrains Mono';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/jetbrainsmono-vietnamese.woff2') format('woff2');unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
@font-face{font-family:'Literata';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/literata-latin.woff2') format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
@font-face{font-family:'Literata';font-style:normal;font-weight:400 700;font-display:swap;src:url('/fonts/literata-vietnamese.woff2') format('woff2');unicode-range:U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB}
:root{--font-sans:'Inter', system-ui, -apple-system, sans-serif;--font-reading:var(--font-sans);--font-mono:'JetBrains Mono', monospace}
:root{--shell-w:672px}
:root{--font-reading:'Literata', Georgia, serif;--reading-bold:600}
:root{color-scheme:light;--c-bg:#fcfcfc;--c-text:#30302f;--c-heading:#1a1919;--c-meta:#6d6c6c;--c-link:#1a1919;--c-accent:#1a1919;--c-rule:#e3e2e2}
.dark{color-scheme:dark;--c-bg:#0e0e0e;--c-text:#d4d4d3;--c-heading:#f1f0f0;--c-meta:#868685;--c-link:#f1f0f0;--c-accent:#f1f0f0;--c-rule:#2a2a29}
[data-palette="mono"]{--c-bg:#fcfcfc;--c-text:#30302f;--c-heading:#1a1919;--c-meta:#6d6c6c;--c-link:#1a1919;--c-accent:#1a1919;--c-rule:#e3e2e2}
[data-palette="mono"].dark{--c-bg:#0e0e0e;--c-text:#d4d4d3;--c-heading:#f1f0f0;--c-meta:#868685;--c-link:#f1f0f0;--c-accent:#f1f0f0;--c-rule:#2a2a29}
[data-palette="sepia"]{--c-bg:#fcf7ed;--c-text:#372a1e;--c-heading:#1d140a;--c-meta:#736959;--c-link:#91552e;--c-accent:#91552e;--c-rule:#e8ddc8}
[data-palette="sepia"].dark{--c-bg:#1a140e;--c-text:#e5d8c4;--c-heading:#fff6e4;--c-meta:#968974;--c-link:#db9f6f;--c-accent:#db9f6f;--c-rule:#362d22}
[data-palette="forest"]{--c-bg:#f5f7f2;--c-text:#262e26;--c-heading:#0f170f;--c-meta:#646b60;--c-link:#336f43;--c-accent:#336f43;--c-rule:#d8dfd3}
[data-palette="forest"].dark{--c-bg:#0f140f;--c-text:#d1dacc;--c-heading:#f0f7ec;--c-meta:#808d7a;--c-link:#7db78c;--c-accent:#7db78c;--c-rule:#262f23}
[data-palette="ocean"]{--c-bg:#f0f8ff;--c-text:#212d3b;--c-heading:#091623;--c-meta:#616b73;--c-link:#2466a7;--c-accent:#2466a7;--c-rule:#d1dfed}
[data-palette="ocean"].dark{--c-bg:#031127;--c-text:#cad8e6;--c-heading:#edf4fd;--c-meta:#7c8a97;--c-link:#6fafe6;--c-accent:#6fafe6;--c-rule:#1b2d42}
[data-palette="scifi"]{--c-bg:#f6f8f7;--c-text:#292d31;--c-heading:#141619;--c-meta:#666a70;--c-link:#006f75;--c-accent:#006f75;--c-rule:#dcdfe1}
[data-palette="scifi"].dark{--c-bg:#0d0f11;--c-text:#d1d5d8;--c-heading:#eef2f3;--c-meta:#81888d;--c-link:#00b9c4;--c-accent:#00b9c4;--c-rule:#262a2f}
[data-palette="amber"]{--c-bg:#fcfbf8;--c-text:#322e2a;--c-heading:#1c1915;--c-meta:#6f6b65;--c-link:#975500;--c-accent:#975500;--c-rule:#e5e1d9}
[data-palette="amber"].dark{--c-bg:#100f0d;--c-text:#d9d5cc;--c-heading:#f5f1eb;--c-meta:#8b867d;--c-link:#e09932;--c-accent:#e09932;--c-rule:#2d2a25}
@media (prefers-color-scheme:dark){:root:not([data-scheme]){color-scheme:dark;--c-bg:#0e0e0e;--c-text:#d4d4d3;--c-heading:#f1f0f0;--c-meta:#868685;--c-link:#f1f0f0;--c-accent:#f1f0f0;--c-rule:#2a2a29}}
:root{--density:1;--radius:.5rem;--fw-title:700;--fw-heading:600}
:root{--fs-h1:calc(2rem * var(--type-scale, 1));--lh-h1:1.2;--ls-h1:-0.01em;--fs-h2:calc(1.5rem * var(--type-scale, 1));--lh-h2:1.27;--ls-h2:-0.008em;--fs-h3:calc(1.25rem * var(--type-scale, 1));--lh-h3:1.35;--ls-h3:0em;--fs-body:calc(1.125rem * var(--type-scale, 1));--lh-body:1.65;--ls-body:0em;--fs-small:calc(0.95rem * var(--type-scale, 1));--lh-small:1.6;--ls-small:0em}
</style>
`

const DETAIL_BODY_ATTRS = `data-search="Search" data-search-hint="Type to search posts." data-search-empty="No matching posts found." data-lightbox-close="Close" data-grid-view="Grid view" data-list-view="List view" data-theme="Theme" data-default-scheme="system" data-theme-light="Light" data-theme-dark="Dark" data-theme-system="System" data-theme-time="By time" data-palette="Palette" data-nl-success="Almost there — check your inbox to confirm." data-nl-no-mail="Signed up. Email is not configured, so no confirmation was sent." data-nl-invalid="That does not look like an email address." data-nl-error="Something went wrong. Please try again." data-nl-heading="Subscribe to the newsletter" data-nl-placeholder="your@email.com" data-nl-button="Subscribe" data-copy-code="Copy" data-copied-code="Copied" data-back-to-top="Back to top" data-quote-copy="Copy quote" data-quote-copied="Copied" data-lightbox-prev="Previous image" data-lightbox-next="Next image" data-book-mode="Book mode" data-book-mode-prev="Previous page" data-book-mode-next="Next page" data-book-mode-close="Close" data-book-mode-smaller="Smaller text" data-book-mode-larger="Larger text" data-resume-prompt="Continue where you left off?" data-reader-pen="1" data-pen-sheets="/assets/pen-marks.292arbzbqb.css /assets/pen-lines.u227d05dhf.css" data-pen-inks="d5f856,aaef83,faaad9,8ed6f9,fac881" data-reader-pen-highlight="Highlight" data-reader-pen-underline="Underline" data-reader-pen-ring="Ring" data-reader-pen-note="Note" data-reader-pen-delete="Remove mark" data-reader-pen-note-hint="Your note, kept in this browser" data-reader-pen-send="Send to my notebook" data-reader-pen-notebook-ask="Where is your Quire Ink? Its address:" data-reader-pen-notebook-go="Send" data-reader-pen-kept-here="Kept in this browser only." data-reader-pen-keep="Keep on every device" data-reader-pen-keep-google="Sign in with Google" data-reader-pen-keep-code="Get a code" data-reader-pen-keep-have="Have a code? Paste it:" data-reader-pen-keep-use="Use" data-reader-pen-kept="Kept on every device." data-reader-pen-keep-hint="Write this code down. It is the only key to your marks, and it works on any device." data-reader-pen-forget-here="Forget on this device" data-reader-pen-forget-all="Forget everywhere" data-reader-pen-keep-bad="That code is not known here." data-reader-pen-show-code="Show code"`

function formatDisplayDate(timestamp: number): string {
  const d = new Date(timestamp)
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// Custom Markdown renderer with YouTube embed support
function renderPostMarkdown(content: string, title: string): string {
  let md = content.trim()

  // Remove duplicate top H1 in markdown if it matches title
  md = md.replace(/^#\s+[^\n]+\n+/, '')

  // Auto-embed YouTube URLs on their own line
  md = md.replace(/(?:^|\n)(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:\S*)?(?=\n|$)/g, (match, id) => {
    return `\n<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${id}" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>\n`
  })

  return marked.parse(md, { gfm: true, breaks: true }) as string
}

// Shell HTML giống hệt Quire Ink gốc
function renderShell(props: {
  title: string
  description?: string
  canonical?: string
  ogType?: string
  bodyClass?: string
  content: string
  rail?: string
  isArticle?: boolean
}) {
  const siteTitle = props.title === 'Quire Ink' ? 'Quire Ink' : `${props.title} · Quire Ink`
  const desc = props.description || 'Quire Ink blog'
  const canonical = props.canonical || 'https://rc.gogl.be/'
  const ogType = props.ogType || 'website'
  const wrapClass = props.isArticle ? 'wrap book-text' : 'wrap'
  const bodyAttributes = props.isArticle ? DETAIL_BODY_ATTRS : 'data-search="Search" data-search-hint="Type to search posts." data-search-empty="No matching posts found." data-lightbox-close="Close" data-grid-view="Grid view" data-list-view="List view" data-theme="Theme" data-default-scheme="system" data-theme-light="Light" data-theme-dark="Dark" data-theme-system="System" data-theme-time="By time" data-palette="Palette"'

  return `<!DOCTYPE html>
<html lang="en" data-motion="on" data-chrome-font="inter" data-scroll-fade="on">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#fcfcfc">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0e0e0e">
<meta name="generator" content="Quire Ink 2.2.15">
<title>${escapeHtml(siteTitle)}</title>
<link rel="canonical" href="${canonical}">
<link rel="apple-touch-icon" href="/app-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="alternate" type="application/rss+xml" title="Quire Ink" href="/feed.xml">
<link rel="alternate" type="application/feed+json" title="Quire Ink" href="/feed.json">
<meta property="og:title" content="${escapeHtml(siteTitle)}">
<meta property="og:type" content="${ogType}">
<meta property="og:url" content="${canonical}">
<meta property="og:site_name" content="Quire Ink">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="stylesheet" href="/assets/site.fn5khyu4jd.css">
<link rel="preload" href="/fonts/literata-latin.woff2" as="font" type="font/woff2" crossorigin>
${HEAD_STYLES}
</head>
<body ${bodyAttributes} ${props.bodyClass || ''}>
${props.isArticle ? '<div class="progress" aria-hidden="true"><div class="progress-fill"></div></div>' : ''}
<div class="${wrapClass}">
<header class="site">
<a class="skip-link" href="#content">Skip to content</a>
<div class="site-bar"><a class="title" href="/">Quire Ink</a><div class="site-actions"><a class="icon-btn" href="/search" data-search-open aria-label="Search" title="Search"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="M15.4 15.4 20.5 20.5"/><path d="M7.6 9.3A4.3 4.3 0 0 1 9.9 7.1" stroke-width="1.4"/></svg><span class="btn-token">/find</span></a><button type="button" class="icon-btn" data-theme-toggle data-theme-words="dark|light" aria-label="Theme" title="Theme" aria-haspopup="true" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M5.3 18.7l2.1-2.1"/></svg><span class="btn-token">dark</span></button><button type="button" class="icon-btn" data-palettes="mono:Mono|sepia:Sepia|forest:Forest|ocean:Ocean|scifi:Sci-Fi|amber:Amber" data-palette-default="mono" aria-label="Palette" title="Palette" aria-haspopup="true" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.2c5 0 8.8 3.4 8.8 7.6 0 2.6-2 3.6-3.6 3.6h-1.6c-1.2 0-2.1.9-2.1 2 0 .5.2 1 .5 1.4.3.4.5.8.5 1.3 0 1-.8 1.7-2 1.7-4.8 0-8.8-3.9-8.8-8.8S7.2 3.2 12 3.2Z"/><circle cx="8.2" cy="9.2" r="1.25" fill="currentColor" stroke="none"/><circle cx="13.4" cy="7.4" r="1.25" fill="currentColor" stroke="none"/><circle cx="16.8" cy="10.6" r="1.25" fill="currentColor" stroke="none"/></svg><span class="btn-token">hue</span></button><button type="button" class="icon-btn" data-grid-toggle aria-pressed="false" aria-label="Grid view"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/></svg><span class="btn-token">grid</span></button><button type="button" class="icon-btn rail-toggle" data-rail-toggle aria-expanded="false" aria-label="Menu"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h13"/></svg><span class="btn-token">menu</span></button></div></div>
</header>
<div class="with-rail"><main id="content">
${props.content}
${props.rail || ''}
</main></div>
<footer class="site"><p class="footer-text">© 2026 Quire Ink · <a href="https://quireink.com" rel="noopener">powered by Quire Ink</a></p></footer>
</div>
<script src="/assets/core.2p6tjc3qag.js" defer></script>
${props.isArticle ? '<script src="/assets/post.35r2vd4txw.js" defer></script><script src="/assets/book-mode.36rvlmc5ei.js" defer></script><script src="/assets/reader-pen.28l63hl3ut.js" defer></script>' : ''}
</body>
</html>`
}

// 1. Home listing
app.get('/', async (c) => {
  const { results: posts } = await c.env.DB.prepare(`
    SELECT slug, title, date, excerpt, reading_minutes, series, cover_image, featured_image
    FROM posts
    WHERE status = 'published' AND deleted_at IS NULL
    ORDER BY date DESC
  `).all<Post>()

  const { results: categories } = await c.env.DB.prepare(`
    SELECT term, count(*) as count FROM post_terms
    WHERE kind = 'category'
    GROUP BY term ORDER BY count DESC LIMIT 10
  `).all<{ term: string; count: number }>()

  const { results: tags } = await c.env.DB.prepare(`
    SELECT term, count(*) as count FROM post_terms
    WHERE kind = 'tag'
    GROUP BY term ORDER BY count DESC LIMIT 30
  `).all<{ term: string; count: number }>()

  const { results: seriesList } = await c.env.DB.prepare(`
    SELECT series, count(*) as count FROM posts
    WHERE series IS NOT NULL AND status = 'published' AND deleted_at IS NULL
    GROUP BY series ORDER BY count DESC
  `).all<{ series: string; count: number }>()

  let postArticles = ''
  posts.forEach((p, index) => {
    const isLead = index === 0
    const cat = p.series || 'Articles'
    const readMin = p.reading_minutes || Math.ceil((p.excerpt?.length || 500) / 100)
    const formattedDate = formatDisplayDate(p.date)
    const dateIso = new Date(p.date).toISOString()

    postArticles += `
<article class="reveal"${isLead ? ' data-lead' : ''}>
<p class="t-small text-meta"><a class="link-accent" href="/category/${encodeURIComponent(cat.toLowerCase())}">${escapeHtml(cat)}</a> · <time class="meta-part" datetime="${dateIso}">${formattedDate}</time> · <span class="meta-part"><span class="num">${readMin}</span> min read</span></p>
<${isLead ? 'h1' : 'h2'} class="reading-font mt-2 ${isLead ? 'fs-h1' : 'fs-h2'} font-semibold" lang="vi"><a class="link-accent" href="/${p.slug}">${escapeHtml(p.title)}</a></${isLead ? 'h1' : 'h2'}>
${p.excerpt ? `<p class="reading-font mt-3 t-body text-text" lang="vi">${escapeHtml(p.excerpt)}</p>` : ''}
</article>
`
  })

  let railHtml = `
<aside class="rail"><div class="rail-inner">
<div><h2>Most viewed</h2><ul style="--count-w:1ch">
${posts.slice(0, 3).map(p => `<li><a class="rail-row link-accent t-small" href="/${p.slug}"><span>${escapeHtml(p.title)}</span></a></li>`).join('')}
</ul></div>
${categories.length > 0 ? `<div><h2>Categories</h2><div class="rail-tags">${categories.map(c => `<a class="link-accent t-small" href="/category/${encodeURIComponent(c.term.toLowerCase())}">${escapeHtml(c.term)}<span class="term-count">${c.count}</span></a>`).join('')}</div></div>` : ''}
${seriesList.length > 0 ? `<div><h2>Series</h2><div class="rail-tags">${seriesList.map(s => `<a class="link-accent t-small" href="/series/${encodeURIComponent(s.series.toLowerCase())}">${escapeHtml(s.series)}<span class="term-count">${s.count}</span></a>`).join('')}</div></div>` : ''}
<div><h2>Tags</h2><div class="rail-tags lower">${tags.map(t => `<a class="link-accent t-small" href="/tag/${encodeURIComponent(t.term.toLowerCase())}">${escapeHtml(t.term)}</a>`).join('')}</div></div>
</div></aside>
`

  const listContent = `<div class="post-list">${postArticles}</div>`
  return c.html(renderShell({
    title: 'Quire Ink',
    description: 'Resonance Calendar — Tri thức & Công nghệ',
    canonical: 'https://rc.gogl.be/',
    content: listContent,
    rail: railHtml
  }))
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

// 3. Search Page
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

  const searchContent = `
<div class="search-wrap">
  <h1 class="reading-font fs-h1 font-semibold" style="margin-bottom:1.5rem;">Search</h1>
  <form method="GET" action="/search" style="margin-bottom:2rem;display:flex;gap:0.5rem;">
    <input type="text" name="q" value="${escapeHtml(q || '')}" placeholder="Type to search posts..." 
      style="width:100%;max-width:400px;padding:0.6rem 0.8rem;font-size:1rem;border:1px solid var(--c-rule);border-radius:var(--radius);background:var(--c-bg);color:var(--c-text);">
    <button type="submit" class="icon-btn" style="padding:0.6rem 1.2rem;border-radius:var(--radius);background:var(--c-heading);color:var(--c-bg);border:none;cursor:pointer;">Search</button>
  </form>

  ${q ? `
    <p class="t-small text-meta" style="margin-bottom:1.5rem;">Found ${results.length} result(s) for "<strong>${escapeHtml(q)}</strong>":</p>
    <div class="post-list">
      ${results.map((p) => `
        <article class="reveal">
          <p class="t-small text-meta"><time>${formatDisplayDate(p.date)}</time></p>
          <h2 class="reading-font mt-2 fs-h2 font-semibold"><a class="link-accent" href="/${p.slug}">${escapeHtml(p.title)}</a></h2>
          ${p.excerpt ? `<p class="reading-font mt-3 t-body text-text">${escapeHtml(p.excerpt)}</p>` : ''}
        </article>
      `).join('')}
    </div>
  ` : ''}
</div>
`

  return c.html(renderShell({
    title: 'Search',
    canonical: 'https://rc.gogl.be/search',
    content: searchContent
  }))
})

// 4. API Direct Publish
app.post('/api/publish', async (c) => {
  const authHeader = c.req.header('Authorization')
  const secret = c.env.API_SECRET || 'goglbe-edge-secret-2026'

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

// 5. Post details
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  
  const post = await c.env.DB.prepare(`
    SELECT slug, title, date, excerpt, content, reading_minutes, series, meta_title, meta_description
    FROM posts
    WHERE slug = ? AND status = 'published' AND deleted_at IS NULL
  `).bind(slug).first<Post>()

  if (!post) {
    return c.html(renderShell({
      title: 'Not Found',
      content: `<div style="text-align:center;padding:4rem 0;"><h1 class="fs-h1 font-semibold">404 - Not Found</h1><p class="mt-3"><a class="link-accent" href="/">Back to home</a></p></div>`
    }), 404)
  }

  const { results: terms } = await c.env.DB.prepare(`
    SELECT kind, term FROM post_terms WHERE post_slug = ?
  `).bind(slug).all<{ kind: string; term: string }>()

  const tags = terms.filter(t => t.kind === 'tag')
  const categories = terms.filter(t => t.kind === 'category')

  const formattedDate = formatDisplayDate(post.date)
  const dateIso = new Date(post.date).toISOString()
  const wordCount = post.content.replace(/<[^>]+>/g, '').split(/\s+/).length
  const readMin = post.reading_minutes || Math.ceil(wordCount / 200)

  // Get next post & related posts
  const nextPost = await c.env.DB.prepare(`
    SELECT slug, title FROM posts
    WHERE date < ? AND status = 'published' AND deleted_at IS NULL
    ORDER BY date DESC LIMIT 1
  `).bind(post.date).first<Post>()

  const { results: relatedPosts } = await c.env.DB.prepare(`
    SELECT slug, title, date FROM posts
    WHERE slug != ? AND status = 'published' AND deleted_at IS NULL
    ORDER BY date DESC LIMIT 3
  `).bind(slug).all<Post>()

  const articleHtml = `
<article>
<header>
<p class="t-small text-meta post-meta"><a class="post-cat link-accent" href="/category/${encodeURIComponent((post.series || 'Articles').toLowerCase())}">${escapeHtml(post.series || 'Articles')}</a> <span class="post-facts"><time datetime="${dateIso}">${formattedDate}</time> · <span class="num">${wordCount.toLocaleString()}</span> words · <span class="num">${readMin}</span> min read<span class="meta-book"> · <button type="button" class="book-mode-toggle" data-book-open>Book mode</button></span></span></p>
<h1 class="reading-font mt-2 fs-h1 font-semibold">${escapeHtml(post.title)}</h1>
${post.excerpt ? `<p class="deck">${escapeHtml(post.excerpt)}</p>` : ''}
</header>
<aside class="post-info t-small text-meta">
<p><time datetime="${dateIso}">${formattedDate}</time></p>
<p><span class="num">${wordCount.toLocaleString()}</span> words · <span class="num">${readMin}</span> min read</p>
<span class="anchor" id="post-info-tags"></span>
${tags.length > 0 ? `<p class="info-terms">Tag: <span class="term-list">${tags.map(t => `<a class="link-accent lower" href="/tag/${encodeURIComponent(t.term.toLowerCase())}">${escapeHtml(t.term)}</a>`).join(', ')}</span></p>` : ''}
<span class="anchor" id="post-info-categories"></span>
${categories.length > 0 ? `<p class="info-terms">Category: <span class="term-list">${categories.map(c => `<a class="link-accent" href="/category/${encodeURIComponent(c.term.toLowerCase())}">${escapeHtml(c.term)}</a>`).join(', ')}</span></p>` : ''}
<p class="info-action"><button type="button" class="book-mode-toggle" data-book-open><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5C10.4 5.2 8.4 4.5 6 4.5H4v13h2c2.4 0 4.4.7 6 2 1.6-1.3 3.6-2 6-2h2v-13h-2c-2.4 0-4.4.7-6 2z"/><path d="M12 6.5v13"/><path d="M10.3 9.5v4.5" stroke-width="1.4"/></svg><span>Book mode</span></button></p>
</aside>
<aside class="rail rail-toc"><div class="rail-inner"><nav class="toc" aria-label="Contents">
<details open><summary><h2>Contents</h2></summary>
<ul><li><a class="rail-row link-accent t-small is-active" href="#top">${escapeHtml(post.title)}</a></li><li><a class="rail-row link-accent t-small toc-end" href="#post-tags">Tag / Category</a></li></ul>
</details>
</nav></div></aside>
<div id="post-body" class="prose">
${renderPostMarkdown(post.content, post.title)}
</div>
<span class="anchor" id="post-tags"></span><span class="anchor" id="post-categories"></span>
<hr class="taxo-rule">
<footer class="post-taxo t-small text-meta">
${tags.length > 0 ? `<p>Tag: <span class="term-list">${tags.map(t => `<a class="link-accent lower" href="/tag/${encodeURIComponent(t.term.toLowerCase())}">${escapeHtml(t.term)}</a>`).join(', ')}</span></p>` : ''}
${categories.length > 0 ? `<p>Category: <span class="term-list">${categories.map(c => `<a class="link-accent" href="/category/${encodeURIComponent(c.term.toLowerCase())}">${escapeHtml(c.term)}</a>`).join(', ')}</span></p>` : ''}
</footer>
${nextPost ? `<hr><section class="read-next"><p class="read-next-label">Read next</p><p class="read-next-title reading-font"><a class="link-accent" href="/${nextPost.slug}">${escapeHtml(nextPost.title)}</a></p></section>` : ''}
${relatedPosts.length > 0 ? `<hr><section class="related"><h2>Related posts</h2><ul>${relatedPosts.map(r => `<li><a class="link-accent" href="/${r.slug}">${escapeHtml(r.title)}</a><p class="t-small text-meta">${formatDisplayDate(r.date)}</p></li>`).join('')}</ul></section>` : ''}
</article>
`

  return c.html(renderShell({
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || undefined,
    canonical: `https://rc.gogl.be/${post.slug}`,
    ogType: 'article',
    isArticle: true,
    content: articleHtml
  }))
})

export default app
