import { useEffect, useMemo, useRef, useState } from "react";
import { useHabits } from "@/hooks/use-habits";
import { dateKey, daysInMonthKey, monthKey, monthlyStats, parseMonthKey, calculateStreak } from "@/lib/habit-calc";
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Download, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportCSV, exportJSON, exportPDF } from "@/lib/habit-export";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export function HabitGrid() {
  const { data, toggleCompletion, addHabit, updateHabit, deleteHabit } = useHabits();
  // Default to May 2026 per spec
  const [mk, setMk] = useState<string>(() => {
    const today = new Date();
    if (today.getFullYear() === 2026 && today.getMonth() === 4) return "2026-05";
    return monthKey(today);
  });
  const { year, month0 } = parseMonthKey(mk);
  const dim = daysInMonthKey(mk);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month0;
  const todayDay = today.getDate();

  const stats = monthlyStats(data.habits, mk);
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  function shift(delta: number) {
    const d = new Date(year, month0 + delta, 1);
    setMk(monthKey(d));
  }

  // Confetti when all habits done today
  const lastCelebrated = useRef<string>("");
  useEffect(() => {
    if (!isCurrentMonth || data.habits.length === 0) return;
    const allDone = data.habits.every((h) => (h.completions[mk] || []).includes(todayDay));
    const key = `${mk}-${todayDay}`;
    if (allDone && lastCelebrated.current !== key) {
      lastCelebrated.current = key;
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      });
    }
  }, [data.habits, mk, todayDay, isCurrentMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => shift(-1)}
            className="h-9 w-9 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="min-w-[180px] text-center">
            <div className="text-xl font-semibold tracking-tight">{MONTHS[month0]} {year}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{dim} days</div>
          </div>
          <button
            onClick={() => shift(1)}
            className="h-9 w-9 rounded-md bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <StatPill label="Completion" value={`${stats.completionRate}%`} />
          <StatPill label="Active streaks" value={String(stats.activeStreaks)} icon={<Flame className="h-3.5 w-3.5" />} />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCSV(data.habits, mk)}>CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPDF(mk)}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportJSON(data)}>JSON</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setAddOpen(true)} className="gap-2 text-white border-0" style={{ background: "var(--gradient-primary)" }}>
            <Plus className="h-4 w-4" /> Add Habit
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className="habit-grid-container glass rounded-xl py-3 pr-3 overflow-x-auto">
        <div className="min-w-[1600px]">
          {/* Header row */}
          <div
            className="grid items-center text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-subtle)] pb-2 mb-1"
            style={{ gridTemplateColumns: `212px repeat(${dim}, 38px) 70px 70px 90px` }}
          >
            <div className="sticky left-0 z-20 bg-[var(--bg-elevated)] pl-3">Habit</div>

            {Array.from({ length: dim }).map((_, i) => {
              const day = i + 1;
              const isToday = isCurrentMonth && day === todayDay;
              return (
                <div
                  key={day}
                  className={["text-center font-medium", isToday ? "text-[var(--interactive-primary)]" : ""].join(" ")}
                >
                  {day}
                </div>
              );
            })}
            <div className="text-center">Count</div>
            <div className="text-center">%</div>
            <div className="text-center">Streak</div>
          </div>

          {data.habits.map((h) => {
            const completions = h.completions[mk] || [];
            const { current } = calculateStreak(h);
            const pct = Math.round((completions.length / dim) * 100);
            return (
              <div
                key={h.id}
                className="group grid items-center py-1.5 border-b border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]/[0.55]"
                style={{ gridTemplateColumns: `212px repeat(${dim}, 38px) 70px 70px 90px` }}
              >
                <div className="flex items-center gap-1 pl-3 pr-2 min-w-0 sticky left-0 z-10 bg-[var(--bg-elevated)] group-hover:bg-[var(--bg-surface)]">

                  <div className="truncate text-sm font-medium" title={h.name}>{h.name}</div>
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition flex gap-1">
                    <button onClick={() => setEditId(h.id)} className="p-1 rounded hover:bg-[var(--bg-surface-hover)]">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDelId(h.id)} className="p-1 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--interactive-danger)]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                {Array.from({ length: dim }).map((_, i) => {
                  const day = i + 1;
                  const checked = completions.includes(day);
                  const cellDate = new Date(year, month0, day);
                  const isFuture = cellDate.setHours(0,0,0,0) > new Date().setHours(0,0,0,0);
                  const isPast = !isFuture && !(isCurrentMonth && day === todayDay);
                  const isToday = isCurrentMonth && day === todayDay;
                  const cls = [
                    "habit-checkbox",
                    checked && "checked",
                    isFuture && "future",
                    isToday && "today",
                    isPast && !checked && "past-incomplete",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <div key={day} className={["flex justify-center", isToday ? "today-col" : ""].join(" ")}>
                      <button
                        className={cls}
                        disabled={isFuture}
                        aria-label={`${h.name} day ${day} ${checked ? "completed" : "not completed"}`}
                        onClick={() => toggleCompletion(h.id, mk, day)}
                      />
                    </div>
                  );
                })}
                <div className="text-center text-sm tabular-nums">{completions.length}</div>
                <div className="text-center text-sm tabular-nums text-[var(--text-secondary)]">{pct}%</div>
                <div className="text-center text-sm">
                  {current > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold" style={{ background: "var(--gradient-streak)", color: "#fff" }}>
                      🔥 {current}
                    </span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">—</span>
                  )}
                </div>
              </div>
            );
          })}
          {data.habits.length === 0 && (
            <div className="py-16 text-center text-[var(--text-secondary)]">
              <div className="text-4xl mb-2">🌱</div>
              <div className="font-medium">No habits yet</div>
              <div className="text-sm">Start building your routine.</div>
              <Button onClick={() => setAddOpen(true)} className="mt-4 text-white border-0" style={{ background: "var(--gradient-primary)" }}>
                <Plus className="h-4 w-4 mr-1" /> Add your first habit
              </Button>
            </div>
          )}
        </div>
      </div>

      <HabitFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add habit"
        onSubmit={(name, tt) => {
          addHabit(name, tt);
          setAddOpen(false);
        }}
      />
      <HabitFormDialog
        open={!!editId}
        onOpenChange={(v) => !v && setEditId(null)}
        title="Edit habit"
        initial={editId ? data.habits.find((h) => h.id === editId) : undefined}
        onSubmit={(name, tt) => {
          if (editId) updateHabit(editId, { name, timeTrackingEnabled: tt });
          setEditId(null);
        }}
      />
      <DeleteDialog
        open={!!delId}
        onOpenChange={(v) => !v && setDelId(null)}
        habit={delId ? data.habits.find((h) => h.id === delId) || null : null}
        onConfirm={() => {
          if (delId) deleteHabit(delId);
          setDelId(null);
        }}
      />
    </div>
  );
}

function StatPill({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="glass rounded-lg px-3 py-2 flex items-center gap-3">
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
      <div className="text-base font-semibold inline-flex items-center gap-1">{icon}{value}</div>
    </div>
  );
}

function HabitFormDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial?: { name: string; timeTrackingEnabled: boolean } | undefined;
  onSubmit: (name: string, timeTracking: boolean) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [tt, setTt] = useState(initial?.timeTrackingEnabled || false);
  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setTt(initial?.timeTrackingEnabled || false);
    }
  }, [open, initial]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Habit name</Label>
            <Input value={name} maxLength={50} onChange={(e) => setName(e.target.value)} placeholder="e.g. Meditate 10 minutes" autoFocus />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2">
            <div>
              <div className="text-sm font-medium">Time tracking</div>
              <div className="text-xs text-[var(--text-tertiary)]">Record time-of-day for completions</div>
            </div>
            <Switch checked={tt} onCheckedChange={setTt} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!name.trim()}
            onClick={() => onSubmit(name.trim(), tt)}
            className="text-white border-0"
            style={{ background: "var(--gradient-primary)" }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteDialog({
  open, onOpenChange, habit, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  habit: { id: string; name: string; completions: Record<string, number[]> } | null;
  onConfirm: () => void;
}) {
  const total = useMemo(() => {
    if (!habit) return 0;
    return Object.values(habit.completions).reduce((s, a) => s + a.length, 0);
  }, [habit]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Delete habit?</DialogTitle></DialogHeader>
        {habit && (
          <div className="text-sm text-[var(--text-secondary)] space-y-2">
            <p>You are about to permanently delete <span className="text-[var(--text-primary)] font-medium">{habit.name}</span> and all its data.</p>
            <p>Total completions: <span className="text-[var(--text-primary)] font-semibold">{total}</span></p>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onConfirm} className="text-white border-0" style={{ background: "var(--gradient-danger)" }}>
            Delete forever
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
