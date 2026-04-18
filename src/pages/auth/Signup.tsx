import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authService } from "@/services";
import { toast } from "sonner";

export default function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== pw2) { toast.error("As senhas não coincidem"); return; }
    setLoading(true);
    await authService.signUp(name, email, pw);
    setLoading(false);
    toast.success("Conta criada — boa viagem!");
    nav("/trips", { replace: true });
  };

  return (
    <AuthLayout title="Criar sua conta" subtitle="Comece a planejar em poucos minutos.">
      <form onSubmit={submit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="pw">Senha</Label>
            <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="new-password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw2">Confirmar</Label>
            <Input id="pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required autoComplete="new-password" />
          </div>
        </div>
        <Button type="submit" variant="sunset" size="lg" className="w-full" disabled={loading}>
          {loading ? "Criando..." : "Criar conta"}
        </Button>
        <p className="text-sm text-muted-foreground text-center">
          Já tem conta? <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
