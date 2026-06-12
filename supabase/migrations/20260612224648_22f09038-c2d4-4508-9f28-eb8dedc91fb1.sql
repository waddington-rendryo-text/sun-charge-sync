ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS charge_enabled boolean NOT NULL DEFAULT false;

CREATE POLICY "Authenticated can toggle charge_enabled"
ON public.stations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);