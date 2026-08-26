import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Moon } from "../../components/Moon";
import { Button, Field, Input, Spinner } from "../../components/ui";
import { useAuth } from "../../auth/AuthContext";
import { ApiError } from "../../services/api";

export function AdminLogin() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!loading && user) return <Navigate to="/starnova/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Enter your username and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(username, password);
      navigate("/starnova", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Moon phaseKey="full" size={64} />
          <h1 className="title-clip mt-4 font-display text-3xl text-moon">STUDIO</h1>
          <p className="mt-1 text-xs tracking-[0.3em] uppercase text-slate-400">
            Private access
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-4 p-6">
          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">
              {error}
            </div>
          )}
          <Field label="Username">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="username"
            />
          </Field>
          <Field label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </Field>
          <Button type="submit" className="w-full" loading={submitting} disabled={submitting}>
            {submitting ? <span className="sr-only">Signing in</span> : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          This area is protected. Unauthorized access is logged and denied.
        </p>
      </div>
    </div>
  );
}
