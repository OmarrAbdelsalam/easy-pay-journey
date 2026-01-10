-- Create policy to allow deleting bookings
CREATE POLICY "Anyone can delete bookings"
ON public.bookings
FOR DELETE
USING (true);
