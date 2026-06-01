
-- STATIONS
CREATE TABLE public.stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posto_user_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  device_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  is_online BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stations TO authenticated;
GRANT ALL ON public.stations TO service_role;

ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all stations" ON public.stations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Posto owners view own stations" ON public.stations
  FOR SELECT TO authenticated
  USING (auth.uid() = posto_user_id);

CREATE POLICY "Posto owners update own stations" ON public.stations
  FOR UPDATE TO authenticated
  USING (auth.uid() = posto_user_id);

CREATE TRIGGER stations_updated_at
  BEFORE UPDATE ON public.stations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- SENSOR READINGS
CREATE TABLE public.sensor_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  voltage NUMERIC(8,2),
  current NUMERIC(8,2),
  power NUMERIC(10,2),
  energy_kwh NUMERIC(10,3),
  temperature NUMERIC(6,2),
  vehicle_detected BOOLEAN NOT NULL DEFAULT false,
  charging_status TEXT NOT NULL DEFAULT 'idle',
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sensor_readings_station_time
  ON public.sensor_readings (station_id, recorded_at DESC);

GRANT SELECT, INSERT ON public.sensor_readings TO authenticated;
GRANT ALL ON public.sensor_readings TO service_role;

ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all readings" ON public.sensor_readings
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Posto owners view own readings" ON public.sensor_readings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stations s
    WHERE s.id = station_id AND s.posto_user_id = auth.uid()
  ));

-- CHARGING SESSIONS
CREATE TABLE public.charging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id UUID NOT NULL REFERENCES public.stations(id) ON DELETE CASCADE,
  cliente_user_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_kwh NUMERIC(10,3) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_charging_sessions_station ON public.charging_sessions (station_id, started_at DESC);
CREATE INDEX idx_charging_sessions_cliente ON public.charging_sessions (cliente_user_id, started_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.charging_sessions TO authenticated;
GRANT ALL ON public.charging_sessions TO service_role;

ALTER TABLE public.charging_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage all sessions" ON public.charging_sessions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clientes view own sessions" ON public.charging_sessions
  FOR SELECT TO authenticated
  USING (auth.uid() = cliente_user_id);

CREATE POLICY "Posto owners view own station sessions" ON public.charging_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.stations s
    WHERE s.id = station_id AND s.posto_user_id = auth.uid()
  ));

CREATE TRIGGER charging_sessions_updated_at
  BEFORE UPDATE ON public.charging_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.stations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.charging_sessions;
