import { Habit, Achievement, AchievementType } from "./habit-types";

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export function daysInMonth(year: number, month0: number) {
  return new Date(year, month0 + 1, 0).getDate();
}
export function daysInMonthKey(mk: string) {
  const [y, m] = mk.split("-").map(Number);
  return daysInMonth(y, m - 1);
}
export function parseMonthKey(mk: string) {
  const [y, m] = mk.split("-").map(Number);
  return { year: y, month0: m - 1 };
}
export function dateKey(year: number, month0: number, day: number) {
  return `${year}-${String(month0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getAllCompletionDates(habit: Habit): string[] {
  const out: string[] = [];
  for (const [mk, days] of Object.entries(habit.completions)) {
    const [y, m] = mk.split("-").map(Number);
    for (const d of days) {
      out.push(`${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
  }
  out.sort();
  return out;
}

export function totalCompletions(habit: Habit): number {
  let n = 0;
  for (const days of Object.values(habit.completions)) n += days.length;
  return n;
}

function todayDate(): Date {
  // App "current date": real today, but spec defaults UI to May 2026. We'll use real today.
  return new Date();
}

export function calculateStreak(habit: Habit, ref: Date = todayDate()) {
  const set = new Set(getAllCompletionDates(habit));
  let current = 0;
  const cursor = new Date(ref);
  // If today not done, allow starting from yesterday so streak isn't reset before evening
  const todayStr = dateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
  if (!set.has(todayStr)) cursor.setDate(cursor.getDate() - 1);
  while (true) {
    const k = dateKey(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
    if (set.has(k)) {
      current++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  const all = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const s of all) {
    const d = new Date(s + "T00:00:00");
    if (prev && (d.getTime() - prev.getTime()) / 86400000 === 1) {
      run++;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }
  return { current, longest };
}

export function monthlyStats(habits: Habit[], mk: string) {
  const dim = daysInMonthKey(mk);
  const totalPossible = habits.length * dim;
  let done = 0;
  habits.forEach((h) => {
    done += (h.completions[mk] || []).length;
  });
  return {
    completionRate: totalPossible ? Math.round((done / totalPossible) * 100) : 0,
    activeStreaks: habits.filter((h) => calculateStreak(h).current > 0).length,
    done,
    totalPossible,
  };
}

function has(existing: Achievement[], type: AchievementType, habitId?: string) {
  return existing.some((a) => a.type === type && a.habitId === habitId);
}

export function checkAchievements(
  habits: Habit[],
  existing: Achievement[],
): Achievement[] {
  const out: Achievement[] = [];
  const now = new Date().toISOString();
  const mkNew = (type: AchievementType, habitId?: string): Achievement => ({
    id: Math.random().toString(36).slice(2),
    type,
    unlockedAt: now,
    habitId,
  });

  habits.forEach((h) => {
    const { current } = calculateStreak(h);
    const total = totalCompletions(h);
    if (current >= 7 && !has(existing, "seedling", h.id)) out.push(mkNew("seedling", h.id));
    if (current >= 30 && !has(existing, "on-fire", h.id)) out.push(mkNew("on-fire", h.id));
    if (total >= 100 && !has(existing, "diamond", h.id)) out.push(mkNew("diamond", h.id));
    for (const [mk, days] of Object.entries(h.completions)) {
      const dim = daysInMonthKey(mk);
      if (days.length === dim && dim > 0 && !has(existing, "perfectionist", h.id)) {
        out.push(mkNew("perfectionist", h.id));
        break;
      }
    }
  });
  if (habits.length > 0 && habits.every((h) => calculateStreak(h).current >= 7) && !has(existing, "momentum")) {
    out.push(mkNew("momentum"));
  }
  const active = habits.filter((h) => calculateStreak(h).current > 0).length;
  if (active >= 5 && !has(existing, "champion")) out.push(mkNew("champion"));
  return out;
}
