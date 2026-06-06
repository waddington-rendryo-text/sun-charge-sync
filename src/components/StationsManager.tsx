import { useEffect, useState } from "react";
import { Plus, Copy, Radio, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Station {
  id: string;
  name: string;
  location: string | null;
  is_online: boolean;
  last_seen_at: string | null;
}

interface Reading {
  id: string;
  station_id: string;
  voltage: number | null;
  current: number | null;
  power: number | null;
  energy_kwh: number | null;
  charging_status: string;
  vehicle_detected: boolean;
  recorded_at: string;
}

const StationsManager = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState<Station[]>([]);
  const [tokens, setTokens] = useState<Record<string, string>>({});
  const [latestByStation, setLatestByStation] = useState<Record<string, Reading>>({});
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchStations = async () => {
    const { data, error } = await supabase
      .from("stations")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar estações");
      return;
    }
    setStations(data || []);

    if (data && data.length > 0) {
      const ids = data.map((s) => s.id);
      const [{ data: readings }, { data: secrets }] = await Promise.all([
        supabase
          .from("sensor_readings")
          .select("*")
          .in("station_id", ids)
          .order("recorded_at", { ascending: false })
          .limit(100),
        supabase
          .from("station_secrets")
          .select("station_id, device_token")
          .in("station_id", ids),
      ]);
      const map: Record<string, Reading> = {};
      readings?.forEach((r) => {
        if (!map[r.station_id]) map[r.station_id] = r as Reading;
      });
      setLatestByStation(map);
      const tmap: Record<string, string> = {};
      secrets?.forEach((s) => { tmap[s.station_id] = s.device_token; });
      setTokens(tmap);
    }
  };

  useEffect(() => {
    fetchStations();

    const channel = supabase
      .channel("stations-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stations" }, () => {
        fetchStations();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sensor_readings" }, (payload) => {
        const r = payload.new as Reading;
        setLatestByStation((prev) => ({ ...prev, [r.station_id]: r }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;
    setLoading(true);
    const { error } = await supabase.from("stations").insert({
      name: name.trim(),
      location: location.trim() || null,
      posto_user_id: user.id,
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao criar estação: " + error.message);
      return;
    }
    toast.success("Estação criada!");
    setName("");
    setLocation("");
    setOpen(false);
    fetchStations();
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast.success("Token copiado!");
  };

  return (
    <div className="rounded-2xl bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Radio className="h-4 w-4 text-primary" /> Estações ESP32
        </h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Nova Estação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cadastrar nova estação</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label>Nome</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Estação 01" />
              </div>
              <div>
                <Label>Localização</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Ex: Pátio frontal" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreate} disabled={loading || !name.trim()}>
                {loading ? "Salvando..." : "Criar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {stations.length === 0 ? (
        <p className="text-xs text-muted-foreground">Nenhuma estação cadastrada ainda.</p>
      ) : (
        <div className="space-y-3">
          {stations.map((s) => {
            const r = latestByStation[s.id];
            return (
              <div key={s.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${s.is_online ? "bg-primary" : "bg-muted-foreground"}`} />
                      <span className="text-sm font-semibold text-foreground">{s.name}</span>
                      {s.location && <span className="text-xs text-muted-foreground">· {s.location}</span>}
                    </div>
                    {s.last_seen_at && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Última atividade: {new Date(s.last_seen_at).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    disabled={!tokens[s.id]}
                    onClick={() => tokens[s.id] && copyToken(tokens[s.id])}
                  >
                    <Copy className="h-3 w-3" /> Copiar token
                  </Button>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="Tensão" value={r?.voltage != null ? `${r.voltage} V` : "—"} />
                  <Metric label="Corrente" value={r?.current != null ? `${r.current} A` : "—"} />
                  <Metric label="Potência" value={r?.power != null ? `${r.power} W` : "—"} />
                  <Metric label="Energia" value={r?.energy_kwh != null ? `${r.energy_kwh} kWh` : "—"} />
                </div>
                {r && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Zap className="h-3 w-3" />
                    Status: <span className="font-semibold text-foreground">{r.charging_status}</span> ·
                    Veículo: {r.vehicle_detected ? "detectado" : "ausente"}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 p-2">
    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-bold text-foreground">{value}</p>
  </div>
);

export default StationsManager;
