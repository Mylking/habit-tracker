import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useHabits } from "@/hooks/use-habits";
import { daysInMonthKey, monthKey, monthlyStats, parseMonthKey } from "@/lib/habit-calc";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({ component: HistoryPage });

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function buildMonthOptions(): string[] {
  const out: string[] = [];
  const start = new Date(2025, 0, 1);
  const end = new Date(2027, 11, 1);
  const cur = new Date(start);
  while (cur <= end) {
    out.push(monthKey(cur));
    cur.setMonth(cur.getMonth() + 1);
  }
  return out.reverse();
}

function ReadOnlyGrid({ mk }: { mk: string }) {
  const { data } = useHabits();
  const { year, month0 } = parseMonthKey(mk);
  const dim = daysInMonthKey(mk);
  const stats = monthlyStats(data.habits, mk);
  return (
    <div className="glass rounded-xl p-3 overflow-x-auto">
      <div className="flex items-center justify-between px-2 pb-2">
        <div className="text-sm font-semibold">{MONTHS[month0]} {year}</div>
        <div className="text-xs text-[var(--text-secondary)]">{stats.completionRate}% complete</div>
      </div>
      <div className="min-w-[900px]">
        <div className="grid items-center text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] pb-1" style={{ gridTemplateColumns: `180px repeat(${dim}, 24px) 60px` }}>
          <div className="pl-2">Habit</div>
          {Array.from({ length: dim }).map((_, i) => <div key={i} className="text-center">{i + 1}</div>)}
          <div className="text-center">%</div>
        </div>
        {data.habits.map((h) => {
          const c = h.completions[mk] || [];
          const pct = Math.round((c.length / dim) * 100);
          return (
            <div key={h.id} className="grid items-center py-1 border-b border-[var(--border-subtle)]" style={{ gridTemplateColumns: `180px repeat(${dim}, 24px) 60px` }}>
              <div className="text-xs font-medium truncate pl-2 pr-2">{h.name}</div>
              {Array.from({ length: dim }).map((_, i) => {
                const day = i + 1;
                const done = c.includes(day);
                return (
                  <div key={day} className="flex justify-center">
                    <div className={["h-3 w-3 rounded-[3px]", done ? "" : "bg-[var(--bg-surface)]"].join(" ")} style={done ? { background: "var(--checkbox-checked)" } : undefined} />
                  </div>
                );
              })}
              <div className="text-center text-xs tabular-nums">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HistoryPage() {
  const months = useMemo(buildMonthOptions, []);
  const [a, setA] = useState(months[0]);
  const [b, setB] = useState(months[1] || months[0]);
  const [compare, setCompare] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-[var(--text-secondary)]">Browse and compare past months.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={a} onValueChange={setA}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>{months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setCompare((v) => !v)}>{compare ? "Single view" : "Compare months"}</Button>
        {compare && (
          <Select value={b} onValueChange={setB}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>

      <div className={compare ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}>
        <ReadOnlyGrid mk={a} />
        {compare && <ReadOnlyGrid mk={b} />}
      </div>
    </div>
  );
}
