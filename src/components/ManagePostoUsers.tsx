import { useState } from "react";
import { UserPlus, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ManagePostoUsers = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddPostoUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      // Look up user by email via profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("display_name", email.trim());

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        toast.error("Usuário não encontrado. Verifique o e-mail.");
        setLoading(false);
        return;
      }

      const userId = profiles[0].user_id;

      // Add posto role
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "posto" as const });

      if (roleError) {
        if (roleError.code === "23505") {
          toast.info("Este usuário já possui o perfil de Posto.");
        } else {
          throw roleError;
        }
      } else {
        toast.success(`Perfil Posto atribuído com sucesso!`);
      }

      setEmail("");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao atribuir perfil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-foreground">
          <Shield className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Gerenciar Usuários</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Adicionar Usuário Posto
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Informe o e-mail do usuário cadastrado para atribuir o perfil de Posto.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAddPostoUser} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">E-mail do Usuário</Label>
            <Input
              type="email"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted border-border"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full gradient-energy text-primary-foreground font-semibold hover:opacity-90"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atribuir Perfil Posto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ManagePostoUsers;
