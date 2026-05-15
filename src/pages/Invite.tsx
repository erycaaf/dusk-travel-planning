import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invitesService } from "@/services";
import { Button } from "@/components/ui/button";
import { MapPin, Plane } from "lucide-react";
import { toast } from "sonner";

type InviteInfo = {
  tripId: string;
  tripName: string;
  tripCoverUrl: string;
  tripCity: string;
  tripCountry: string;
};

export default function Invite() {
  const { code } = useParams<{ code: string }>();
  const nav = useNavigate();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    invitesService.getByCode(code)
      .then((data) => {
        if (!data) setNotFound(true);
        else setInfo(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  const accept = async () => {
    if (!code) return;
    setAccepting(true);
    try {
      const tripId = await invitesService.accept(code);
      toast.success("Bem-vinda à viagem!");
      nav(`/trips/${tripId}`, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao aceitar convite");
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="container max-w-lg py-16 flex flex-col items-center gap-4">
        <div className="h-48 w-full shimmer rounded-2xl" />
        <div className="h-6 w-48 shimmer rounded" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="container max-w-lg py-16 flex flex-col items-center gap-4 text-center">
        <div className="rounded-full bg-muted p-5 mb-2">
          <Plane className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="font-display font-semibold text-2xl">Convite não encontrado</h1>
        <p className="text-muted-foreground">Este link pode ter expirado ou ser inválido. Peça um novo link para o organizador da viagem.</p>
        <Button variant="outline" onClick={() => nav("/trips")}>Ver minhas viagens</Button>
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="container max-w-lg py-10 space-y-6">
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Convite de viagem</p>
        <h1 className="font-display font-bold text-3xl">Você foi convidada!</h1>
      </div>

      <div className="rounded-2xl bg-card border border-border/50 shadow-card overflow-hidden">
        {info.tripCoverUrl && (
          <div className="relative aspect-[16/7] overflow-hidden">
            <img
              src={info.tripCoverUrl}
              alt={info.tripName}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
            <h2 className="absolute bottom-4 left-5 font-display font-bold text-2xl text-white">
              {info.tripName}
            </h2>
          </div>
        )}
        <div className="p-5 space-y-3">
          {!info.tripCoverUrl && (
            <h2 className="font-display font-bold text-2xl">{info.tripName}</h2>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{info.tripCity}, {info.tripCountry}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Ao aceitar, você entra como membro editor desta viagem e passa a ter acesso a voos, hospedagem, roteiro, despesas e lista de malas.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="sunset" className="w-full h-12 text-base" onClick={accept} disabled={accepting}>
          {accepting ? "Entrando..." : "Aceitar e entrar na viagem"}
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => nav("/trips")}>
          Recusar
        </Button>
      </div>
    </div>
  );
}
