import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";
import { toast } from "sonner";
import { Mail, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "magic" | "password";

export default function Login() {
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submitMagic = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authService.signInWithMagicLink(email);
    setLoading(false);
    if (error) { toast.error(`Não foi possível enviar o link: ${error.message}`); return; }
    setSent(true);
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authService.signInWithPassword(email, password);
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("Invalid login credentials")
          ? "Email ou senha incorretos."
          : `Erro ao entrar: ${error.message}`,
      );
    }
    // se ok, AuthWatcher cuida do redirect
  };

  if (sent) {
    return (
      <AuthLayout title="Olhe seu email" subtitle="Um link mágico está a caminho.">
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-sunset-soft flex items-center justify-center">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-base">Enviamos um link para <span className="font-semibold">{email}</span>.</p>
            <p className="text-sm text-muted-foreground">Abra o email e clique no link para entrar. Não chegou em 1 minuto? Confira o spam.</p>
          </div>
          <Button type="button" variant="ghost" onClick={() => { setSent(false); setEmail(""); }} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Usar outro email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Entrar no Dusk" subtitle="Sua próxima viagem está esperando.">
      <div className="space-y-5">
        {/* Toggle */}
        <div className="inline-flex w-full rounded-full bg-muted p-1">
          {(["magic", "password"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-full py-1.5 text-sm font-medium transition-colors",
                mode === m ? "bg-card shadow-soft text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {m === "magic" ? "Link mágico" : "Email e senha"}
            </button>
          ))}
        </div>

        {mode === "magic" ? (
          <form onSubmit={submitMagic} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                autoComplete="email"
                autoFocus
              />
              <p className="text-xs text-muted-foreground">Enviaremos um link para entrar sem precisar de senha.</p>
            </div>
            <Button type="submit" variant="sunset" size="lg" className="w-full" disabled={loading || !email}>
              {loading ? "Enviando..." : "Receber link mágico"}
            </Button>
          </form>
        ) : (
          <form onSubmit={submitPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-pw">Email</Label>
              <Input
                id="email-pw"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@email.com"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                  Esqueci minha senha
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" variant="sunset" size="lg" className="w-full" disabled={loading || !email || !password}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        )}

        <p className="text-sm text-muted-foreground text-center">
          Não tem conta? <Link to="/signup" className="text-primary font-medium hover:underline">Criar conta</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
