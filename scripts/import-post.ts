import { openDatabases, closeDatabases } from '@/store/db'
import { readEnv } from '@/env'
import { savePost } from '@/content/posts'
import type { PostWithContent } from '@/types'

const env = readEnv()
openDatabases(env.dataDir)

const args = process.argv.slice(2)
let jsonInput = ""

if (args[0] === "--json") {
  jsonInput = args[1]
} else if (args[0] === "--file") {
  const fs = await import("fs")
  jsonInput = fs.readFileSync(args[1], "utf-8")
} else {
  // read stdin
  const fs = await import("fs")
  jsonInput = fs.readFileSync(0, "utf-8")
}

try {
  const data = JSON.parse(jsonInput) as Partial<PostWithContent>
  const result = await savePost({
    title: data.title || "Untitled",
    slug: data.slug,
    content: data.content || "",
    status: data.status || "published",
    date: data.date || new Date().toISOString(),
    excerpt: data.excerpt,
    categories: data.categories || ["Articles"],
    tags: data.tags || [],
    lang: data.lang || "vi",
  })
  console.log(JSON.stringify({ success: true, post: result }))
} catch (err: any) {
  console.error(JSON.stringify({ success: false, error: err?.message || String(err) }))
  process.exit(1)
} finally {
  closeDatabases()
}
