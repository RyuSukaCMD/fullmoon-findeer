import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../auth/AuthContext";
import {
  Button, Field, Input, Select, Toggle, Badge, Modal, ConfirmDialog,
  EmptyState, ErrorState, Skeleton, useToast, timeAgo, useNow,
} from "../../components/ui";

const PERMISSIONS = ["CREATE_PAGE", "EDIT_PAGE", "DELETE_PAGE", "VIEW_STATS", "VIEW_USERS", "MANAGE_USERS", "MANAGE_PAGES"];

export function AdminUsers() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const now = useNow(20000);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState(null); // user being edited
  const [confirm, setConfirm] = useState(null); // user to delete
  const [busyId, setBusyId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { users } = await api.admin.users.list();
      setUsers(users);
    } catch (e) {
      setError(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const canView = hasPermission("VIEW_USERS");
  const canManage = hasPermission("MANAGE_USERS");

  if (!canView) {
    return <EmptyState icon="🔒" title="No access" message="You don't have permission to view users." />;
  }
  if (error) return <ErrorState message={error} onRetry={load} />;

  const toggleStatus = async (u) => {
    const next = u.status === "active" ? "suspended" : "active";
    setBusyId(u.id + ":status");
    try {
      await api.admin.users.update(u.id, { status: next });
      toast.success(`${u.username} ${next === "active" ? "re-activated" : "suspended"}.`);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusyId("delete");
    try {
      await api.admin.users.remove(confirm.id);
      toast.success(`Deleted ${confirm.username}.`);
      setConfirm(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-3xl text-white">Users</h2>
          <p className="text-sm text-slate-400">{users.length} account(s)</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)}>+ Create user</Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : users.length === 0 ? (
        <EmptyState icon="👥" title="No users yet" message="Create your first user." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Permissions</th>
                  <th className="px-5 py-3">Limit</th>
                  <th className="px-5 py-3">Last activity</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-200">{u.username}</div>
                      <div className="text-[11px] text-slate-500">{u.role}</div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={u.status === "active" ? "emerald" : "rose"}>{u.status}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.permissions.includes("*")
                          ? <Badge tone="storm">all</Badge>
                          : u.permissions.map((p) => <Badge key={p} tone="neutral">{p}</Badge>)}
                        {!u.permissions.includes("*") && u.permissions.length === 0 && (
                          <span className="text-xs text-slate-500">none</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{u.page_limit} pages</td>
                    <td className="px-5 py-3 text-xs text-slate-400">{timeAgo(u.last_activity, now)}</td>
                    <td className="px-5 py-3 text-right">
                      {canManage && u.role !== "admin" && (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => toggleStatus(u)} disabled={busyId === u.id + ":status"}>
                            {u.status === "active" ? "Suspend" : "Activate"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => setConfirm(u)} disabled={busyId === "delete"}>
                            Delete
                          </Button>
                        </div>
                      )}
                      {u.role === "admin" && (
                        <span className="inline-flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditing(u)}>Edit</Button>
                          <span className="text-xs text-slate-500">owner</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateUserModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />
      <EditUserModal user={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        title="Delete user?"
        message={`This permanently deletes "${confirm?.username}" and all their pages. This cannot be undone.`}
        danger
        loading={busyId === "delete"}
      />
    </div>
  );
}

// Owner controls for a single user: role, page limit, status, permissions,
// and a password reset. The current account's password is changed via the
// Account page (/starnova/account).
function EditUserModal({ user, onClose, onSaved }) {
  const toast = useToast();
  const isOwner = user?.role === "admin";
  const [form, setForm] = useState(null);
  const [pass, setPass] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) setForm({ status: user.status, page_limit: user.page_limit, role: user.role, permissions: user.permissions.includes("*") ? null : [...user.permissions] });
  }, [user]);

  if (!user) return null;

  const save = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const body = {
        status: form.status,
        page_limit: Number(form.page_limit),
        role: form.role,
      };
      if (form.permissions) body.permissions = form.permissions;
      if (pass) body.password = pass; // reset password (owner)
      await api.admin.users.update(user.id, body);
      toast.success(`${user.username} updated.`);
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const loginFallback = (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-200">
      This is the owner account. To change its password, use <b>Account</b> in the sidebar.
    </div>
  );

  return (
    <Modal open={!!user} onClose={onClose} title={`Manage ${user.username}`} size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} loading={submitting}>Save changes</Button>
        </div>
      }
    >
      {form && (
        <form onSubmit={save} className="space-y-4">
          {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
            </Field>
            <Field label="Page limit" hint="Max pages this user can create.">
              <Input type="number" min="1" max="50" value={form.page_limit} onChange={(e) => setForm({ ...form, page_limit: Number(e.target.value) })} />
            </Field>
          </div>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </Field>

          {!isOwner ? (
            <>
              <Field label="Permissions">
                <div className="grid gap-2 sm:grid-cols-2">
                  {PERMISSIONS.map((p) => {
                    const on = form.permissions.includes(p);
                    return (
                      <label key={p} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                        <span className="font-medium text-slate-300">{p}</span>
                        <Toggle checked={on} onChange={() => setForm((f) => ({ ...f, permissions: on ? f.permissions.filter((x) => x !== p) : [...f.permissions, p] }))} />
                      </label>
                    );
                  })}
                </div>
              </Field>
              <Field label="Reset password" hint="Leave blank to keep the current password.">
                <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="new password" autoComplete="new-password" />
              </Field>
            </>
          ) : (
            loginFallback
          )}
        </form>
      )}
    </Modal>
  );
}

function CreateUserModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    username: "", password: "", status: "active", permissions: [], page_limit: 5,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm({ username: "", password: "", status: "active", permissions: [], page_limit: 5 });
      setError("");
    }
  }, [open]);

  const togglePerm = (p) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p)
        ? f.permissions.filter((x) => x !== p)
        : [...f.permissions, p],
    }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await api.admin.users.create(form);
      toast.success("User created.");
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create user" size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={submitting}>Create user</Button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Username" hint="3-24 chars, unique.">
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="player55" />
          </Field>
          <Field label="Password" hint="Min 4 characters.">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </Select>
          </Field>
          <Field label="Page creation limit" hint="Max pages this user can create.">
            <Input type="number" min="1" max="50" value={form.page_limit} onChange={(e) => setForm({ ...form, page_limit: Number(e.target.value) })} />
          </Field>
        </div>
        <Field label="Permissions">
          <div className="grid gap-2 sm:grid-cols-2">
            {PERMISSIONS.map((p) => (
              <label key={p} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2 text-xs">
                <span className="font-medium text-slate-300">{p}</span>
                <Toggle checked={form.permissions.includes(p)} onChange={() => togglePerm(p)} />
              </label>
            ))}
          </div>
        </Field>
      </form>
    </Modal>
  );
}
