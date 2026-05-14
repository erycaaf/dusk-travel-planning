import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { packingService, tripsService } from "@/services";
import type { PackingItem, PackingSection, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, Plane, Plus, Trash2, X } from "lucide-react";
import { cn, errorMessage } from "@/lib/utils";
import { toast } from "sonner";

const SECTIONS: { id: PackingSection; label: string }[] = [
  { id: "documentos", label: "Documentos" },
  { id: "mao", label: "Bagagem de mão" },
  { id: "despachada", label: "Despachada" },
  { id: "pessoais", label: "Itens pessoais" },
  { id: "medicamentos", label: "Medicamentos" },
  { id: "eletronicos", label: "Eletrônicos" },
  { id: "roupas", label: "Roupas" },
  { id: "higiene", label: "Higiene" },
  { id: "comprar", label: "Comprar ao chegar" },
];

export default function Packing() {
  const { id } = useParams();
  const [items, setItems] = useState<PackingItem[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<"all" | "pending">("all");
  const [addingTo, setAddingTo] = useState<PackingSection | null>(null);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState("1");
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!id) return;
    packingService.byTrip(id).then((arr) => {
      setItems(arr);
      setOpen(Object.fromEntries(SECTIONS.map((s) => [s.id, true])));
    });
    tripsService.get(id).then((t) => {
      if (!t) return;
      setMembers(t.members.map((m) => m.profile).filter(Boolean) as User[]);
    });
  };

  useEffect(() => { load(); }, [id]);

  const visible = filter === "pending" ? items.filter((i) => !i.packed) : items;
  const packed = items.filter((i) => i.packed).length;
  const pct = items.length ? Math.round((packed / items.length) * 100) : 0;

  const userById = (uid?: string) => members.find((m) => m.id === uid);

  const toggle = async (item: PackingItem) => {
    setItems((arr) => arr.map((i) => i.id === item.id ? { ...i, packed: !i.packed } : i));
    try {
      await packingService.toggle(item.id);
    } catch {
      setItems((arr) => arr.map((i) => i.id === item.id ? { ...i, packed: item.packed } : i));
    }
  };

  const addItem = async (section: PackingSection) => {
    if (!id || !newName.trim()) return;
    setSaving(true);
    try {
      const item = await packingService.add({
        tripId: id,
        name: newName.trim(),
        section,
        packed: false,
        qty: parseInt(newQty) || 1,
      });
      setItems((arr) => [...arr, item]);
      setNewName("");
      setNewQty("1");
      setAddingTo(null);
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao adicionar item"));
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setItems((arr) => arr.filter((i) => i.id !== itemId));
    try {
      await packingService.remove(itemId);
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao remover item"));
      load();
    }
  };

  return (
    <div className="container max-w-4xl py-6 space-y-5">
      <header>
        <h1 className="font-display font-semibold text-2xl sm:text-3xl">Mala</h1>
        <p className="text-muted-foreground text-sm">Embale com tranquilidade. Sem esquecimentos.</p>
      </header>

      <div className="rounded-2xl bg-card border border-border/50 shadow-card p-5 space-y-3">
        <div className="flex items-center gap-3 text-sm">
          <Plane className="h-4 w-4 text-secondary" />
          <span className="font-medium">Progresso da mala</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{pct}% embalado</span>
            <span className="text-muted-foreground">{packed} de {items.length}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-sunset transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")} className={cn("rounded-full px-4 py-1.5 text-sm border", filter === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>Todos</button>
        <button onClick={() => setFilter("pending")} className={cn("rounded-full px-4 py-1.5 text-sm border", filter === "pending" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border")}>Só não embalados</button>
      </div>

      <div className="space-y-3">
        {SECTIONS.map((s) => {
          const list = visible.filter((i) => i.section === s.id);
          const all = items.filter((i) => i.section === s.id);
          if (list.length === 0 && filter === "pending" && addingTo !== s.id) return null;
          const packedHere = all.filter((i) => i.packed).length;
          const isOpen = open[s.id] ?? true;
          const isAdding = addingTo === s.id;

          return (
            <section key={s.id} className="rounded-2xl bg-card border border-border/50 overflow-hidden">
              <button
                onClick={() => setOpen((o) => ({ ...o, [s.id]: !isOpen }))}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-display font-semibold">{s.label}</h3>
                  <span className="text-xs text-muted-foreground">{packedHere}/{all.length}</span>
                </div>
                <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
              </button>

              {isOpen && (
                <ul className="divide-y divide-border/50">
                  {list.map((i) => {
                    const u = userById(i.assignedTo);
                    return (
                      <li key={i.id} className="px-5 py-3 flex items-center gap-3 group">
                        <button
                          onClick={() => toggle(i)}
                          aria-pressed={i.packed}
                          className={cn(
                            "h-6 w-6 rounded-full border flex items-center justify-center transition-all flex-shrink-0",
                            i.packed ? "bg-primary border-primary text-primary-foreground" : "border-border bg-card hover:border-primary/40",
                          )}
                        >
                          {i.packed && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={cn("font-medium", i.packed && "line-through text-muted-foreground")}>{i.name}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">×{i.qty}</span>
                        {u?.avatarUrl && <img src={u.avatarUrl} alt={u.name} title={u.name} className="w-6 h-6 rounded-full" />}
                        <button
                          onClick={() => removeItem(i.id)}
                          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                          aria-label="Remover item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    );
                  })}

                  {isAdding ? (
                    <li className="px-5 py-3 flex items-center gap-2">
                      <Input
                        autoFocus
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") addItem(s.id); if (e.key === "Escape") setAddingTo(null); }}
                        placeholder="Nome do item"
                        className="flex-1 h-8 text-sm"
                      />
                      <Input
                        type="number"
                        min={1}
                        value={newQty}
                        onChange={(e) => setNewQty(e.target.value)}
                        className="w-16 h-8 text-sm"
                        placeholder="Qtd"
                      />
                      <Button size="sm" variant="sunset" onClick={() => addItem(s.id)} disabled={!newName.trim() || saving}>
                        {saving ? "..." : "OK"}
                      </Button>
                      <button onClick={() => setAddingTo(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ) : (
                    <li className="px-5 py-3">
                      <Button variant="ghost" size="sm" onClick={() => { setAddingTo(s.id); setNewName(""); setNewQty("1"); }}>
                        <Plus className="h-3.5 w-3.5" /> Novo item
                      </Button>
                    </li>
                  )}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
