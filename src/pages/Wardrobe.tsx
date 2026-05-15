import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, MoreVertical, Trash2, Pencil, X, Shirt, GripVertical, Image as ImageIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ALL_CATEGORIES, CATEGORY_ICONS, CATEGORY_LABELS, LOOK_SLOT_ORDER, OPTIONAL_SLOTS,
  type Look, type LookSlot, type WardrobeCategory, type WardrobeItem,
  loadItems, saveItems, loadLooks, saveLooks, emptySlots, addLookToPacking,
} from "@/lib/wardrobe-types";
import { tripsService } from "@/services";
import type { Trip } from "@/lib/types";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

function CategoryChip({ category }: { category: WardrobeCategory }) {
  return (
    <span className="bg-primary/10 text-primary rounded-full px-2.5 py-1 text-xs font-medium">
      {CATEGORY_LABELS[category]}
    </span>
  );
}

function ItemThumb({ item, className }: { item?: WardrobeItem; className?: string }) {
  if (!item) return null;
  if (item.imageUrl) {
    return <img src={item.imageUrl} alt={item.name} className={cn("w-full h-full object-cover", className)} />;
  }
  const Icon = CATEGORY_ICONS[item.category];
  return (
    <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-100 to-amber-100 dark:from-rose-950/30 dark:to-amber-950/30", className)}>
      <Icon className="h-8 w-8 text-primary/60" />
    </div>
  );
}

// ---------- Item form (add/edit) ----------
function ItemForm({
  initial, onSubmit, onCancel,
}: {
  initial?: WardrobeItem;
  onSubmit: (data: Omit<WardrobeItem, "id" | "createdAt">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState<WardrobeCategory>(initial?.category ?? "top");
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4 mt-2">
      <div>
        <Label>Nome</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Camiseta linho cru" />
      </div>
      <div>
        <Label>Categoria</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as WardrobeCategory)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {ALL_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABELS[c]}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Foto</Label>
        <div className="mt-1 rounded-2xl border border-dashed border-border/60 bg-muted/40 p-3 flex items-center gap-3">
          <div className="h-20 w-16 rounded-xl overflow-hidden bg-card border border-border/50 shrink-0">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                <ImageIcon className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-primary cursor-pointer">
              <Camera className="h-4 w-4" />
              {imageUrl ? "Trocar foto" : "Enviar foto"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {!imageUrl && (
              <p className="text-xs text-muted-foreground mt-1">
                Adicione uma foto para visualizar melhor o look em colagens.
              </p>
            )}
          </div>
        </div>
      </div>
      <div>
        <Label>Notas</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes, cor, marca…" rows={3} />
      </div>
      <div className="flex gap-2 pt-2">
        <Button variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button
          variant="sunset"
          className="flex-1"
          disabled={!name.trim()}
          onClick={() => onSubmit({ name: name.trim(), category, imageUrl, notes: notes.trim() || undefined })}
        >
          Salvar
        </Button>
      </div>
    </div>
  );
}

// ---------- Item picker (for look builder zones) ----------
function ItemPickerSheet({
  open, onOpenChange, category, items, onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: WardrobeCategory | null;
  items: WardrobeItem[];
  onPick: (itemId: string) => void;
}) {
  const filtered = category ? items.filter((i) => i.category === category) : [];
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="border-b border-border/50 pb-3">
          <SheetTitle className="font-display">
            Escolher {category ? CATEGORY_LABELS[category] : ""}
          </SheetTitle>
          <SheetDescription>Toque em uma peça para adicionar ao look.</SheetDescription>
        </SheetHeader>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Você ainda não tem peças nesta categoria.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3 py-4">
            {filtered.map((it) => (
              <button
                key={it.id}
                onClick={() => { onPick(it.id); onOpenChange(false); }}
                className="rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 transition-all text-left"
              >
                <div className="aspect-[3/4] w-full"><ItemThumb item={it} /></div>
                <div className="p-2"><p className="text-xs font-medium truncate">{it.name}</p></div>
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ---------- Look builder ----------
function LookBuilder({
  open, onOpenChange, items, trips, initial, onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: WardrobeItem[];
  trips: Trip[];
  initial?: Look | null;
  onSave: (look: Look) => void;
}) {
  const [name, setName] = useState("");
  const [slots, setSlots] = useState<LookSlot[]>(emptySlots());
  const [tripId, setTripId] = useState<string | undefined>();
  const [dayId, setDayId] = useState<string | undefined>();
  const [notes, setNotes] = useState("");
  const [pickerCat, setPickerCat] = useState<WardrobeCategory | null>(null);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setSlots(initial?.slots ?? emptySlots());
      setTripId(initial?.tripId);
      setDayId(initial?.itineraryDayId);
      setNotes(initial?.notes ?? "");
    }
  }, [open, initial]);

  const setSlot = (cat: WardrobeCategory, itemId?: string) => {
    setSlots((arr) => arr.map((s) => s.category === cat ? { ...s, itemId } : s));
  };

  const tripDays = useMemo(() => {
    const t = trips.find((x) => x.id === tripId);
    if (!t) return [];
    const start = parseISO(t.startDate); const end = parseISO(t.endDate);
    const arr: string[] = [];
    let d = start;
    while (d <= end) { arr.push(format(d, "yyyy-MM-dd")); d = addDays(d, 1); }
    return arr;
  }, [trips, tripId]);

  const handleSave = () => {
    if (!name.trim()) { toast.error("Dê um nome ao look"); return; }
    const look: Look = {
      id: initial?.id ?? crypto.randomUUID(),
      name: name.trim(),
      slots,
      tripId,
      itineraryDayId: dayId,
      notes: notes.trim() || undefined,
      createdAt: initial?.createdAt ?? new Date().toISOString(),
    };
    onSave(look);
    onOpenChange(false);
  };

  const handleAddToPacking = () => {
    if (!tripId) { toast.error("Associe a uma viagem primeiro"); return; }
    const trip = trips.find((t) => t.id === tripId);
    const tempLook: Look = {
      id: initial?.id ?? "tmp",
      name: name || "Look",
      slots, tripId, itineraryDayId: dayId, notes,
      createdAt: new Date().toISOString(),
    };
    const n = addLookToPacking(tripId, tempLook, items);
    toast.success(n > 0
      ? `${n} ${n === 1 ? "item adicionado" : "itens adicionados"} à mala de ${trip?.name ?? "viagem"}`
      : `Itens já estavam na mala de ${trip?.name ?? "viagem"}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl">
        <DialogHeader className="border-b border-border/50 pb-3">
          <DialogTitle className="font-display">{initial ? "Editar look" : "Novo look"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div>
            <Label>Nome do look</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Almoço em Mendoza" />
          </div>

          <div>
            <Label className="mb-2 block">Composição</Label>
            <div className="space-y-2">
              {LOOK_SLOT_ORDER.map((cat) => {
                const slot = slots.find((s) => s.category === cat)!;
                const item = items.find((i) => i.id === slot.itemId);
                const Icon = CATEGORY_ICONS[cat];
                const optional = OPTIONAL_SLOTS.includes(cat);
                return (
                  <div key={cat} className="flex items-stretch gap-3">
                    <button
                      type="button"
                      onClick={() => setPickerCat(cat)}
                      className={cn(
                        "relative flex-1 rounded-2xl border-2 border-dashed border-border/50 bg-muted/40 px-4 py-3 flex items-center gap-3 hover:border-primary/40 transition-colors text-left",
                        item && "border-solid border-border/60 bg-card",
                      )}
                    >
                      <div className="h-14 w-14 rounded-xl overflow-hidden bg-background border border-border/50 shrink-0">
                        {item ? <ItemThumb item={item} /> : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Icon className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          {CATEGORY_LABELS[cat]} {optional && <span className="normal-case">(opcional)</span>}
                        </p>
                        <p className="font-medium truncate">{item?.name ?? "Toque para escolher"}</p>
                      </div>
                    </button>
                    {item && (
                      <button
                        type="button"
                        onClick={() => setSlot(cat, undefined)}
                        className="px-3 rounded-2xl bg-muted/60 hover:bg-muted text-muted-foreground"
                        aria-label="Remover"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Associar a viagem</Label>
              <Select value={tripId ?? "none"} onValueChange={(v) => { setTripId(v === "none" ? undefined : v); setDayId(undefined); }}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {trips.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {tripId && (
              <div>
                <Label>Dia do roteiro</Label>
                <Select value={dayId ?? "none"} onValueChange={(v) => setDayId(v === "none" ? undefined : v)}>
                  <SelectTrigger><SelectValue placeholder="Sem dia específico" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem dia específico</SelectItem>
                    {tripDays.map((d) => (
                      <SelectItem key={d} value={d}>
                        {format(parseISO(d), "EEE, dd 'de' MMM", { locale: ptBR })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Sapato confortável, levar cardigan…" />
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button variant="soft" onClick={handleAddToPacking}>Adicionar à mala</Button>
            <Button variant="sunset" className="ml-auto" onClick={handleSave}>Salvar look</Button>
          </div>
        </div>

        <ItemPickerSheet
          open={pickerCat !== null}
          onOpenChange={(v) => !v && setPickerCat(null)}
          category={pickerCat}
          items={items}
          onPick={(itemId) => pickerCat && setSlot(pickerCat, itemId)}
        />
      </DialogContent>
    </Dialog>
  );
}

// ---------- Look mini flat lay (card) ----------
function LookFlatLay({ look, items }: { look: Look; items: WardrobeItem[] }) {
  const filled = look.slots.filter((s) => s.itemId);
  return (
    <div className="grid grid-cols-3 gap-1.5 p-3 bg-gradient-to-br from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20">
      {LOOK_SLOT_ORDER.map((cat) => {
        const slot = look.slots.find((s) => s.category === cat);
        const item = slot?.itemId ? items.find((i) => i.id === slot.itemId) : undefined;
        const Icon = CATEGORY_ICONS[cat];
        return (
          <div key={cat} className="aspect-square rounded-lg bg-card border border-border/40 overflow-hidden">
            {item ? <ItemThumb item={item} /> : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                <Icon className="h-4 w-4" />
              </div>
            )}
          </div>
        );
      })}
      {filled.length === 0 && (
        <div className="col-span-3 text-center text-xs text-muted-foreground -mt-1">Sem peças ainda</div>
      )}
    </div>
  );
}

// ---------- Main page ----------
export default function Wardrobe() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [looks, setLooks] = useState<Look[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [filter, setFilter] = useState<WardrobeCategory | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<WardrobeItem | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingLook, setEditingLook] = useState<Look | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => { setItems(loadItems()); setLooks(loadLooks()); tripsService.list().then(setTrips); }, []);

  // Deep link: /wardrobe?look=ID opens that look in builder
  useEffect(() => {
    const lookId = searchParams.get("look");
    if (!lookId || looks.length === 0) return;
    const target = looks.find((l) => l.id === lookId);
    if (target) {
      setEditingLook(target);
      setBuilderOpen(true);
      searchParams.delete("look");
      setSearchParams(searchParams, { replace: true });
    }
  }, [looks, searchParams, setSearchParams]);

  const persistItems = (next: WardrobeItem[]) => { setItems(next); saveItems(next); };
  const persistLooks = (next: Look[]) => { setLooks(next); saveLooks(next); };

  const visibleItems = filter === "all" ? items : items.filter((i) => i.category === filter);

  // ---- DnD reorder (HTML5) ----
  const onDragStart = (id: string) => setDragId(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const arr = [...items];
    const from = arr.findIndex((i) => i.id === dragId);
    const to = arr.findIndex((i) => i.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    persistItems(arr);
    setDragId(null);
  };

  const handleAddItem = (data: Omit<WardrobeItem, "id" | "createdAt">) => {
    const newItem: WardrobeItem = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
    persistItems([newItem, ...items]);
    setAddOpen(false);
    toast.success("Peça adicionada");
  };

  const handleUpdateItem = (data: Omit<WardrobeItem, "id" | "createdAt">) => {
    if (!editing) return;
    persistItems(items.map((i) => i.id === editing.id ? { ...i, ...data } : i));
    setEditing(null);
    toast.success("Peça atualizada");
  };

  const handleDeleteItem = (id: string) => {
    persistItems(items.filter((i) => i.id !== id));
    toast.success("Peça removida");
  };

  const handleSaveLook = (look: Look) => {
    const exists = looks.some((l) => l.id === look.id);
    persistLooks(exists ? looks.map((l) => l.id === look.id ? look : l) : [look, ...looks]);
    toast.success(exists ? "Look atualizado" : "Look criado");
    setEditingLook(null);
  };

  const handleDeleteLook = (id: string) => {
    persistLooks(looks.filter((l) => l.id !== id));
    toast.success("Look removido");
  };

  return (
    <div className="container max-w-7xl py-6 space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl">Guarda-roupa</h1>
          <p className="text-muted-foreground text-sm">Suas peças e combinações para qualquer viagem.</p>
        </div>
      </header>

      <Tabs defaultValue="items">
        <TabsList className="bg-muted/60 rounded-full">
          <TabsTrigger value="items" className="rounded-full">Peças</TabsTrigger>
          <TabsTrigger value="looks" className="rounded-full">Looks</TabsTrigger>
        </TabsList>

        {/* PEÇAS */}
        <TabsContent value="items" className="space-y-4 mt-4 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
              <button
                onClick={() => setFilter("all")}
                className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                  filter === "all" ? "bg-sunset text-white border-transparent" : "bg-card border-border/60 text-muted-foreground hover:border-primary/40")}
              >Todos</button>
              {ALL_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                    filter === c ? "bg-sunset text-white border-transparent" : "bg-card border-border/60 text-muted-foreground hover:border-primary/40")}
                >{CATEGORY_LABELS[c]}</button>
              ))}
            </div>
            <Button variant="sunset" size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" /> Peça
            </Button>
          </div>

          {visibleItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/50 bg-muted/40 p-10 text-center">
              <Shirt className="h-10 w-10 mx-auto text-primary/60" />
              <p className="font-display font-semibold mt-3">Seu guarda-roupa está vazio</p>
              <p className="text-sm text-muted-foreground mt-1">Adicione suas peças favoritas para montar looks.</p>
              <Button variant="sunset" className="mt-4" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> Adicionar primeira peça
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-in">
              {visibleItems.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => onDragStart(item.id)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(item.id)}
                  className={cn(
                    "group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 hover:shadow-card transition-all",
                    dragId === item.id && "opacity-50",
                  )}
                >
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-card/90 backdrop-blur rounded-md p-1 cursor-grab">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="absolute top-2 right-2 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="bg-card/90 backdrop-blur rounded-md p-1 hover:bg-card">
                          <MoreVertical className="h-3.5 w-3.5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(item)}>
                          <Pencil className="h-4 w-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setEditingLook(null); setBuilderOpen(true); }}>
                          <Plus className="h-4 w-4 mr-2" /> Adicionar a um look
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteItem(item.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="aspect-[3/4]"><ItemThumb item={item} /></div>
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <CategoryChip category={item.category} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* LOOKS */}
        <TabsContent value="looks" className="space-y-4 mt-4 animate-fade-in">
          <div className="flex items-center justify-end">
            <Button variant="sunset" size="sm" onClick={() => { setEditingLook(null); setBuilderOpen(true); }}>
              <Plus className="h-4 w-4" /> Look
            </Button>
          </div>

          {looks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/50 bg-muted/40 p-10 text-center">
              <p className="font-display font-semibold">Nenhum look ainda</p>
              <p className="text-sm text-muted-foreground mt-1">Combine suas peças em looks para cada momento da viagem.</p>
              <Button variant="sunset" className="mt-4" onClick={() => { setEditingLook(null); setBuilderOpen(true); }}>
                <Plus className="h-4 w-4" /> Criar primeiro look
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
              {looks.map((look) => {
                const trip = trips.find((t) => t.id === look.tripId);
                return (
                  <div key={look.id} className="rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/40 hover:shadow-card transition-all">
                    <button onClick={() => { setEditingLook(look); setBuilderOpen(true); }} className="block w-full text-left">
                      <LookFlatLay look={look} items={items} />
                    </button>
                    <div className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-display font-semibold truncate">{look.name}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setEditingLook(look); setBuilderOpen(true); }}>
                              <Pencil className="h-4 w-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteLook(look.id)} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {trip && (
                        <span className="inline-block bg-primary/10 text-primary rounded-full px-2.5 py-1 text-[11px] font-medium">
                          {trip.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add item sheet */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] overflow-y-auto">
          <SheetHeader className="border-b border-border/50 pb-3">
            <SheetTitle className="font-display">Nova peça</SheetTitle>
          </SheetHeader>
          <ItemForm onSubmit={handleAddItem} onCancel={() => setAddOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Edit item sheet */}
      <Sheet open={editing !== null} onOpenChange={(v) => !v && setEditing(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] overflow-y-auto">
          <SheetHeader className="border-b border-border/50 pb-3">
            <SheetTitle className="font-display">Editar peça</SheetTitle>
          </SheetHeader>
          {editing && <ItemForm initial={editing} onSubmit={handleUpdateItem} onCancel={() => setEditing(null)} />}
        </SheetContent>
      </Sheet>

      {/* Look builder */}
      <LookBuilder
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        items={items}
        trips={trips}
        initial={editingLook}
        onSave={handleSaveLook}
      />
    </div>
  );
}
