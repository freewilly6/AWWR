-- =====================================================================
-- Admin upgrades: soft delete + scheduled publishing via published_at
-- Run this in the Supabase SQL editor.
-- =====================================================================

-- 1. Soft delete column ------------------------------------------------
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_posts_deleted_at
  ON posts (deleted_at);

-- 2. Replace public read policy ---------------------------------------
--    Only published, non-deleted posts whose published_at has arrived
--    are visible to anon. A post with published_at in the future is
--    effectively "scheduled" — it flips on automatically at that time.
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON posts;

CREATE POLICY "Published posts are viewable by everyone"
  ON posts FOR SELECT
  USING (
    status = 'published'
    AND deleted_at IS NULL
    AND (published_at IS NULL OR published_at <= NOW())
  );
