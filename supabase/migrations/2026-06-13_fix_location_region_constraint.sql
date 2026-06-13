-- Fix the drifted location-region CHECK constraint on posts.
--
-- A `valid_location_region` constraint existed in the live DB but not in the
-- repo, and its allowed list was stale — it rejected valid regions like
-- "United Kingdom". This drops it and recreates it to match LOCATION_REGIONS
-- in src/lib/supabase.ts.
--
-- Note: job_category has no CHECK constraint in the DB, so "Sports" (added to
-- JOB_CATEGORIES in code) needs no migration.

ALTER TABLE posts DROP CONSTRAINT IF EXISTS valid_location_region;

ALTER TABLE posts ADD CONSTRAINT valid_location_region CHECK (
  location_region IS NULL OR location_region IN (
    'African Nations', 'Alaska', 'Asia Pacific', 'Canada', 'Caribbean',
    'Europe', 'Greenland', 'Offshore', 'South America', 'United Kingdom',
    'United States', 'World-Wide'
  )
);
