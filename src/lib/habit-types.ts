export interface Habit {
  id: string;
  name: string;
  color?: string;
  timeTrackingEnabled: boolean;
  createdAt: string;
  completions: Record<string, number[]>;
  timeStamps?: Record<string, string>;
}

export type AchievementType =
  | "seedling"
  | "on-fire"
  | "diamond"
  | "perfectionist"
  | "momentum"
  | "champion";

export interface Achievement {
  id: string;
  type: AchievementType;
  unlockedAt: string;
  habitId?: string;
}

export type ThemeName = "obsidian" | "midnight" | "graphite";

export interface AppData {
  habits: Habit[];
  achievements: Achievement[];
  settings: {
    theme: ThemeName;
    globalTimeTracking: boolean;
    lastVisited: string;
  };
  version: string;
}

export const INITIAL_HABITS = [
  "Wake up before 5:30am",
  "Run and walk",
  "Drink 3-4L water",
  "Claud courses",
  "Hit gym",
  "Eat 6 eggs",
  "Do calisthenics",
  "Post a reel on L n L",
  "Complete intern 7-8",
  "2 leet code a day",
  "Read book",
  "Post 3 YouTube faceless vid",
  "Work on Jarvis",
  "Sideshift UGC",
  "Skinriari care 2-3 times",
  "Debloat steps",
  "Keyboard practice",
  "Sleep before 10 PM",
];

export const QUOTES = [
  { t: "Motivation gets you started. Habit keeps you going.", a: "" },
  { t: "Success is the sum of small efforts repeated day in and day out.", a: "Robert Collier" },
  { t: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", a: "Aristotle" },
  { t: "The secret of getting ahead is getting started.", a: "Mark Twain" },
  { t: "You'll never change your life until you change something you do daily.", a: "John Maxwell" },
  { t: "Small disciplines repeated with consistency every day lead to great achievements.", a: "John Maxwell" },
  { t: "Habits are the compound interest of self-improvement.", a: "James Clear" },
  { t: "Every action you take is a vote for the type of person you wish to become.", a: "James Clear" },
  { t: "You do not rise to the level of your goals. You fall to the level of your systems.", a: "James Clear" },
  { t: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
  { t: "The future depends on what you do today.", a: "Mahatma Gandhi" },
  { t: "Quality is not an act, it is a habit.", a: "Aristotle" },
  { t: "First forget inspiration. Habit is more dependable.", a: "Octavia Butler" },
  { t: "The chains of habit are too weak to be felt until they are too strong to be broken.", a: "Samuel Johnson" },
  { t: "Drop by drop is the water pot filled.", a: "Buddha" },
  { t: "In essence, if we want to direct our lives, we must take control of our consistent actions.", a: "Tony Robbins" },
  { t: "Good habits are worth being fanatical about.", a: "John Irving" },
  { t: "Discipline is choosing between what you want now and what you want most.", a: "Augusta F. Kantra" },
  { t: "It's not what we do once in a while that shapes our lives. It's what we do consistently.", a: "Tony Robbins" },
  { t: "The difference between who you are and who you want to be is what you do.", a: "Bill Phillips" },
];

export const ACHIEVEMENT_META: Record<
  AchievementType,
  { emoji: string; name: string; desc: string }
> = {
  seedling: { emoji: "🌱", name: "Seedling", desc: "Reach a 7-day streak on any habit" },
  "on-fire": { emoji: "🔥", name: "On Fire", desc: "Reach a 30-day streak on any habit" },
  diamond: { emoji: "💎", name: "Diamond", desc: "100 total completions on any habit" },
  perfectionist: { emoji: "🎯", name: "Perfectionist", desc: "100% completion rate for any month" },
  momentum: { emoji: "🚀", name: "Momentum", desc: "All habits completed 7 consecutive days" },
  champion: { emoji: "🏆", name: "Champion", desc: "5+ active streaks simultaneously" },
};
