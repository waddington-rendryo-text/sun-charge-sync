import { useEffect, useState } from "react";
import { Battery, Zap, Sun, Gift, BarChart3, Car, Activity, DollarSign, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import MetricCard from "@/components/MetricCard";
import { mockEstacao, mockHistorico, mockConsumoSemanal, mockPosto } from "@/lib/mock-data";
import { toast } from "sonner";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const ClienteDashboard = () => {
  const { profile } = useAuth();
  const [stationId, setStationId] = useState<string | null>(null);
  const [chargeEnabled, setChargeEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const { data } = await supabase
        .from("stations")
        .select("id, charge_enabled")
        .limit(1)
        .maybeSingle();
      if (!data) return;
      setStationId(data.id);
      setChargeEnabled(!!data.charge_enabled);

      channel = supabase
        .channel(`station-${data.id}`)
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "stations", filter: `id=eq.${data.id}` },
          (payload) => {
            const row = payload.new as { charge_enabled?: boolean };
            if (typeof row.charge_enabled === "boolean") setChargeEnabled(row.charge_enabled);
          },
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const status = chargeEnabled ? "carregando" : "parado";
  const deteccao = mockEstacao.sensores.deteccao;
  const eficiencia = mockEstacao.sensores.eficiencia;
  const potencia = chargeEnabled ? mockEstacao.energia.potencia : 0;
  const kwhFornecido = mockEstacao.energia.kwh_fornecido;
  const bateriaPercent = Math.min(100, Math.round((mockEstacao.energia.tensao_bateria / 14.4) * 100));

  const totalKwh = mockHistorico.reduce((sum, s) => sum + s.kwh, 0);
  const totalGasto = mockHistorico.reduce((sum, s) => sum + s.custo, 0);
  const cashbackSaldo = totalGasto * (mockPosto.config.cashback_percent / 100);

  const setCharge = async (enabled: boolean) => {
    if (!stationId) {
      toast.error("Nenhuma estação cadastrada.");
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("stations")
      .update({ charge_enabled: enabled })
      .eq("id", stationId);
    setLoading(false);
    if (error) {
      toast.error("Falha ao enviar comando: " + error.message);
      return;
    }
    setChargeEnabled(enabled);
    toast.success(enabled ? "Comando enviado: INICIAR ⚡" : "Comando enviado: PARAR");
  };

  const handleStart = () => setCharge(true);
  const handleStop = () => setCharge(false);


  return (
    <div className="container mx-auto max-w-5xl space-y-6 px-4 py-6">
      {/* Greeting */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-lg font-bold text-foreground">
          J
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Olá, {profile?.display_name || "Usuário"}! 👋</h1>
          <p className="text-xs text-muted-foreground">Plano Residencial — Autoconsumo</p>
        </div>
      </div>

      {/* Charging Control */}
      <div className="rounded-2xl bg-card p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
          <Zap className="h-4 w-4 text-primary" /> Controle de Carregamento
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Car className="h-4 w-4" />
              <span className="text-muted-foreground">Veículo:</span>
              <span className={deteccao ? "font-semibold text-primary" : "font-semibold text-energy-amber"}>
                {deteccao ? "✅ Detectado" : "⏳ Aguardando"}
              </span>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>Eficiência do acoplamento</span>
                <span className="font-semibold text-foreground">{eficiencia}%</span>
              </div>
              <Progress value={eficiencia} className="h-2.5 [&>div]:gradient-energy" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Potência</p>
                <p className="text-lg font-bold text-foreground">{(potencia / 1000).toFixed(1)} <span className="text-xs font-normal">kW</span></p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Sessão</p>
                <p className="text-lg font-bold text-foreground">{kwhFornecido} <span className="text-xs font-normal">kWh</span></p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full ${status === "carregando" ? "gradient-energy animate-pulse" : "bg-muted"}`}>
              <Zap className={`h-10 w-10 ${status === "carregando" ? "text-primary-foreground" : "text-muted-foreground"}`} />
            </div>
            <span className="text-sm font-bold text-foreground">
              {status === "carregando" ? "⚡ CARREGANDO" : "⏸️ PARADO"}
            </span>
            {status === "parado" ? (
              <Button
                onClick={handleStart}
                disabled={loading || !deteccao}
                className="w-full max-w-[200px] gradient-energy text-primary-foreground font-semibold hover:opacity-90"
                size="lg"
              >
                {loading ? "Iniciando..." : "INICIAR CARREGAMENTO"}
              </Button>
            ) : (
              <Button
                onClick={handleStop}
                disabled={loading}
                variant="destructive"
                className="w-full max-w-[200px] font-semibold"
                size="lg"
              >
                {loading ? "Parando..." : "PARAR CARREGAMENTO"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={BarChart3} title="Total Recargas" value={mockHistorico.length} variant="blue" />
        <MetricCard icon={Activity} title="kWh Consumidos" value={totalKwh.toFixed(1)} variant="green" />
        <MetricCard icon={DollarSign} title="Total Gasto" value={`R$ ${totalGasto.toFixed(2)}`} variant="amber" />
        <MetricCard icon={Gift} title="Cashback" value={`R$ ${cashbackSaldo.toFixed(2)}`} subtitle="5% de volta a cada recarga" variant="green" />
      </div>

      {/* Charts & Solar */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Weekly chart */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-energy-blue" /> Consumo — Últimos 7 dias
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={mockConsumoSemanal}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" fontSize={11} tickLine={false} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={11} tickLine={false} stroke="hsl(var(--muted-foreground))" unit=" kWh" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="kwh" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Solar */}
        <div className="rounded-2xl bg-card p-5 shadow-card flex flex-col items-center justify-center gap-3 text-center">
          <Sun className="h-10 w-10 text-energy-amber" />
          <h3 className="text-sm font-semibold text-foreground">Energia Solar ☀️</h3>
          <div className="w-full space-y-2">
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Bateria da Estação</p>
              <p className="text-2xl font-bold text-foreground">{bateriaPercent}%</p>
              <Progress value={bateriaPercent} className="mt-1 h-2.5 [&>div]:gradient-solar" />
            </div>
            <div>
              <p className="text-[10px] uppercase text-muted-foreground">Gerada Hoje</p>
              <p className="text-lg font-bold text-foreground">4.8 <span className="text-xs font-normal">kWh</span></p>
            </div>
          </div>
          <p className="text-[11px] font-medium text-primary">Carregando com energia limpa ☀️</p>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" /> Últimas Recargas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Data</th>
                <th className="pb-2 font-medium">kWh</th>
                <th className="pb-2 font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {mockHistorico.map((s) => (
                <tr key={s.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 text-foreground">{format(new Date(s.inicio), "dd/MM/yyyy HH:mm")}</td>
                  <td className="py-2.5 font-semibold text-foreground">{s.kwh} kWh</td>
                  <td className="py-2.5 text-foreground">R$ {s.custo.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClienteDashboard;
