# Hướng dẫn Triển khai Cloudflare Native (D1 + Worker) cho rc.gogl.be

Toàn bộ mã nguồn Cloudflare Native đã được tạo tại thư mục:
`~/Projects/goglbe/resonanceCalendar/cloudflare-native`

---

## Bước 1: Đăng nhập Cloudflare bằng Wrangler CLI
Trong terminal, chạy:
```bash
cd ~/Projects/goglbe/resonanceCalendar/cloudflare-native
bun x wrangler login
```
*(Trình duyệt sẽ mở ra để anh cấp quyền cho Wrangler)*

---

## Bước 2: Tạo D1 Database trên Cloudflare
Chạy lệnh tạo database `rc-db`:
```bash
bun x wrangler d1 create rc-db
```
Wrangler sẽ in ra thông tin cấu hình dạng:
```toml
[[d1_databases]]
binding = "DB"
database_name = "rc-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```
👉 Anh copy đoạn `database_id` đó dán vào file `wrangler.toml`.

---

## Bước 3: Nạp Schema và Seed 45 bài viết vào D1
Chạy lần lượt 2 lệnh:
```bash
# 1. Tạo bảng
bun x wrangler d1 execute rc-db --remote --file=./schema.sql

# 2. Nạp toàn bộ 45 bài viết và categories từ database SQLite gốc
bun x wrangler d1 execute rc-db --remote --file=./seed.sql
```

---

## Bước 4: Deploy Worker lên Cloudflare
```bash
bun x wrangler deploy
```

---

## Bước 5: Gắn Custom Domain (rc.gogl.be)
Vào **Cloudflare Dashboard** → **Workers & Pages** → Chọn Worker `rc-goglbe` → Tab **Settings** → **Domains & Routes** → **Add Custom Domain** → Nhập `rc.gogl.be`.

---

## Bước 6: Đăng bài mới trực tiếp qua API (Không cần Git push hay build lại)
Từ nay, khi cào bài hoặc viết bài mới, AI/Script chỉ cần gửi POST request:
```bash
curl -X POST https://rc.gogl.be/api/publish \
  -H "Authorization: Bearer goglbe-edge-secret-2026" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "bai-viet-moi",
    "title": "Tiêu đề bài viết",
    "excerpt": "Đoạn trích tóm tắt",
    "content": "<p>Nội dung HTML bài viết...</p>",
    "series": "AI/LLM"
  }'
```
Bài viết sẽ xuất hiện ngay lập tức trên trang chủ và RSS feed tại edge toàn cầu!
