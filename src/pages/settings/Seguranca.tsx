import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";
import { toast } from "sonner";

export default function Seguranca() {
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSave = password.length >= 6 && password === confirm;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await authService.updatePassword(password);
      toast.success("Senha salva com sucesso!");
      setPassword("");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar senha");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => nav("/settings")} aria-label="Voltar">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-display font-semibold text-2xl">Login e segurança</h1>
      </header>

      {/* Info */}
      <div className="rounded-2xl bg-muted/40 border border-border/50 px-5 py-4 flex gap-3 items-start">
        <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>Você sempre pode entrar via <span className="text-foreground font-medium">link mágico</span> — basta digitar seu email na tela de login.</p>
          <p>Definindo uma senha aqui, você passa a ter as duas opções disponíveis.</p>
        </div>
      </div>

      {/* Formulário de senha */}
      <section className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Definir / alterar senha</p>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mínimo 6 caracteres"
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
            {password.length > 0 && password.length < 6 && (
              <p className="text-xs text-destructive">Mínimo de 6 caracteres.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="repita a senha"
              autoComplete="new-password"
            />
            {mismatch && (
              <p className="text-xs text-destructive">As senhas não coincidem.</p>
            )}
          </div>

          <Button variant="sunset" onClick={handleSave} disabled={!canSave || saving} className="w-full">
            {saving ? "Salvando..." : "Salvar senha"}
          </Button>
        </div>
      </section>

      {/* Método de login */}
      <section className="rounded-2xl bg-card border border-border/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-border/50">
          <p className="text-xs uppercase tracking-wide text-muted-foreground font-medium">Métodos de login ativos</p>
        </div>
        <ul className="divide-y divide-border/50">
          <li className="px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Link mágico</p>
              <p className="text-xs text-muted-foreground">Email com link de acesso sem senha</p>
            </div>
            <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-1 font-medium">Ativo</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
