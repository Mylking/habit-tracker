import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useHabits } from "@/hooks/use-habits";
import {
  calculateStreak,
  daysInMonthKey,
  monthKey,
  monthlyStats,
  totalCompletions,
  getAllCompletionDates,
  dateKey,
} from "@/lib/habit-calc";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import { Flame, Target, TrendingUp, Trophy } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data } = useHabits();
  const mk = monthKey(new Date().getFullYear() === 2026 && new Date().getMonth() === 4 ? new Date(2026, 4, 1) : new Date());
  const stats = monthlyStats(data.habits, mk);
  const totalActive = data.habits.filter((h) => calculateStreak(h).current > 0).length;
  const best = useMemo<{ name: string; pct: number } | null>(() => {
    let result: { name: string; pct: number } | null = null;
    const dim = daysInMonthKey(mk);
    data.habits.forEach((h) => {
      const pct = Math.round(((h.completions[mk] || []).length / dim) * 100);
      if (!result || pct > result.pct) result = { name: h.name, pct };
    });
    return result;
  }, [data.habits, mk]);

  // Heatmap last 90 days
  const heatmap = useMemo(() => {
    const today = new Date();
    const days: { date: string; count: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dateKey(d.getFullYear(), d.getMonth(), d.getDate());
      let count = 0;
      data.habits.forEach((h) => {
        const mk2 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if ((h.completions[mk2] || []).includes(d.getDate())) count++;
      });
      days.push({ date: k, count });
    }
    return days;
  }, [data.habits]);

  // Best day of week
  const dow = useMemo(() => {
    const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const totals = Array(7).fill(0);
    const counts = Array(7).fill(0);
    data.habits.forEach((h) => {
      Object.entries(h.completions).forEach(([k, days]) => {
        const [y, m] = k.split("-").map(Number);
        const dim = daysInMonthKey(k);
        for (let d = 1; d <= dim; d++) {
          const dt = new Date(y, m - 1, d);
          const idx = (dt.getDay() + 6) % 7;
          counts[idx]++;
          if (days.includes(d)) totals[idx]++;
        }
      });
    });
    return labels.map((l, i) => ({ day: l, pct: counts[i] ? Math.round((totals[i] / counts[i]) * 100) : 0 }));
  }, [data.habits]);

  // Habit comparison
  const comparison = useMemo(() => {
    const dim = daysInMonthKey(mk);
    return [...data.habits]
      .map((h) => ({ name: h.name, pct: Math.round(((h.completions[mk] || []).length / dim) * 100) }))
      .sort((a, b) => b.pct - a.pct);
  }, [data.habits, mk]);

  // 30 day trend
  const trend = useMemo(() => {
    const today = new Date();
    const out: { date: string; pct: number }[] = [];
    const total = data.habits.length;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const mk2 = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      let done = 0;
      data.habits.forEach((h) => {
        if ((h.completions[mk2] || []).includes(d.getDate())) done++;
      });
      out.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, pct: total ? Math.round((done / total) * 100) : 0 });
    }
    return out;
  }, [data.habits]);

  const [habitId, setHabitId] = useState<string>(data.habits[0]?.id || "");
  const habit = data.habits.find((h) => h.id === habitId);

  const habitHistory = useMemo(() => {
    if (!habit) return [];
    const today = new Date();
    const out: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const k = monthKey(d);
      out.push({
        month: `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} '${String(d.getFullYear()).slice(2)}`,
        count: (habit.completions[k] || []).length,
      });
    }
    return out;
  }, [habit]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-[var(--text-secondary)]">Insights from your habit data.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Target className="h-4 w-4" />} label="Total habits" value={String(data.habits.length)} />
        <StatCard icon={<TrendingUp className="h-4 w-4" />} label="Completion rate" value={`${stats.completionRate}%`} />
        <StatCard icon={<Flame className="h-4 w-4" />} label="Active streaks" value={String(totalActive)} />
        <StatCard icon={<Trophy className="h-4 w-4" />} label="Best habit" value={best ? `${best.pct}%` : "—"} sub={best?.name} />
      </div>

      <Card title="90-Day Completion Heatmap">
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {heatmap.map((d) => {
            const intensity = Math.min(1, d.count / Math.max(1, data.habits.length));
            const bg = d.count === 0 ? "var(--bg-surface)" : `rgba(var(--primary-rgb), ${0.15 + intensity * 0.85})`;
            return (
              <div
                key={d.date}
                title={`${d.date} — ${d.count} completed`}
                className="h-4 w-4 rounded-[3px]"
                style={{ background: bg }}
              />
            );
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="Best day of week">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dow}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="day" stroke="var(--text-tertiary)" fontSize={12} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8 }} />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]} fill="var(--interactive-primary)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="30-Day completion trend">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" fontSize={11} />
              <YAxis stroke="var(--text-tertiary)" fontSize={12} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="pct" stroke="var(--interactive-primary)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card title="Habit performance — this month">
        <ResponsiveContainer width="100%" height={Math.max(240, comparison.length * 28)}>
          <BarChart data={comparison} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis type="number" stroke="var(--text-tertiary)" fontSize={12} domain={[0, 100]} />
            <YAxis type="category" dataKey="name" stroke="var(--text-tertiary)" fontSize={11} width={120} />
            <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8 }} />
            <Bar dataKey="pct" radius={[0, 6, 6, 0]}>
              {comparison.map((_, i) => (
                <Cell key={i} fill="var(--interactive-primary)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="Per-habit deep dive">
        <div className="space-y-4">
          <Select value={habitId} onValueChange={setHabitId}>
            <SelectTrigger className="w-full sm:w-[320px]"><SelectValue placeholder="Select habit" /></SelectTrigger>
            <SelectContent>
              {data.habits.map((h) => (
                <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {habit && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="Current streak" value={`${calculateStreak(habit).current}d`} />
                <MiniStat label="Longest streak" value={`${calculateStreak(habit).longest}d`} />
                <MiniStat label="Total completions" value={String(totalCompletions(habit))} />
                <MiniStat label="Days tracked" value={String(getAllCompletionDates(habit).length)} />
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={habitHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis dataKey="month" stroke="var(--text-tertiary)" fontSize={12} />
                  <YAxis stroke="var(--text-tertiary)" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", borderRadius: 8 }} />
                  <Bar dataKey="count" fill="var(--interactive-success)" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-xl p-5">
      <div className="text-sm font-semibold mb-4">{title}</div>
      {children}
    </div>
  );
}
function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="glass rounded-xl p-5 relative overflow-hidden">
      <div className="absolute top-4 right-4 text-[var(--text-tertiary)]">{icon}</div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
      {sub && <div className="text-xs text-[var(--text-secondary)] mt-1 truncate">{sub}</div>}
    </div>
  );
}
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
