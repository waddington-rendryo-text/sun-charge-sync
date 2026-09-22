import { Zap, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const AppHeader = () => {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-energy">
            <Zap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold leading-tight text-foreground">Plug &amp; Charge</span>
            <span className="text-[10px] font-medium leading-tight text-muted-foreground">Recarga Solar</span>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {profile && (
            <span className="hidden md:inline text-xs text-muted-foreground">
              {profile.display_name}
            </span>
          )}
          <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9 text-muted-foreground hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
