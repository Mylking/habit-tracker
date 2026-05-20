import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppData, Habit, ThemeName } from "@/lib/habit-types";
import { applyTheme, newHabit } from "@/lib/habit-storage";
import { checkAchievements, monthKey } from "@/lib/habit-calc";
import { ACHIEVEMENT_META } from "@/lib/habit-types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const INITIAL_DATA: AppData = {
  habits: [],
  achievements: [],
  settings: { theme: "obsidian", globalTimeTracking: false, lastVisited: "" },
  version: "1.1.0",
};

interface Ctx {
  data: AppData;
  loading: boolean;
  setTheme: (t: ThemeName) => void;
  toggleCompletion: (habitId: string, mk: string, day: number) => void;
  addHabit: (name: string, timeTracking?: boolean) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  importAll: (data: AppData) => void;
  clearAll: () => void;
  setGlobalTimeTracking: (v: boolean) => void;
}

const HabitsCtx = createContext<Ctx | null>(null);

export function HabitsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  // Load data for the signed-in user
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setData(INITIAL_DATA);
      setLoading(false);
      hydratedRef.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    hydratedRef.current = false;
    (async () => {
      const { data: row, error } = await supabase
        .from("user_habit_data")
        .select("data")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.error(error);
        toast.error("Failed to load your habits");
      }
      const loaded = (row?.data as AppData | undefined) ?? INITIAL_DATA;
      setData({ ...INITIAL_DATA, ...loaded, settings: { ...INITIAL_DATA.settings, ...(loaded.settings ?? {}) } });
      setLoading(false);
      // mark hydrated on next tick so the initial load doesn't trigger a save
      setTimeout(() => { hydratedRef.current = true; }, 0);
    })();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  // Apply theme
  useEffect(() => {
    applyTheme(data.settings.theme);
  }, [data.settings.theme]);

  // Debounced cloud save
  useEffect(() => {
    if (!user || !hydratedRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const { error } = await supabase
        .from("user_habit_data")
        .upsert({ user_id: user.id, data: data as never }, { onConflict: "user_id" });
      if (error) {
        console.error(error);
        toast.error("Failed to save");
      }
    }, 400);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [data, user]);

  const update = useCallback((fn: (d: AppData) => AppData) => {
    setData((prev) => {
      const next = fn(prev);
      const newOnes = checkAchievements(next.habits, next.achievements);
      if (newOnes.length) {
        newOnes.forEach((a) =>
          toast.success("Achievement unlocked", {
            description: `${ACHIEVEMENT_META[a.type].emoji} ${ACHIEVEMENT_META[a.type].name}`,
          }),
        );
        next.achievements = [...next.achievements, ...newOnes];
      }
      return next;
    });
  }, []);

  const ctx: Ctx = useMemo(
    () => ({
      data,
      loading,
      setTheme: (t) => update((d) => ({ ...d, settings: { ...d.settings, theme: t } })),
      toggleCompletion: (habitId, mk, day) =>
        update((d) => ({
          ...d,
          habits: d.habits.map((h) => {
            if (h.id !== habitId) return h;
            const list = h.completions[mk] || [];
            const has = list.includes(day);
            const next = has ? list.filter((x) => x !== day) : [...list, day].sort((a, b) => a - b);
            return { ...h, completions: { ...h.completions, [mk]: next } };
          }),
        })),
      addHabit: (name, tt) => {
        update((d) => ({ ...d, habits: [...d.habits, newHabit(name, tt)] }));
        toast.success("Habit added", { description: name });
      },
      updateHabit: (id, patch) =>
        update((d) => ({ ...d, habits: d.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),
      deleteHabit: (id) => {
        const name = data.habits.find((h) => h.id === id)?.name || "Habit";
        update((d) => ({ ...d, habits: d.habits.filter((h) => h.id !== id) }));
        toast.success("Habit deleted", { description: `${name} removed` });
      },
      importAll: (incoming) => setData(incoming),
      clearAll: () => {
        setData((d) => ({ habits: [], achievements: [], settings: d.settings, version: d.version }));
      },
      setGlobalTimeTracking: (v) =>
        update((d) => ({ ...d, settings: { ...d.settings, globalTimeTracking: v } })),
    }),
    [data, loading, update],
  );

  return <HabitsCtx.Provider value={ctx}>{children}</HabitsCtx.Provider>;
}

export function useHabits() {
  const c = useContext(HabitsCtx);
  if (!c) throw new Error("useHabits outside provider");
  return c;
}

export function useCurrentMonth(initial?: string) {
  const [mk, setMk] = useState(initial || monthKey(new Date()));
  return { mk, setMk };
}
