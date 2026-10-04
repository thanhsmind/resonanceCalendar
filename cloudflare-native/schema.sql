-- Cloudflare D1 Schema for ResonanceCalendar Blog

CREATE TABLE IF NOT EXISTS posts (
  slug             TEXT PRIMARY KEY,
  title            TEXT NOT NULL DEFAULT '',
  date             INTEGER NOT NULL,
  status           TEXT NOT NULL DEFAULT 'published',
  featured_image   TEXT,
  excerpt          TEXT,
  reading_minutes  INTEGER,
  content          TEXT NOT NULL DEFAULT '',
  series           TEXT,
  series_order     INTEGER NOT NULL DEFAULT 0,
  meta_title       TEXT,
  meta_description TEXT,
  cover_image      TEXT,
  created_at       INTEGER NOT NULL,
  updated_at       INTEGER NOT NULL,
  lang             TEXT DEFAULT 'vi',
  deleted_at       INTEGER
);

CREATE INDEX IF NOT EXISTS idx_posts_status_date ON posts (status, date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_series ON posts (series);

CREATE TABLE IF NOT EXISTS post_terms (
  post_slug TEXT NOT NULL,
  kind      TEXT NOT NULL,
  term      TEXT NOT NULL,
  PRIMARY KEY (post_slug, kind, term)
);

CREATE INDEX IF NOT EXISTS idx_post_terms_lookup ON post_terms (kind, term, post_slug);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
