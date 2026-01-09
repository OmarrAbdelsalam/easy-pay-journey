-- Add status column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN status text NOT NULL DEFAULT 'pending';

-- Add check constraint for valid status values
ALTER TABLE public.bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Create policy to allow updating booking status
CREATE POLICY "Anyone can update booking status"
ON public.bookings
FOR UPDATE
USING (true)
WITH CHECK (true);