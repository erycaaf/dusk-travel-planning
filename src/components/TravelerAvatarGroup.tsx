import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

interface Props {
  users: Pick<User, "id" | "name" | "avatarUrl">[];
  size?: number;
  max?: number;
  ringClass?: string;
  className?: string;
}

export function TravelerAvatarGroup({ users, size = 32, max = 4, ringClass = "ring-card", className }: Props) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <div className={cn("flex items-center", className)}>
      {shown.map((u, i) => (
        <div
          key={u.id}
          className={cn("rounded-full overflow-hidden ring-2 bg-muted", ringClass)}
          style={{
            width: size,
            height: size,
            marginLeft: i === 0 ? 0 : -size * 0.3,
            zIndex: shown.length - i,
          }}
          title={u.name}
        >
          {u.avatarUrl ? (
            <img src={u.avatarUrl} alt={u.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs font-medium text-foreground">
              {u.name.charAt(0)}
            </div>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className={cn("rounded-full ring-2 bg-muted text-foreground font-medium flex items-center justify-center", ringClass)}
          style={{ width: size, height: size, marginLeft: -size * 0.3, fontSize: size * 0.32 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}
