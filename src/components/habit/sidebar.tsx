import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { CalendarDays, BarChart3, Trophy, Settings, History, ListChecks, Flame, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const items = [
  { to: "/", label: "Monthly Grid", icon: CalendarDays },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/progress", label: "Progress", icon: Trophy },
  { to: "/manage", label: "Manage Habits", icon: ListChecks },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="hidden md:flex w-[240px] shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-elevated)] sticky top-0 h-screen">
      <div className="px-6 py-6 flex items-center gap-2">
        <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center shadow-[var(--shadow-glow-primary)]">
          <Flame className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold tracking-tight">Habitus</div>
          <div className="text-[11px] text-[var(--text-tertiary)]">Daily discipline</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-2 space-y-1">
        {items.map((it) => {
          const active = path === it.to;
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={[
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                active
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-[inset_3px_0_0_var(--interactive-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          );
        })}
      </nav>
      <UserFooter />
    </aside>
  );
}

function UserFooter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else navigate({ to: "/auth" });
  };
  const label = user?.user_metadata?.display_name || user?.email || "Account";
  const initial = (label as string).charAt(0).toUpperCase();
  return (
    <div className="px-3 py-3 border-t border-[var(--border-subtle)] flex items-center gap-2">
      <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-xs text-white font-semibold shrink-0">{initial}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate">{label}</div>
        <div className="text-[10px] text-[var(--text-tertiary)] truncate">{user?.email}</div>
      </div>
      <button onClick={signOut} className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]" title="Sign out" aria-label="Sign out">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] grid grid-cols-6 z-50">
      {items.map((it) => {
        const Icon = it.icon;
        const active = path === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={[
              "flex flex-col items-center justify-center gap-1 text-[10px]",
              active ? "text-[var(--interactive-primary)]" : "text-[var(--text-secondary)]",
            ].join(" ")}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate max-w-full px-1">{it.label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </nav>
  );
}
