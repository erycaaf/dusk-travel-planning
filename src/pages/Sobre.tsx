import { DuskLogo } from "@/components/DuskLogo";

export default function Sobre() {
  return (
    <div className="container max-w-2xl py-12 space-y-10 text-center">
      <div className="flex justify-center"><DuskLogo variant="full" size="lg" /></div>
      <p className="font-display italic text-lg text-muted-foreground">para quem encontra sentido no caminho</p>

      <p className="text-foreground/90 leading-relaxed max-w-xl mx-auto">
        O Dusk nasceu da ideia de que planejar uma viagem também é parte dela. Aqui você reúne voos, rotas, lugares, gastos e memórias — tudo em um só lugar, organizado com carinho, pronto para ser revisitado.
      </p>

      <div className="space-y-5">
        <div className="hairline-sunset mx-auto max-w-xs" />
        <blockquote className="font-display italic text-foreground/85 leading-relaxed max-w-md mx-auto">
          <p>Do lado de fora, a chuva molha as folhas;</p>
          <p>Cristas brancas nas ondas do oceano; espuma do mar na praia;</p>
          <p>O entendimento é a luz da humanidade.</p>
        </blockquote>
        <cite className="block text-xs text-muted-foreground not-italic">
          — tradição galesa, em Juliette Wood,<br /><span className="italic">The Celtic Book of Living and Dying</span>
        </cite>
        <div className="hairline-sunset mx-auto max-w-xs" />
      </div>

      <p className="text-[11px] text-muted-foreground">Dusk · v0.1.0</p>
    </div>
  );
}
