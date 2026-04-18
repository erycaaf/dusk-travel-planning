import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";
import { toast } from "sonner";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("eryca@dusk.app");
  const [pw, setPw] = useState("dusk");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await authService.signIn(email, pw);
    setLoading(false);
    toast.success("Bem-vinda de volta ✨");
    nav("/trips", { replace: true });
  };

  return (
    <AuthLayout title="Entrar no Dusk" subtitle="Sua próxima viagem está esperando.">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="pw">Senha</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">Esqueci minha senha</Link>
          </div>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" />
        </div>
        <Button type="submit" variant="sunset" size="lg" className="w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Ainda não tem conta? <Link to="/signup" className="text-primary font-medium hover:underline">Criar conta</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
