import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Zap, Mail, Lock, User, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Login realizado com sucesso!");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: displayName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Conta criada! Verifique seu e-mail para confirmar.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Brand */}
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl gradient-energy shadow-lg">
            <Zap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Plug & <span className="text-primary">Charge</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isLogin ? "Entre na sua conta" : "Crie sua conta gratuita"}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-card p-8 shadow-card border border-border">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-muted-foreground">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-10 bg-muted border-border"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-muted border-border"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-muted border-border"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-energy text-primary-foreground font-semibold hover:opacity-90 h-11"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {isLogin ? "Entrar" : "Criar conta"}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? (
                <>Não tem conta? <span className="font-semibold text-primary">Cadastre-se</span></>
              ) : (
                <>Já tem conta? <span className="font-semibold text-primary">Fazer login</span></>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Recarga sem fio alimentada por energia solar ☀️
        </p>
      </div>
    </div>
  );
};

export default Auth;
