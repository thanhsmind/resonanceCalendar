# Migration Guide: Quire Ink to Cloudflare Native (D1 + R2 + Workers)

## 1. Schema D1 (SQLite)
D1 sử dụng engine SQLite tương thích trực tiếp với các bảng nội dung của Quire Ink:
- `posts` (slug, title, date, status, excerpt, content, series, etc.)
- `post_terms` (post_slug, kind, term)
- `settings` (id, data)

## 2. API & Edge Rendering (Hono)
- Sử dụng `@hono/node-server` hoặc Worker entrypoint `src/index.ts` kết nối trực tiếp `c.env.DB` (D1 binding).
- Render SSR siêu tốc từ Cloudflare Edge không cần filesystem.

## 3. Storage (R2)
- Toàn bộ media/ảnh từ `uploads/` chuyển vào bucket Cloudflare R2 `rc-media`.
- Endpoint public: `https://rc.gogl.be/media/*` hoặc domain riêng R2.
