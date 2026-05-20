import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useHabits } from "@/hooks/use-habits";
import { calculateStreak, totalCompletions } from "@/lib/habit-calc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/manage")({ component: ManagePage });

function ManagePage() {
  const { data, addHabit, updateHabit, deleteHabit } = useHabits();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  const editing = data.habits.find((h) => h.id === editId);
  const deleting = data.habits.find((h) => h.id === delId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Habits</h1>
          <p className="text-sm text-[var(--text-secondary)]">Add, edit, or remove habits.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="text-white border-0" style={{ background: "var(--gradient-primary)" }}>
          <Plus className="h-4 w-4 mr-1" /> Add Habit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.habits.map((h) => {
          const s = calculateStreak(h);
          return (
            <div key={h.id} className="glass rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium truncate">{h.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-1">
                    Created {format(new Date(h.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditId(h.id)} className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)]">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDelId(h.id)} className="p-1.5 rounded hover:bg-[var(--bg-surface-hover)] text-[var(--interactive-danger)]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Stat label="Total" value={String(totalCompletions(h))} />
                <Stat label="Streak" value={`${s.current}d`} />
                <Stat label="Best" value={`${s.longest}d`} />
              </div>
            </div>
          );
        })}
        {data.habits.length === 0 && (
          <div className="col-span-full text-center py-12 text-[var(--text-secondary)]">No habits — add your first one.</div>
        )}
      </div>

      <FormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add habit"
        onSubmit={(n, t) => { addHabit(n, t); setAddOpen(false); }}
      />
      <FormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditId(null)}
        title="Edit habit"
        initial={editing}
        onSubmit={(n, t) => {
          if (editing) updateHabit(editing.id, { name: n, timeTrackingEnabled: t });
          setEditId(null);
        }}
      />
      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDelId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete habit?</DialogTitle></DialogHeader>
          {deleting && (
            <p className="text-sm text-[var(--text-secondary)]">
              Permanently delete <span className="text-[var(--text-primary)] font-medium">{deleting.name}</span> and all its data.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelId(null)}>Cancel</Button>
            <Button onClick={() => { if (deleting) deleteHabit(deleting.id); setDelId(null); }} className="text-white border-0" style={{ background: "var(--gradient-danger)" }}>
              Delete forever
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 rounded-md bg-[var(--bg-surface)] px-2 py-1.5 text-center">
      <div className="text-[10px] uppercase text-[var(--text-tertiary)]">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function FormDialog({
  open, onOpenChange, title, initial, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initial?: { name: string; timeTrackingEnabled: boolean };
  onSubmit: (n: string, t: boolean) => void;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [tt, setTt] = useState(initial?.timeTrackingEnabled || false);
  // reset on open
  if (open && initial && name === "" && initial.name !== "") {
    // no-op (controlled by user typing)
  }
  return (
    <Dialog open={open} onOpenChange={(v) => { if (v) { setName(initial?.name || ""); setTt(initial?.timeTrackingEnabled || false); } onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Habit name</Label>
            <Input value={name} maxLength={50} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[var(--border-subtle)] px-3 py-2">
            <div>
              <div className="text-sm font-medium">Time tracking</div>
              <div className="text-xs text-[var(--text-tertiary)]">Record time-of-day</div>
            </div>
            <Switch checked={tt} onCheckedChange={setTt} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!name.trim()} onClick={() => onSubmit(name.trim(), tt)} className="text-white border-0" style={{ background: "var(--gradient-primary)" }}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
