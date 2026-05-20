import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Flame, Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in — Habitus" },
      { name: "description", content: "Sign in or create your Habitus account to track habits across devices." },
    ],
  }),
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);
const passwordSchema = z.string().min(8, "At least 8 characters").max(128);
const nameSchema = z.string().trim().min(1, "Name required").max(80);

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [user, loading, navigate]);

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const em = emailSchema.parse(email);
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(em, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent", { description: "Check your inbox." });
        setMode("login");
        return;
      }
      const pw = passwordSchema.parse(password);
      if (mode === "signup") {
        const nm = nameSchema.parse(displayName);
        const { error } = await supabase.auth.signUp({
          email: em,
          password: pw,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: nm },
          },
        });
        if (error) throw error;
        toast.success("Account created", { description: "You're signed in." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: em, password: pw });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      const msg = err instanceof z.ZodError ? err.issues[0]?.message : err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg ?? "Error");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
  setBusy(true);

  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) throw error;
  } catch (err) {
    toast.error(
      err instanceof Error
        ? err.message
        : "Google sign-in failed"
    );
  } finally {
    setBusy(false);
  }
};

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-base)] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-[var(--shadow-glow-primary)]">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">Habitus</div>
            <div className="text-[11px] text-[var(--text-tertiary)]">Daily discipline</div>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 shadow-xl">
          <h1 className="text-xl font-semibold tracking-tight">
            {mode === "login" && "Welcome back"}
            {mode === "signup" && "Create your account"}
            {mode === "forgot" && "Reset your password"}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {mode === "login" && "Sign in to sync your habits everywhere."}
            {mode === "signup" && "Start tracking your habits in seconds."}
            {mode === "forgot" && "We'll email you a secure reset link."}
          </p>

          {mode !== "forgot" && (
            <>
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="mt-6 w-full inline-flex items-center justify-center gap-3 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition disabled:opacity-60"
              >
                <GoogleIcon />
                Continue with Google
              </button>
              <div className="my-5 flex items-center gap-3 text-[11px] text-[var(--text-tertiary)]">
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
                OR
                <div className="h-px flex-1 bg-[var(--border-subtle)]" />
              </div>
            </>
          )}

          <form onSubmit={handleEmail} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-9" placeholder="Your name" autoComplete="name" required maxLength={80} />
                </div>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="you@example.com" autoComplete="email" required maxLength={255} />
              </div>
            </div>
            {mode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === "login" && (
                    <button type="button" onClick={() => setMode("forgot")} className="text-[11px] text-[var(--interactive-primary)] hover:underline">
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-tertiary)]" />
                  <Input id="password" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-9" placeholder="••••••••" autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={8} maxLength={128} />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]" aria-label={showPw ? "Hide password" : "Show password"}>
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === "signup" && (
                  <p className="text-[11px] text-[var(--text-tertiary)]">Minimum 8 characters. Avoid common passwords.</p>
                )}
              </div>
            )}

            <Button type="submit" disabled={busy} className="w-full" style={{ background: "var(--gradient-primary)" }}>
              {busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-[var(--text-secondary)]">
            {mode === "login" && (
              <>Don't have an account? <button onClick={() => setMode("signup")} className="text-[var(--interactive-primary)] hover:underline">Sign up</button></>
            )}
            {mode === "signup" && (
              <>Already have an account? <button onClick={() => setMode("login")} className="text-[var(--interactive-primary)] hover:underline">Sign in</button></>
            )}
            {mode === "forgot" && (
              <button onClick={() => setMode("login")} className="text-[var(--interactive-primary)] hover:underline">Back to sign in</button>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-[var(--text-tertiary)]">
          By continuing you agree to our <Link to="/" className="hover:underline">Terms</Link> and <Link to="/" className="hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.08 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
