import { useState } from "react";
import { DollarSign, Fuel, Zap, TrendingUp, Settings, FileText, Download } from "lucide-react";
import ManagePostoUsers from "@/components/ManagePostoUsers";
import { useAuth } from "@/contexts/AuthContext";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MetricCard from "@/components/MetricCard";
import {
  mockPosto, mockAbastecimentosHora, mockFaturamentoDia,
  mockPagamentos, mockAbastecimentosRealtime, mockHistorico,
} from "@/lib/mock-data";
import { toast } from "sonner";

const PIE_COLORS = ["hsl(160,84%,39%)", "hsl(217,91%,60%)"];

const PostoDashboard = () => {
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const [precoKwh, setPrecoKwh] = useState(mockPosto.config.preco_kwh.toString());
  const [cashback, setCashback] = useState(mockPosto.config.cashback_percent.toString());
  const totalAbastecimentos = mockAbastecimentosRealtime.length;
  const energiaHoje = mockAbastecimentosRealtime.reduce((s, a) => s + a.kwh, 0);

  const handleSaveConfig = () => {
    toast.success("Configurações salvas com sucesso!");
  };

  return (
    <div className="container mx-auto max-w-6xl space-y-6 px-4 py-6">
      <h1 className="text-xl font-bold text-foreground">Painel do Posto 🏪</h1>

      {/* Top Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={DollarSign} title="Faturamento Hoje" value={`R$ ${mockPosto.faturamento.hoje.toFixed(2)}`} variant="amber" />
        <MetricCard icon={TrendingUp} title="Faturamento Semana" value={`R$ ${mockPosto.faturamento.semana.toFixed(2)}`} variant="blue" />
        <MetricCard icon={Fuel} title="Abastecimentos Hoje" value={totalAbastecimentos} variant="green" />
        <MetricCard icon={Zap} title="Energia Hoje" value={`${energiaHoje.toFixed(1)} kWh`} variant="green" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Line chart */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Abastecimentos por Hora (24h)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockAbastecimentosHora}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hora" fontSize={10} tickLine={false} stroke="hsl(var(--muted-foreground))" interval={3} />
              <YAxis fontSize={10} tickLine={false} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="abastecimentos" stroke="hsl(var(--secondary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Formas de Pagamento</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mockPagamentos} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name} ${value}%`} fontSize={11}>
                {mockPagamentos.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bar chart full width */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Faturamento por Dia da Semana</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={mockFaturamentoDia}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="dia" fontSize={11} tickLine={false} stroke="hsl(var(--muted-foreground))" />
            <YAxis fontSize={11} tickLine={false} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid hsl(var(--border))" }} formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
            <Bar dataKey="valor" fill="hsl(var(--energy-amber))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Realtime Table */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <h3 className="mb-3 text-sm font-semibold text-foreground flex items-center gap-2">
          <Fuel className="h-4 w-4 text-primary" /> Abastecimentos em Tempo Real
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="pb-2 font-medium">Horário</th>
                <th className="pb-2 font-medium">Cliente</th>
                <th className="pb-2 font-medium">kWh</th>
                <th className="pb-2 font-medium">Valor</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {mockAbastecimentosRealtime.map((a) => (
                <tr key={a.id} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 text-foreground">{a.horario}</td>
                  <td className="py-2.5 text-foreground">{a.cliente}</td>
                  <td className="py-2.5 font-semibold text-foreground">{a.kwh} kWh</td>
                  <td className="py-2.5 text-foreground">R$ {a.valor.toFixed(2)}</td>
                  <td className="py-2.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      a.status === "Em andamento"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${a.status === "Em andamento" ? "bg-primary" : "bg-muted-foreground"}`} />
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Config + Reports */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Config */}
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings className="h-4 w-4 text-muted-foreground" /> Configurações do Posto
          </h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Preço do kWh (R$)</Label>
              <Input value={precoKwh} onChange={(e) => setPrecoKwh(e.target.value)} type="number" step="0.01" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Cashback (%)</Label>
              <Input value={cashback} onChange={(e) => setCashback(e.target.value)} type="number" className="mt-1" />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary" /> Estação Online
            </div>
            <Button onClick={handleSaveConfig} className="w-full gradient-energy text-primary-foreground font-semibold hover:opacity-90">
              Salvar Configurações
            </Button>
          </div>
        </div>

        {/* Reports */}
        <div className="rounded-2xl bg-card p-5 shadow-card flex flex-col">
          <h3 className="mb-4 text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Relatórios
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Exporte dados por período para análise detalhada.</p>
          <div className="mt-auto flex flex-col gap-2">
            <Button variant="outline" className="gap-2" onClick={() => toast.info("Exportação PDF em desenvolvimento")}>
              <Download className="h-4 w-4" /> Exportar Relatório PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => toast.info("Exportação CSV em desenvolvimento")}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostoDashboard;
