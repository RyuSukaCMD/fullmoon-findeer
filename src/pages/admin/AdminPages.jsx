import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../services/api";
import { useAuth } from "../../auth/AuthContext";
import {
  Button, Badge, ConfirmDialog, EmptyState, ErrorState, Skeleton, useToast, timeAgo, useNow,
} from "../../components/ui";

export function AdminPages() {
  const { hasPermission } = useAuth();
  const toast = useToast();
  const now = useNow(20000);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const canManage = hasPermission("MANAGE_PAGES");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { pages } = await api.admin.pages.list();
      setPages(pages);
    } catch (e) {
      setError(e.message || "Failed to load pages");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  if (!canManage) {
    return <EmptyState icon="🔒" title="No access" message="You don't have permission to manage pages." />;
  }
  if (error) return <ErrorState message={error} onRetry={load} />;

  const toggleStatus = async (p) => {
    const next = p.status === "active" ? "suspended" : "active";
    setBusyId(p.id + ":status");
    try {
      await api.admin.pages.update(p.id, { status: next });
      toast.success(`Page ${next === "active" ? "published" : "suspended"}.`);
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
      await api.admin.pages.remove(confirm.id);
      toast.success("Page deleted.");
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl text-white">Pages</h2>
          <p className="text-sm text-slate-400">{pages.length} custom page(s)</p>
        </div>
        <Link to="/createpage"><Button>+ New page</Button></Link>
      </div>

      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}</div>
      ) : pages.length === 0 ? (
        <EmptyState icon="📄" title="No pages yet" message="Create your first custom page." action={<Link to="/createpage"><Button>Create page</Button></Link>} />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Page</th>
                  <th className="px-5 py-3">URL</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {pages.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3">
                      <Link to={`/u/${p.slug}`} className="font-medium text-slate-200 hover:text-moon">{p.title}</Link>
                      {p.description && <p className="max-w-[220px] truncate text-[11px] text-slate-500">{p.description}</p>}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-storm">/u/{p.slug}</td>
                    <td className="px-5 py-3 text-slate-400">{p.owner}</td>
                    <td className="px-5 py-3"><Badge tone={p.status === "active" ? "emerald" : "rose"}>{p.status}</Badge></td>
                    <td className="px-5 py-3 text-xs text-slate-400">{timeAgo(p.updated_at, now)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(p)} disabled={busyId === p.id + ":status"}>
                          {p.status === "active" ? "Suspend" : "Publish"}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => setConfirm(p)} disabled={busyId === "delete"}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        title="Delete page?"
        message={`This permanently deletes "/u/${confirm?.slug}" and removes its content. This cannot be undone.`}
        danger
        loading={busyId === "delete"}
      />
    </div>
  );
}
