import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useHabits } from "@/hooks/use-habits";
import { ACHIEVEMENT_META, QUOTES } from "@/lib/habit-types";
import { calculateStreak, dateKey } from "@/lib/habit-calc";

export const Route = createFileRoute("/progress")({ component: ProgressPage });

function ProgressPage() {
  const { data } = useHabits();
  const today = new Date();
  const todayKey = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
  const mk = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const leaderboard = useMemo(() => {
    return [...data.habits]
      .map((h) => {
        const s = calculateStreak(h);
        const doneToday = (h.completions[mk] || []).includes(today.getDate());
        return { habit: h, ...s, doneToday };
      })
      .sort((a, b) => b.current - a.current || b.longest - a.longest);
  }, [data.habits, mk]);

  const unlockedTypes = useMemo(() => {
    const set = new Set<string>();
    data.achievements.forEach((a) => set.add(a.type));
    return set;
  }, [data.achievements]);

  const [quoteIdx, setQuoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  useEffect(() => {
    const i = setInterval(() => setQuoteIdx((p) => (p + 1) % QUOTES.length), 60000);
    return () => clearInterval(i);
  }, []);
  const quote = QUOTES[quoteIdx];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Progress & Achievements</h1>
        <p className="text-sm text-[var(--text-secondary)]">Streaks, badges, and motivation.</p>
      </div>

      <div className="glass rounded-xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "var(--gradient-primary)" }} />
        <div className="relative">
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] mb-2">Today's mantra</div>
          <blockquote className="text-xl md:text-2xl font-medium leading-snug">"{quote.t}"</blockquote>
          {quote.a && <div className="mt-2 text-sm text-[var(--text-secondary)]">— {quote.a}</div>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">Streak Leaderboard</div>
          <ol className="space-y-2">
            {leaderboard.map((r, i) => (
              <li key={r.habit.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-surface)]">
                <div className="w-6 text-center font-bold text-[var(--text-tertiary)]">{i + 1}</div>
                <div className="text-lg" style={{ fontSize: `${Math.min(28, 14 + r.current)}px` }}>🔥</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.habit.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)]">Longest: {r.longest}d</div>
                </div>
                <div className="text-base font-semibold tabular-nums">{r.current}d</div>
                {r.current > 0 && !r.doneToday && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: "var(--gradient-danger)" }}>
                    At risk
                  </span>
                )}
              </li>
            ))}
            {leaderboard.length === 0 && <div className="text-sm text-[var(--text-secondary)]">No habits yet.</div>}
          </ol>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="text-sm font-semibold mb-4">Achievements</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(Object.keys(ACHIEVEMENT_META) as Array<keyof typeof ACHIEVEMENT_META>).map((t) => {
              const meta = ACHIEVEMENT_META[t];
              const unlocked = unlockedTypes.has(t);
              return (
                <div
                  key={t}
                  className={[
                    "rounded-xl p-4 text-center border",
                    unlocked
                      ? "border-[var(--interactive-primary)] shadow-[var(--shadow-glow-primary)] bg-[var(--bg-surface)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] opacity-50 grayscale",
                  ].join(" ")}
                >
                  <div className="text-4xl mb-2">{meta.emoji}</div>
                  <div className="text-sm font-semibold">{meta.name}</div>
                  <div className="text-[11px] text-[var(--text-tertiary)] mt-1">{meta.desc}</div>
                  <div className="text-[10px] mt-2 uppercase tracking-wider text-[var(--text-tertiary)]">
                    {unlocked ? "Unlocked" : "Locked"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
