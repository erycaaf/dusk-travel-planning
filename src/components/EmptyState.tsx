import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import emptyImg from "@/assets/empty-trips.jpg";

interface Props {
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
  imageSrc?: string;
  className?: string;
}

export function EmptyState({ title, description, ctaLabel, onCta, imageSrc = emptyImg, className }: Props) {
  return (
    <div className={cn("flex flex-col items-center text-center py-12 px-6 rounded-2xl bg-card border border-border/50", className)}>
      <img src={imageSrc} alt="" className="w-44 h-44 object-contain opacity-90 mb-4" loading="lazy" />
      <h3 className="font-display font-semibold text-xl mb-2">{title}</h3>
      {description && <p className="text-muted-foreground max-w-md mb-6">{description}</p>}
      {ctaLabel && onCta && (
        <Button variant="sunset" onClick={onCta}>{ctaLabel}</Button>
      )}
    </div>
  );
}
