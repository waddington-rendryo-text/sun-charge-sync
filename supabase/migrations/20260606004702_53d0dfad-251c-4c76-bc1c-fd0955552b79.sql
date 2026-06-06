
-- 1) Create station_secrets table (NOT added to realtime publication)
CREATE TABLE public.station_secrets (
  station_id uuid PRIMARY KEY REFERENCES public.stations(id) ON DELETE CASCADE,
  device_token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.station_secrets TO authenticated;
GRANT ALL ON public.station_secrets TO service_role;

ALTER TABLE public.station_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posto owners view own station secrets"
  ON public.station_secrets FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stations s WHERE s.id = station_id AND s.posto_user_id = auth.uid()));

CREATE POLICY "Admins view all station secrets"
  ON public.station_secrets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Migrate existing tokens
INSERT INTO public.station_secrets (station_id, device_token)
SELECT id, device_token FROM public.stations
ON CONFLICT (station_id) DO NOTHING;

-- 3) Auto-create secret on new station via trigger
CREATE OR REPLACE FUNCTION public.create_station_secret()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.station_secrets (station_id) VALUES (NEW.id)
  ON CONFLICT (station_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_station_secret_trigger
AFTER INSERT ON public.stations
FOR EACH ROW EXECUTE FUNCTION public.create_station_secret();

-- 4) Drop device_token from stations (no longer exposed via realtime)
ALTER TABLE public.stations DROP COLUMN device_token;

-- 5) Add RESTRICTIVE policy on user_roles INSERT to prevent privilege escalation
CREATE POLICY "Only admins may insert roles (restrictive)"
  ON public.user_roles AS RESTRICTIVE
  FOR INSERT TO authenticated, anon
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 6) Revoke EXECUTE on internal trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_station_secret() FROM PUBLIC, anon, authenticated;
