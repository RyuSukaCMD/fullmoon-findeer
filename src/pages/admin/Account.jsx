import { useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { Button, Field, Input, useToast } from "../../components/ui";

// Lets the logged-in user change their OWN password. Works for the owner too
// (that's the place to change the Chaeulso admin password).
export function Account() {
  const { user, changeOwnPassword } = useAuth();
  const toast = useToast();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm2, setConfirm2] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next !== confirm2) {
      setError("New passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await changeOwnPassword(current, next);
      toast.success("Password changed.");
      setCurrent(""); setNext(""); setConfirm2("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h2 className="font-display text-3xl text-white">Account</h2>
        <p className="text-sm text-slate-400">
          Signed in as <span className="font-semibold text-slate-200">{user?.username}</span> · role{" "}
          <span className="text-storm">{user?.role}</span> · page limit{" "}
          <span className="text-slate-200">{user?.role === "admin" ? "—" : user?.page_limit}</span>
        </p>
      </div>

      <form onSubmit={submit} className="card space-y-4 p-6">
        <h3 className="font-display text-lg text-white">Change password</h3>
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div>
        )}
        <Field label="Current password">
          <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </Field>
        <Field label="New password" hint="Min 4 characters.">
          <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <Input type="password" value={confirm2} onChange={(e) => setConfirm2(e.target.value)} autoComplete="new-password" />
        </Field>
        <Button type="submit" loading={submitting} className="w-full">Update password</Button>
      </form>
    </div>
  );
}
