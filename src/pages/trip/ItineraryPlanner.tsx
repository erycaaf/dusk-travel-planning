import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  DndContext, useDraggable, useDroppable, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { itineraryService, tripsService } from "@/services";
import type { ActivityIdea, ScheduledActivity, Trip } from "@/lib/types";
import { CategoryBadge, getActivityMeta } from "@/components/CategoryBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Clock, Wallet, X, Calendar as CalIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtBRL, minutesToLabel, minutesToHHmm } from "@/lib/format";
import { addDays, format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { EditIdeaModal } from "@/components/EditIdeaModal";

const HOUR_START = 6;   // 06:00
const HOUR_END = 23;    // 23:00
const HOUR_HEIGHT = 56; // px per hour
const SLOT_MINUTES = 30;
const totalMinutes = (HOUR_END - HOUR_START) * 60;

function minToTop(min: number) {
  return ((min - HOUR_START * 60) / 60) * HOUR_HEIGHT;
}

function snapToSlot(min: number) {
  return Math.max(HOUR_START * 60, Math.min(HOUR_END * 60, Math.round(min / SLOT_MINUTES) * SLOT_MINUTES));
}

// ---------- Idea card (draggable from library) ----------
function IdeaCard({ idea, onEdit }: { idea: ActivityIdea; onEdit: (idea: ActivityIdea) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `idea:${idea.id}`,
    data: { type: "idea", idea },
  });
  const meta = getActivityMeta(idea.category);
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(idea)}
      className={cn(
        "group rounded-xl bg-card border border-border/60 p-3 cursor-grab active:cursor-grabbing select-none transition-all",
        "hover:border-primary/40 hover:shadow-card",
        isDragging && "opacity-30",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="rounded-lg p-2 shrink-0" style={{ backgroundColor: `hsl(${meta.color} / 0.14)`, color: `hsl(${meta.color})` }}>
          <meta.icon className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-medium leading-tight truncate">{idea.title}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{minutesToLabel(idea.durationMin)}</span>
            {idea.estimatedCost ? <span className="inline-flex items-center gap-1"><Wallet className="h-3 w-3" />{fmtBRL(idea.estimatedCost)}</span> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Scheduled block in calendar ----------
function ScheduledBlock({
  item,
  conflict,
  onClick,
}: {
  item: ScheduledActivity;
  conflict: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sched:${item.id}`,
    data: { type: "sched", idea: item },
  });
  const meta = getActivityMeta(item.category);
  const transit = item.transitMin ?? 0;
  const top = minToTop(item.startMin);
  const totalH = ((item.durationMin + transit) / 60) * HOUR_HEIGHT;
  const transitH = (transit / 60) * HOUR_HEIGHT;

  return (
    <div
      ref={setNodeRef}
      style={{ top, height: totalH, backgroundColor: `hsl(${meta.color} / 0.1)` }}
      className={cn(
        "absolute left-2 right-2 rounded-xl border overflow-hidden cursor-grab active:cursor-grabbing",
        conflict ? "border-destructive ring-2 ring-destructive/30" : "border-border/60",
        isDragging && "opacity-30",
      )}
    >
      <button
        {...listeners}
        {...attributes}
        onClick={onClick}
        className="text-left w-full h-full p-2.5"
      >
        <div className="flex items-start gap-2">
          <span className="rounded-md p-1 shrink-0" style={{ backgroundColor: `hsl(${meta.color} / 0.2)`, color: `hsl(${meta.color})` }}>
            <meta.icon className="h-3.5 w-3.5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm leading-tight truncate">{item.title}</p>
            <p className="text-[11px] text-muted-foreground">
              {minutesToHHmm(item.startMin)} – {minutesToHHmm(item.startMin + item.durationMin)}
              {transit ? ` · +${minutesToLabel(transit)} translado` : ""}
            </p>
            {conflict && <p className="text-[11px] text-destructive font-medium mt-0.5">Conflito de horário</p>}
          </div>
        </div>
      </button>
      {transit > 0 && (
        <div
          className="absolute left-0 right-0 bottom-0 pointer-events-none"
          style={{
            height: transitH,
            background: "repeating-linear-gradient(45deg, hsl(var(--muted)) 0 6px, transparent 6px 12px)",
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
}

// ---------- Day column droppable ----------
function DayColumn({
  date, items, onDropAt, onClickItem, conflicts,
}: {
  date: string;
  items: ScheduledActivity[];
  onDropAt: (slotMin: number) => void;
  onClickItem: (item: ScheduledActivity) => void;
  conflicts: Set<string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}`, data: { type: "day", date } });

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Allow click-to-add for the user; not strictly required by spec but pleasant.
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const min = HOUR_START * 60 + (y / HOUR_HEIGHT) * 60;
    onDropAt(snapToSlot(min));
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative bg-card rounded-2xl border border-border/60 overflow-hidden transition-colors",
        isOver && "ring-2 ring-primary/60",
      )}
      style={{ height: (HOUR_END - HOUR_START) * HOUR_HEIGHT }}
      data-day={date}
      onDoubleClick={handleClick}
    >
      {/* Hour grid */}
      <div className="absolute inset-0">
        {Array.from({ length: HOUR_END - HOUR_START + 1 }).map((_, i) => {
          const hour = HOUR_START + i;
          const bg =
            hour < 12 ? "bg-accent/10"
            : hour < 18 ? "bg-primary/5"
            : "bg-secondary/10";
          return (
            <div
              key={hour}
              className={cn("absolute left-0 right-0 border-t border-border/40 flex items-start", bg)}
              style={{ top: i * HOUR_HEIGHT, height: HOUR_HEIGHT }}
            >
              <span className="text-[10px] text-muted-foreground px-2 py-1 font-mono">{hour.toString().padStart(2, "0")}:00</span>
            </div>
          );
        })}
      </div>
      {/* Scheduled blocks */}
      {items.map((it) => (
        <ScheduledBlock key={it.id} item={it} conflict={conflicts.has(it.id)} onClick={() => onClickItem(it)} />
      ))}
      {items.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-sm text-muted-foreground italic px-6 text-center">Nada planejado ainda — arraste uma ideia para começar.</p>
        </div>
      )}
    </div>
  );
}

// ---------- Library droppable (drop here to unschedule) ----------
function IdeasLibrary({
  ideas, search, setSearch, onAddIdea, onEditIdea,
}: {
  ideas: ActivityIdea[];
  search: string;
  setSearch: (v: string) => void;
  onAddIdea: () => void;
  onEditIdea: (idea: ActivityIdea) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "lib", data: { type: "lib" } });
  const filtered = ideas.filter((i) => i.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <div ref={setNodeRef} className={cn("rounded-2xl bg-card border border-border/60 p-4 space-y-3 min-h-[400px] transition-colors", isOver && "ring-2 ring-secondary/60")}>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold">Ideias e passeios</h3>
        <Button size="sm" variant="soft" onClick={onAddIdea}><Plus className="h-3.5 w-3.5" /> Nova</Button>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar ideia" className="pl-9" />
      </div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nada na biblioteca.</p>}
        {filtered.map((i) => <IdeaCard key={i.id} idea={i} onEdit={onEditIdea} />)}
      </div>
    </div>
  );
}

// ---------- Page ----------
export default function ItineraryPlanner() {
  const { id } = useParams();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [ideas, setIdeas] = useState<ActivityIdea[]>([]);
  const [scheduled, setScheduled] = useState<ScheduledActivity[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeDrag, setActiveDrag] = useState<ActivityIdea | null>(null);
  const [editing, setEditing] = useState<ScheduledActivity | null>(null);
  const [editingIdea, setEditingIdea] = useState<ActivityIdea | null>(null);
  const [view, setView] = useState<"library" | "calendar">("calendar"); // mobile only
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  useEffect(() => {
    if (!id) return;
    tripsService.get(id).then((t) => {
      if (t) {
        setTrip(t);
        setSelectedDate(t.startDate);
      }
    });
    itineraryService.ideas(id).then(setIdeas);
    itineraryService.scheduled(id).then(setScheduled);
  }, [id]);

  const days = useMemo(() => {
    if (!trip) return [];
    const start = parseISO(trip.startDate);
    const end = parseISO(trip.endDate);
    const arr: string[] = [];
    let d = start;
    while (d <= end) {
      arr.push(format(d, "yyyy-MM-dd"));
      d = addDays(d, 1);
    }
    return arr;
  }, [trip]);

  const scheduledForDay = (date: string) => scheduled.filter((s) => s.date === date);

  const conflicts = useMemo(() => {
    const c = new Set<string>();
    if (!selectedDate) return c;
    const items = scheduledForDay(selectedDate);
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]; const b = items[j];
        const aEnd = a.startMin + a.durationMin + (a.transitMin ?? 0);
        const bEnd = b.startMin + b.durationMin + (b.transitMin ?? 0);
        if (a.startMin < bEnd && b.startMin < aEnd) {
          c.add(a.id); c.add(b.id);
        }
      }
    }
    return c;
  }, [scheduled, selectedDate]);

  // Library shows ideas not yet scheduled
  const libraryIdeas = ideas.filter((i) => !scheduled.some((s) => s.id === i.id));

  const onDragStart = (e: DragStartEvent) => {
    const data: any = e.active.data.current;
    setActiveDrag(data?.idea ?? null);
  };

  const onDragEnd = async (e: DragEndEvent) => {
    setActiveDrag(null);
    const data: any = e.active.data.current;
    const overData: any = e.over?.data.current;
    if (!data || !overData) return;

    if (overData.type === "lib" && data.type === "sched") {
      // Unschedule
      await itineraryService.unschedule(data.idea.id);
      setScheduled((s) => s.filter((x) => x.id !== data.idea.id));
      return;
    }

    if (overData.type === "day") {
      // Estimate the slot from pointer Y over the column
      const evt = e.activatorEvent as PointerEvent;
      const dropX = (evt?.clientX ?? 0) + (e.delta?.x ?? 0);
      const dropY = (evt?.clientY ?? 0) + (e.delta?.y ?? 0);
      const colEl = document.querySelector(`[data-day="${overData.date}"]`) as HTMLElement | null;
      let slotMin = 9 * 60;
      if (colEl) {
        const rect = colEl.getBoundingClientRect();
        const y = dropY - rect.top;
        slotMin = snapToSlot(HOUR_START * 60 + (y / HOUR_HEIGHT) * 60);
      }

      if (data.type === "idea") {
        const sched = await itineraryService.scheduleIdea(data.idea, overData.date, slotMin);
        if (sched) setScheduled((s) => [...s.filter((x) => x.id !== sched.id), sched]);
      } else if (data.type === "sched") {
        const sched = await itineraryService.moveScheduled(data.idea, overData.date, slotMin);
        if (sched) setScheduled((s) => s.map((x) => (x.id === sched.id ? sched : x)));
      }
    }
  };

  if (!trip || !selectedDate) {
    return <div className="container py-8"><div className="h-96 shimmer rounded-2xl" /></div>;
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="container max-w-7xl py-6 space-y-5">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="font-display font-semibold text-2xl sm:text-3xl">Roteiro</h1>
            <p className="text-muted-foreground text-sm">Arraste ideias da biblioteca para a agenda do dia.</p>
          </div>
          <div className="lg:hidden inline-flex rounded-full bg-muted p-1">
            <button onClick={() => setView("library")} className={cn("px-4 py-1.5 text-sm rounded-full font-medium", view === "library" ? "bg-card shadow-soft" : "text-muted-foreground")}>Ideias</button>
            <button onClick={() => setView("calendar")} className={cn("px-4 py-1.5 text-sm rounded-full font-medium", view === "calendar" ? "bg-card shadow-soft" : "text-muted-foreground")}>Agenda</button>
          </div>
        </header>

        <div className="grid lg:grid-cols-[35fr_65fr] gap-5">
          {/* LEFT: Library */}
          <div className={cn(view === "library" ? "block" : "hidden", "lg:block")}>
            <IdeasLibrary
              ideas={libraryIdeas}
              search={search}
              setSearch={setSearch}
              onAddIdea={async () => {
                const t = await itineraryService.addIdea({ tripId: trip.id, title: "Nova ideia", category: "outro", durationMin: 60 });
                setIdeas((arr) => [...arr, t]);
              }}
              onEditIdea={(idea) => setEditingIdea(idea)}
            />
          </div>

          {/* RIGHT: Calendar */}
          <div className={cn(view === "calendar" ? "block" : "hidden", "lg:block space-y-4")}>
            {/* Day selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {days.map((d) => {
                const date = parseISO(d);
                const isSel = d === selectedDate;
                const count = scheduledForDay(d).length;
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedDate(d)}
                    className={cn(
                      "shrink-0 rounded-xl px-4 py-3 text-center min-w-[68px] border transition-all",
                      isSel ? "bg-sunset text-white border-transparent shadow-glow" : "bg-card border-border hover:border-primary/40",
                    )}
                  >
                    <p className={cn("text-[10px] uppercase tracking-wide", isSel ? "text-white/80" : "text-muted-foreground")}>
                      {format(date, "EEE", { locale: ptBR })}
                    </p>
                    <p className="font-display font-semibold text-lg">{format(date, "dd")}</p>
                    {count > 0 && <p className={cn("text-[10px]", isSel ? "text-white/90" : "text-primary")}>{count}</p>}
                  </button>
                );
              })}
            </div>

            {/* Day header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalIcon className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-display font-semibold capitalize">
                  {format(parseISO(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                </h2>
              </div>
              <span className="text-xs text-muted-foreground">{scheduledForDay(selectedDate).length} atividades</span>
            </div>

            <DayColumn
              date={selectedDate}
              items={scheduledForDay(selectedDate)}
              onDropAt={() => {/* double-click stub */}}
              onClickItem={setEditing}
              conflicts={conflicts}
            />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDrag && (
          <div className="rounded-xl bg-card border border-primary/40 p-3 shadow-lift w-72 rotate-2">
            <p className="font-medium leading-tight">{activeDrag.title}</p>
            <p className="text-xs text-muted-foreground">{minutesToLabel(activeDrag.durationMin)}</p>
          </div>
        )}
      </DragOverlay>

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in" onClick={() => setEditing(null)}>
          <div className="bg-card w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-lift p-6 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <CategoryBadge category={editing.category} kind="activity" iconOnly />
                <div>
                  <h3 className="font-display font-semibold text-lg leading-tight">{editing.title}</h3>
                  {editing.location && <p className="text-sm text-muted-foreground">{editing.location}</p>}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground text-xs">Início</p><p className="font-medium">{minutesToHHmm(editing.startMin)}</p></div>
              <div><p className="text-muted-foreground text-xs">Duração</p><p className="font-medium">{minutesToLabel(editing.durationMin)}</p></div>
              <div><p className="text-muted-foreground text-xs">Translado</p><p className="font-medium">{editing.transitMin ? minutesToLabel(editing.transitMin) : "—"}</p></div>
              <div><p className="text-muted-foreground text-xs">Custo estimado</p><p className="font-medium">{editing.estimatedCost ? fmtBRL(editing.estimatedCost) : "—"}</p></div>
            </div>
            {editing.notes && <p className="text-sm">{editing.notes}</p>}
            <div className="flex justify-between pt-2">
              <Button
                variant="ghost"
                onClick={async () => {
                  await itineraryService.unschedule(editing.id);
                  setScheduled((arr) => arr.filter((x) => x.id !== editing.id));
                  setEditing(null);
                }}
              >Voltar para ideias</Button>
              <Button variant="sunset" onClick={() => setEditing(null)}>Fechar</Button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}
