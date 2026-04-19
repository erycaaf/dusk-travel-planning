import { useState } from "react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";
import { toast } from "sonner";
import { Mail, ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await authService.signInWithMagicLink(email);
    setLoading(false);

    if (error) {
      toast.error(`Não foi possível enviar o link: ${error.message}`);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthLayout title="Olhe seu email" subtitle="Um link mágico está a caminho.">
        <div className="space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-sunset-soft flex items-center justify-center">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-base">
              Enviamos um link para <span className="font-semibold">{email}</span>.
            </p>
            <p className="text-sm text-muted-foreground">
              Abra o email e clique no link para entrar. Não chegou em 1 minuto? Confira o spam.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setSent(false); setEmail(""); }}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" /> Usar outro email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Entrar no Dusk" subtitle="Sua próxima viagem está esperando.">
      <form onSubmit={submit} className="space-y-5">
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
          <p className="text-xs text-muted-foreground">
            Enviaremos um link mágico para você entrar sem senha.
          </p>
        </div>
        <Button type="submit" variant="sunset" size="lg" className="w-full" disabled={loading || !email}>
          {loading ? "Enviando..." : "Receber link mágico"}
        </Button>
      </form>
    </AuthLayout>
  );
}
