-- =====================================================================
-- Site settings: editable key/value strings used by public pages and
-- the admin shell. Run this in the Supabase SQL editor.
-- =====================================================================

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Site settings are viewable by everyone" ON site_settings;
CREATE POLICY "Site settings are viewable by everyone"
  ON site_settings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage site settings" ON site_settings;
CREATE POLICY "Authenticated users can manage site settings"
  ON site_settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION update_site_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS site_settings_updated_at ON site_settings;
CREATE TRIGGER site_settings_updated_at
  BEFORE UPDATE ON site_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_site_settings_updated_at();

-- Seed defaults (existing values are preserved)
INSERT INTO site_settings (key, value) VALUES
  ('site_title',        'United States — World Wide Recruitment'),
  ('contact_phone',     '+1 (352) 617-9517'),
  ('principal_name',    'Jonny Scott-Slater'),
  ('business_location', 'Southern United States'),
  ('careers_intro',     'Executive recruitment business with world-wide clients situated in the United States and other selected global business locations.'),
  ('contact_intro',     'For executive search enquiries, retained assignments, or to discuss a confidential appointment, please contact us directly.')
ON CONFLICT (key) DO NOTHING;
