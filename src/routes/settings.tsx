import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useHabits } from "@/hooks/use-habits";
import { ThemeName } from "@/lib/habit-types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { exportJSON, importJSON } from "@/lib/habit-export";
import { Check, Upload, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const THEMES: { id: ThemeName; name: string; desc: string; swatches: string[] }[] = [
  { id: "obsidian", name: "Obsidian", desc: "Pure black with sky-blue accents", swatches: ["#000000", "#0a0a0a", "#0ea5e9", "#6366f1"] },
  { id: "midnight", name: "Midnight Navy", desc: "Deep navy, soft blue", swatches: ["#0f1419", "#161b22", "#58a6ff", "#8b5cf6"] },
  { id: "graphite", name: "Graphite", desc: "Charcoal with cyan glow", swatches: ["#121212", "#1e1e1e", "#00d4ff", "#0099cc"] },
];

function SettingsPage() {
  const { data, setTheme, importAll, clearAll, setGlobalTimeTracking } = useHabits();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmStep, setConfirmStep] = useState(0);

  async function onImport(file: File) {
    try {
      const d = await importJSON(file);
      importAll(d);
    } catch {
      toast.error("Invalid JSON file");
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-[var(--text-secondary)]">Theme, data, and preferences.</p>
      </div>

      <section className="glass rounded-xl p-5">
        <div className="text-sm font-semibold mb-4">Theme</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => {
            const active = data.settings.theme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={[
                  "text-left rounded-xl p-4 border transition",
                  active ? "border-[var(--interactive-primary)] shadow-[var(--shadow-glow-primary)]" : "border-[var(--border-subtle)] hover:border-[var(--border-default)]",
                ].join(" ")}
                style={{ background: t.swatches[1] }}
              >
                <div className="flex h-12 rounded-md overflow-hidden mb-3 border border-[var(--border-subtle)]">
                  {t.swatches.map((c) => <div key={c} className="flex-1" style={{ background: c }} />)}
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm" style={{ color: "#fff" }}>{t.name}</div>
                  {active && <Check className="h-4 w-4" style={{ color: t.swatches[2] }} />}
                </div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{t.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass rounded-xl p-5">
        <div className="text-sm font-semibold mb-4">Preferences</div>
        <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-4 py-3">
          <div>
            <div className="text-sm font-medium">Global time tracking</div>
            <div className="text-xs text-[var(--text-tertiary)]">Enable time tracking for all habits by default</div>
          </div>
          <Switch checked={data.settings.globalTimeTracking} onCheckedChange={setGlobalTimeTracking} />
        </div>
      </section>

      <section className="glass rounded-xl p-5">
        <div className="text-sm font-semibold mb-4">Data management</div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => exportJSON(data)} className="gap-2">
            <Download className="h-4 w-4" /> Export JSON
          </Button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" /> Import JSON
          </Button>
          <Button
            onClick={() => {
              if (confirmStep < 2) {
                setConfirmStep(confirmStep + 1);
                toast.warning(confirmStep === 0 ? "Click twice more to confirm" : "Click once more to clear ALL data");
              } else {
                clearAll();
                setConfirmStep(0);
                toast.success("All data cleared");
              }
            }}
            className="gap-2 text-white border-0"
            style={{ background: "var(--gradient-danger)" }}
          >
            <Trash2 className="h-4 w-4" /> {confirmStep === 0 ? "Clear all data" : `Confirm (${3 - confirmStep})`}
          </Button>
        </div>
      </section>

      <section className="glass rounded-xl p-5">
        <div className="text-sm font-semibold mb-2">About</div>
        <div className="text-sm text-[var(--text-secondary)]">
          Habitus v{data.version} — Professional habit tracker. Data is stored locally in your browser.
        </div>
      </section>
    </div>
  );
}
