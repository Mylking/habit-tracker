import { createFileRoute } from "@tanstack/react-router";
import { HabitGrid } from "@/components/habit/habit-grid";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Monthly Grid</h1>
        <p className="text-sm text-[var(--text-secondary)]">Tap a cell to mark a day complete. Auto-saved locally.</p>
      </div>
      <HabitGrid />
    </div>
  );
}
