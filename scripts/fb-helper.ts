import { openDatabases, closeDatabases } from '@/store/db'
import { readEnv } from '@/env'
import { all } from '@/store/query'

openDatabases(readEnv().dataDir)

const sql = "select slug, title, content from posts where slug not in (select post_slug from post_terms where term = 'PostedFB') and slug not in ('bai-viet-thu-nghiem-resonance', 'mien-vi-du-example-domain') order by date desc"
const unposted = all(sql) as { slug: string; title: string; content: string }[]

closeDatabases()

if (!unposted || unposted.length === 0) {
  console.log(JSON.stringify({ success: false, error: "No unposted articles found." }))
  process.exit(1)
}

console.log(JSON.stringify({ success: true, post: unposted[0] }))
