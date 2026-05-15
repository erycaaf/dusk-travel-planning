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

export default function Signup() {
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
    if (password.length < 6) { toast.error("A senha precisa ter pelo menos 6 caracteres."); return; }
    if (password !== confirm) { toast.error("As senhas não coincidem."); return; }
    setLoading(true);
    const { error } = await authService.signUpWithPassword(email, password);
    setLoading(false);
    if (error) {
      toast.error(
        error.message.includes("already registered")
          ? "Esse email já tem uma conta. Tente entrar."
          : `Erro ao criar conta: ${error.message}`,
      );
      return;
    }
    toast.success("Conta criada! Verifique seu email para confirmar.");
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Olhe seu email" subtitle={mode === "magic" ? "Sua conta está a um clique de distância." : "Confirme seu email para ativar a conta."}>
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-sunset-soft flex items-center justify-center">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-base">Enviamos um email para <span className="font-semibold">{email}</span>.</p>
            <p className="text-sm text-muted-foreground">
              {mode === "magic"
                ? "Clique no link para criar sua conta automaticamente."
                : "Clique no link de confirmação para ativar sua conta."}
              {" "}Não chegou em 1 minuto? Confira o spam.
            </p>
          </div>
          <Button type="button" variant="ghost" onClick={() => { setSent(false); setEmail(""); setPassword(""); setConfirm(""); }} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Usar outro email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Criar sua conta" subtitle="Comece a planejar em poucos minutos.">
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
              <p className="text-xs text-muted-foreground">Sem senha — criaremos sua conta com um clique no link.</p>
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
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="mínimo 6 caracteres"
                  required
                  autoComplete="new-password"
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
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="repita a senha"
                required
                autoComplete="new-password"
              />
              {confirm && password !== confirm && (
                <p className="text-xs text-destructive">As senhas não coincidem.</p>
              )}
            </div>
            <Button
              type="submit"
              variant="sunset"
              size="lg"
              className="w-full"
              disabled={loading || !email || !password || !confirm || password !== confirm}
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        )}

        <p className="text-sm text-muted-foreground text-center">
          Já tem conta? <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
