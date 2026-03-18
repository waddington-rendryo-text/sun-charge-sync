import { useNavigate } from "react-router-dom";
import { User, Building2, Zap, Sun, Battery } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { roles, profile } = useAuth();

  const hasClienteRole = roles.includes("cliente") || roles.includes("admin");
  const hasPostoRole = roles.includes("posto") || roles.includes("admin");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-background px-4">
      {/* Hero */}
      <div className="mb-12 flex flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl gradient-energy shadow-lg">
          <Zap className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Plug & <span className="text-primary">Charge</span>
        </h1>
        <p className="mt-3 max-w-md text-sm text-muted-foreground leading-relaxed">
          {profile?.display_name ? `Olá, ${profile.display_name}! ` : ""}
          Selecione seu perfil para continuar.
        </p>
        <div className="mt-4 flex items-center gap-4 text-muted-foreground">
          <Sun className="h-4 w-4 text-energy-amber" />
          <Battery className="h-4 w-4 text-primary" />
          <Zap className="h-4 w-4 text-energy-blue" />
        </div>
      </div>

      {/* Profile Cards */}
      <div className="grid w-full max-w-lg gap-4 sm:grid-cols-2">
        {hasClienteRole && (
          <button
            onClick={() => navigate("/cliente")}
            className="group flex flex-col items-center gap-4 rounded-2xl bg-card p-8 shadow-card border border-border transition-all hover:shadow-card-hover hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl gradient-energy transition-transform group-hover:scale-110">
              <User className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">Cliente</h2>
              <p className="mt-1 text-xs text-muted-foreground">Gerencie suas recargas e acompanhe seu consumo</p>
            </div>
          </button>
        )}

        {hasPostoRole && (
          <button
            onClick={() => navigate("/posto")}
            className="group flex flex-col items-center gap-4 rounded-2xl bg-card p-8 shadow-card border border-border transition-all hover:shadow-card-hover hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-secondary"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-xl gradient-info transition-transform group-hover:scale-110">
              <Building2 className="h-8 w-8 text-secondary-foreground" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-foreground">Posto</h2>
              <p className="mt-1 text-xs text-muted-foreground">Painel administrativo com métricas e controles</p>
            </div>
          </button>
        )}
      </div>

      <p className="mt-10 text-[11px] text-muted-foreground">
        Plug & Charge — Energia limpa para mobilidade elétrica ☀️
      </p>
    </div>
  );
};

export default Index;
