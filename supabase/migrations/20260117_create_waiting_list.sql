-- Create waiting_list table
CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  selected_package TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert
CREATE POLICY "Anyone can insert to waiting_list" ON waiting_list
  FOR INSERT WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read waiting_list" ON waiting_list
  FOR SELECT USING (true);
