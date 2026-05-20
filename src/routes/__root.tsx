import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  Link,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import appCss from "../styles.css?url";
import { Sidebar, MobileNav } from "@/components/habit/sidebar";
import { HabitsProvider } from "@/hooks/use-habits";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold">404</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Page not found</p>
        <Link to="/" className="inline-block mt-4 px-4 py-2 rounded-md text-white" style={{ background: "var(--gradient-primary)" }}>Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 px-4 py-2 rounded-md text-white" style={{ background: "var(--gradient-primary)" }}>Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Habitus — Personal Habit tracker" },
      { name: "description", content: "Track daily habits, streaks, and analytics in a sleek dark interface." },
      { property: "og:title", content: "Habitus — Personal Habit tracker" },
      { name: "twitter:title", content: "Habitus — Personal Habit tracker" },
      { property: "og:description", content: "Track daily habits, streaks, and analytics in a sleek dark interface." },
      { name: "twitter:description", content: "Track daily habits, streaks, and analytics in a sleek dark interface." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c95a69e3-01af-4998-b925-854a3c46db4d" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/c95a69e3-01af-4998-b925-854a3c46db4d" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="obsidian">
      <head><HeadContent /></head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const PUBLIC_PATHS = new Set(["/auth", "/reset-password"]);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPublic = PUBLIC_PATHS.has(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublic) navigate({ to: "/auth" });
  }, [user, loading, isPublic, navigate]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-[var(--text-secondary)]">Loading…</div>;
  }
  if (isPublic) return <>{children}</>;
  if (!user) return null;
  return (
    <HabitsProvider>
      <div className="flex min-h-screen w-full bg-[var(--bg-base)]">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 md:px-8 py-6 pb-24 md:pb-8">{children}</main>
        <MobileNav />
      </div>
    </HabitsProvider>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGate>
          <Outlet />
        </AuthGate>
        <Toaster theme="dark" position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
