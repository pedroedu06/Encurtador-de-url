CREATE TABLE IF NOT EXISTS public.links (
  id BIGSERIAL PRIMARY KEY,
  shortcode TEXT,
  long_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);