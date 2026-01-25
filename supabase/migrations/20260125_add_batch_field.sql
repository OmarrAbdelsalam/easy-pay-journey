-- Add batch field to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS batch INTEGER DEFAULT 1;

-- Add batch field to waiting_list table
ALTER TABLE waiting_list ADD COLUMN IF NOT EXISTS batch INTEGER DEFAULT 1;

-- Update app_settings to track current active batch
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS active_batch INTEGER DEFAULT 2;

-- Update app_settings to have homepage_mode per batch
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS batch_1_mode VARCHAR(20) DEFAULT 'booking';
ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS batch_2_mode VARCHAR(20) DEFAULT 'booking';
