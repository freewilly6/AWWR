-- Create posts table for blogs and job opportunities
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  published_at TIMESTAMPTZ,
  featured_image TEXT,
  post_type TEXT NOT NULL DEFAULT 'blog' CHECK (post_type IN ('blog', 'job')),
  job_category TEXT,
  location_region TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title TEXT,
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_posts_type_status ON posts (post_type, status);
CREATE INDEX idx_posts_slug ON posts (slug);
CREATE INDEX idx_posts_category ON posts (job_category) WHERE post_type = 'job';
CREATE INDEX idx_posts_region ON posts (location_region) WHERE post_type = 'job';

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Public read access for published posts
CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (status = 'published');

-- Allow authenticated users to manage posts (for admin)
CREATE POLICY "Authenticated users can manage posts"
  ON posts FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Or if using service role key for admin, allow all via service role
-- The service role key bypasses RLS automatically

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
