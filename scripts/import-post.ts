import { openDatabases, closeDatabases } from '@/store/db'
import { readEnv } from '@/env'
import { savePost, getPost } from '@/content/posts'
import { slugify } from '@/utils'
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
  const fs = await import("fs")
  jsonInput = fs.readFileSync(0, "utf-8")
}

try {
  const data = JSON.parse(jsonInput) as Partial<PostWithContent>
  const targetSlug = data.slug || slugify(data.title || "untitled")
  
  // Kiểm tra nếu bài đã tồn tại thì truyền previousSlug để cập nhật in-place thay vì báo lỗi slug_taken
  const existing = await getPost(targetSlug)
  const previousSlug = existing ? targetSlug : undefined

  const result = await savePost({
    title: data.title || "Untitled",
    slug: targetSlug,
    content: data.content || "",
    status: data.status || "published",
    date: existing?.date || data.date || new Date().toISOString(),
    excerpt: data.excerpt,
    categories: data.categories || ["Articles"],
    tags: data.tags || [],
    lang: data.lang || "vi",
  }, previousSlug)

  console.log(JSON.stringify({ success: true, post: result }))
} catch (err: any) {
  console.error(JSON.stringify({ success: false, error: err?.message || String(err) }))
  process.exit(1)
} finally {
  closeDatabases()
}
