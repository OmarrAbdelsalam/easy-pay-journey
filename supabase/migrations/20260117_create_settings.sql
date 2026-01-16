-- Create settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  homepage_mode TEXT NOT NULL DEFAULT 'booking',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default setting
INSERT INTO app_settings (id, homepage_mode) VALUES ('main', 'booking')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings
CREATE POLICY "Anyone can read settings" ON app_settings
  FOR SELECT USING (true);

-- Allow anyone to update settings (you can restrict this later)
CREATE POLICY "Anyone can update settings" ON app_settings
  FOR UPDATE USING (true);
