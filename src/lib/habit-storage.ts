import { AppData, Habit, INITIAL_HABITS, ThemeName } from "./habit-types";

const KEY = "habit-tracker-v2";
const VERSION = "1.1.0";

function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Seed data for May 2026 — matches user's existing tracker
const MAY_2026: Record<string, number[]> = {
  "Wake up before 5:30am": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  "Run and walk": [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  "Drink 3-4L water": [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18],
  "Claud courses": [6, 9, 12, 14, 17],
  "Hit gym": [4, 6, 7, 9, 10, 11, 13, 14, 16, 17],
  "Eat 6 eggs": [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 18],
  "Do calisthenics": [4, 5, 6, 8, 9, 10, 11, 12, 14, 16, 17],
  "Post a reel on L n L": [5, 7, 10, 13, 16],
  "Complete intern 7-8": [6, 8, 10, 13, 15, 17],
  "2 leet code a day": [5, 7, 8, 10, 11, 13, 14, 15, 17],
  "Read book": [4, 5, 7, 8, 10, 11, 12, 14, 16, 18],
  "Post 3 YouTube faceless vid": [5, 7, 9, 12, 15, 17],
  "Work on Jarvis": [6, 9, 12, 15, 17],
  "Sideshift UGC": [4, 6, 8, 10, 12, 14, 16, 18],
  "Skinriari care 2-3 times": [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
  "Debloat steps": [8, 12, 16],
  "Keyboard practice": [10, 15],
  "Sleep before 10 PM": [5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 17, 18],
};

function seed(): AppData {
  const habits: Habit[] = INITIAL_HABITS.map((name) => ({
    id: uuid(),
    name,
    timeTrackingEnabled: false,
    createdAt: new Date().toISOString(),
    completions: MAY_2026[name] ? { "2026-05": MAY_2026[name] } : ({} as Record<string, number[]>),
  }));
  return {
    habits,
    achievements: [],
    settings: {
      theme: "obsidian",
      globalTimeTracking: false,
      lastVisited: new Date().toISOString(),
    },
    version: VERSION,
  };
}

export function initialData(): AppData {
  return {
    habits: [],
    achievements: [],
    settings: { theme: "obsidian", globalTimeTracking: false, lastVisited: "" },
    version: VERSION,
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return seed();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    const parsed = JSON.parse(raw) as AppData;
    if (!parsed.settings) parsed.settings = seed().settings;
    if (!parsed.achievements) parsed.achievements = [];
    return parsed;
  } catch {
    return seed();
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
export function saveData(data: AppData) {
  if (typeof window === "undefined") return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    localStorage.setItem(KEY, JSON.stringify(data));
  }, 300);
}

export function saveDataNow(data: AppData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function newHabit(name: string, timeTracking = false): Habit {
  return {
    id: uuid(),
    name,
    timeTrackingEnabled: timeTracking,
    createdAt: new Date().toISOString(),
    completions: {},
  };
}

export function newId() {
  return uuid();
}

export function applyTheme(theme: ThemeName) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}
