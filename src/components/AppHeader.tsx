import { Sun, ArrowLeftRight, Zap } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCliente = location.pathname.startsWith("/cliente");
  const isPosto = location.pathname.startsWith("/posto");
  const showSwitch = isCliente || isPosto;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-energy">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight text-foreground">Smart Solar</span>
            <span className="text-[10px] font-medium leading-tight text-muted-foreground">por Indução</span>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {showSwitch && (
            <>
              <span className="hidden sm:inline text-xs font-medium text-muted-foreground px-2 py-1 rounded-full bg-muted">
                {isCliente ? "👤 Cliente" : "🏪 Posto"}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-1.5 text-xs"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Trocar Perfil</span>
              </Button>
            </>
          )}
          <Sun className="h-5 w-5 text-energy-amber" />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
