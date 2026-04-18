import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    toast.success("Se este email existir, enviamos um link de recuperação.");
  };

  return (
    <AuthLayout title="Recuperar senha" subtitle="Te enviamos um link para redefinir.">
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="text-muted-foreground">Verifique seu email — o link expira em 1 hora.</p>
          <Button asChild variant="outline"><Link to="/login">Voltar para entrar</Link></Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <Button type="submit" variant="sunset" size="lg" className="w-full">Enviar link de recuperação</Button>
          <p className="text-sm text-muted-foreground text-center">
            Lembrou? <Link to="/login" className="text-primary font-medium hover:underline">Voltar</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
