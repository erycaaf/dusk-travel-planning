import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { expensesService, tripsService, authService } from "@/services";
import type { Expense, ExpenseCategory, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CategoryBadge, getExpenseMeta } from "@/components/CategoryBadge";
import { fmtBRL, fmtCurrency, fmtDate } from "@/lib/format";
import { Plus, X, ArrowDownLeft, ArrowUpRight, Wallet, Users as UsersIcon, Trash2 } from "lucide-react";
import { TravelerAvatarGroup } from "@/components/TravelerAvatarGroup";
import { StatCard } from "@/components/StatCard";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { toast } from "sonner";

const CATS: ExpenseCategory[] = ["roupas","medicamentos","documentos","passagens","bagagem","estadias","passeios","telefonia","transporte","lembrancinhas","alimentacao"];
type Tab = "all" | "shared" | "mine" | "category";

export default function Expenses() {
  const { id } = useParams();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState("");

  useEffect(() => {
    if (!id) return;
    expensesService.byTrip(id).then(setExpenses);
    tripsService.get(id).then((t) => {
      if (!t) return;
      setMembers(t.members.map((m) => m.profile).filter(Boolean) as User[]);
    });
    authService.getCurrent().then((u) => { if (u) setMe(u.id); });
  }, [id]);

  const userById = (uid: string) => members.find((m) => m.id === uid);

  const filtered = useMemo(() => {
    if (tab === "shared") return expenses.filter((e) => e.splitWith.length > 1);
    if (tab === "mine") return expenses.filter((e) => e.paidBy === me);
    return expenses;
  }, [expenses, tab]);

  const total = expenses.reduce((s, e) => s + e.amountBRL, 0);
  const myShare = expenses.reduce((s, e) => e.splitWith.includes(me) ? s + e.amountBRL / e.splitWith.length : s, 0);
  const iPaid = expenses.filter((e) => e.paidBy === me).reduce((s, e) => s + e.amountBRL, 0);
  const owedToMe = expenses.filter((e) => e.paidBy === me && e.splitWith.length > 1)
    .reduce((s, e) => s + e.amountBRL * (e.splitWith.length - 1) / e.splitWith.length, 0);
  const iOwe = expenses.filter((e) => e.paidBy !== me && e.splitWith.includes(me))
    .reduce((s, e) => s + e.amountBRL / e.splitWith.length, 0);

  const byCategory = CATS.map((c) => ({
    name: getExpenseMeta(c).label,
    value: expenses.filter((e) => e.category === c).reduce((s, e) => s + e.amountBRL, 0),
    color: `hsl(${getExpenseMeta(c).color})`,
  })).filter((d) => d.value > 0);

  const byDate = Array.from(new Set(expenses.map((e) => e.date))).sort()
    .map((d) => ({
      date: fmtDate(d, "dd/MM"),
      total: expenses.filter((e) => e.date === d).reduce((s, e) => s + e.amountBRL, 0),
    }));

  return (
    <div className="container max-w-6xl py-6 space-y-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl">Gastos da viagem</h1>
          <p className="text-muted-foreground text-sm">Divida com facilidade. Tudo convertido para BRL.</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total da viagem" value={fmtBRL(total)} icon={Wallet} tone="primary" />
        <StatCard label="Minha parcela" value={fmtBRL(myShare)} hint={`paguei ${fmtBRL(iPaid)}`} icon={UsersIcon} tone="secondary" />
        <StatCard label="A receber" value={fmtBRL(owedToMe)} icon={ArrowDownLeft} tone="success" />
        <StatCard label="A pagar" value={fmtBRL(iOwe)} icon={ArrowUpRight} tone="warning" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-full bg-muted p-1">
          {([
            ["all", "Todas"], ["shared", "Compartilhadas"], ["mine", "Minhas"], ["category", "Por categoria"],
          ] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={cn("px-4 py-1.5 rounded-full text-sm font-medium", tab === k ? "bg-card shadow-soft" : "text-muted-foreground")}>{label}</button>
          ))}
        </div>
      </div>

      {tab === "category" ? (
        <div className="grid lg:grid-cols-2 gap-5">
          <section className="rounded-2xl bg-card p-5 shadow-card border border-border/50">
            <h3 className="font-display font-semibold mb-3">Gastos por categoria</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    {byCategory.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtBRL(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-xs">
              {byCategory.map((d) => (
                <li key={d.name} className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />{d.name} · {fmtBRL(d.value)}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl bg-card p-5 shadow-card border border-border/50">
            <h3 className="font-display font-semibold mb-3">Gastos por dia</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={byDate}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => fmtBRL(v)} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      ) : (
        <ul className="rounded-2xl bg-card border border-border/50 divide-y divide-border/60 overflow-hidden">
          {filtered.map((e) => {
            const payer = userById(e.paidBy);
            return (
              <li key={e.id} className="p-4 flex items-center gap-4 hover:bg-muted/40 transition-colors">
                <CategoryBadge category={e.category} kind="expense" iconOnly />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{e.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span>{fmtDate(e.date)}</span>
                    <span>·</span>
                    <CategoryBadge category={e.category} kind="expense" size="sm" />
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-display font-semibold">{fmtCurrency(e.amount, e.currency)}</p>
                  {e.currency !== "BRL" && <p className="text-xs text-muted-foreground">{fmtBRL(e.amountBRL)}</p>}
                </div>
                <div className="hidden sm:flex flex-col items-end gap-1 min-w-[100px]">
                  {payer && <img src={payer.avatarUrl ?? ""} alt={payer.name} title={`Pago por ${payer.name}`} className="w-7 h-7 rounded-full object-cover bg-muted" />}
                  <TravelerAvatarGroup users={e.splitWith.map((uid) => userById(uid)).filter(Boolean) as User[]} size={20} />
                </div>
                <button
                  onClick={() => expensesService.remove(e.id).then(() => setExpenses((arr) => arr.filter((x) => x.id !== e.id)))}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  aria-label="Remover gasto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* FAB */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-30 h-14 px-5 rounded-full bg-sunset text-white shadow-lift hover:-translate-y-0.5 transition-all font-medium flex items-center gap-2"
      >
        <Plus className="h-5 w-5" /> Adicionar gasto
      </button>

      {open && (
        <AddExpenseModal
          onClose={() => setOpen(false)}
          onAdd={async (e) => {
            const created = await expensesService.add({ ...e, tripId: id! });
            setExpenses((arr) => [created, ...arr]);
            toast.success("Gasto adicionado");
            setOpen(false);
          }}
          members={members}
        />
      )}
    </div>
  );
}

function AddExpenseModal({ onClose, onAdd, members }: { onClose: () => void; onAdd: (e: Omit<Expense, "id" | "tripId">) => void; members: User[] }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("alimentacao");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<"BRL" | "ARS" | "USD" | "EUR">("BRL");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? "u-eryca");
  const [splitWith, setSplitWith] = useState<string[]>(members.map((m) => m.id));
  const fxToBRL = { BRL: 1, ARS: 0.0061, USD: 5.1, EUR: 5.5 } as const;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl shadow-lift p-6 space-y-4 animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-lg">Novo gasto</h3>
          <Button size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Almoço, ingresso..." /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5"><Label>Valor</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" /></div>
            <div className="space-y-1.5"><Label>Moeda</Label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} className="h-11 w-full rounded-full border border-input bg-card px-3 text-sm">
                <option>BRL</option><option>ARS</option><option>USD</option><option>EUR</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Categoria</Label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className="h-11 w-full rounded-full border border-input bg-card px-3 text-sm">
                {CATS.map((c) => <option key={c} value={c}>{getExpenseMeta(c).label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5"><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Pago por</Label>
            <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className="h-11 w-full rounded-full border border-input bg-card px-3 text-sm">
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Dividido com</Label>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => {
                const on = splitWith.includes(m.id);
                return (
                  <button key={m.id} type="button" onClick={() => setSplitWith((arr) => on ? arr.filter((x) => x !== m.id) : [...arr, m.id])}
                    className={cn("inline-flex items-center gap-2 rounded-full pl-1 pr-3 py-1 border text-sm", on ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground")}>
                    <img src={m.avatarUrl} alt="" className="w-6 h-6 rounded-full" />{m.name.split(" ")[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="sunset" onClick={() => {
            const a = parseFloat(amount.replace(",", ".")) || 0;
            onAdd({ title, category, amount: a, currency, amountBRL: a * fxToBRL[currency], date, paidBy, splitWith });
          }} disabled={!title || !amount}>Salvar</Button>
        </div>
      </div>
    </div>
  );
}
