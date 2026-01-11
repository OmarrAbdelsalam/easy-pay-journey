-- Add booking_type column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN booking_type text NOT NULL DEFAULT 'student';

-- Add check constraint for valid booking_type values
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_booking_type_check 
CHECK (booking_type IN ('student', 'grad'));
