-- Add column to store companions details as JSON
ALTER TABLE public.bookings 
ADD COLUMN companions_details jsonb DEFAULT '[]'::jsonb;