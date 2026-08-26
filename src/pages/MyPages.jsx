import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../services/api";
import { PageForm } from "../components/PageForm";
import { useAuth } from "../auth/AuthContext";
import { Button, Badge, Modal, ConfirmDialog, EmptyState, ErrorState, Skeleton, useToast, timeAgo, useNow } from "../components/ui";

export function MyPages() {
  const { user, loading, hasPermission } = useAuth();
  const toast = useToast();
  const now = useNow(20000);
  const [pages, setPages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // full page object
  const [confirm, setConfirm] = useState(null);
  const [submit, setSubmit] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const canCreate = hasPermission("CREATE_PAGE");
  const canEdit = hasPermission("EDIT_PAGE");
  const canDelete = hasPermission("DELETE_PAGE");

  const load = async () => {
    setLoadingList(true);
    setError("");
    try {
      const { pages } = await api.pages.mine();
      setPages(pages);
    } catch (e) {
      setError(e.message || "Failed to load pages");
    } finally {
      setLoadingList(false);
    }
  };
  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/starnova" replace />;

  const openEdit = async (p) => {
    try {
      const { page } = await api.pages.get(p.slug);
      setEditing({ id: p.id, ...page });
    } catch (e) {
      toast.error(e.message);
    }
  };

  const saveEdit = async (form) => {
    setSubmit(true);
    try {
      await api.pages.update(editing.id, form);
      toast.success("Page updated.");
      setEditing(null);
      await load();
    } finally {
      setSubmit(false);
    }
  };

  const doDelete = async () => {
    if (!confirm) return;
    setBusyId("delete");
    try {
      await api.pages.remove(confirm.id);
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
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-white">My pages</h1>
          <p className="mt-1 text-sm text-slate-400">
            {pages.length} page(s) · limit {user.role === "admin" ? "—" : user.page_limit}
          </p>
        </div>
        {canCreate && <Link to="/createpage"><Button>+ New page</Button></Link>}
      </div>

      <div className="mt-8">
        {loadingList ? (
          <div className="space-y-3">{[0, 1].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : pages.length === 0 ? (
          <EmptyState icon="📄" title="No pages yet" message="Create your first custom page." action={canCreate ? <Link to="/createpage"><Button>Create page</Button></Link> : undefined} />
        ) : (
          <div className="space-y-3">
            {pages.map((p) => (
              <div key={p.id} className="card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/u/${p.slug}`} className="truncate font-display text-xl text-white hover:text-moon">{p.title}</Link>
                    <Badge tone={p.status === "active" ? "emerald" : "rose"}>{p.status}</Badge>
                  </div>
                  <p className="truncate font-mono text-xs text-storm">/u/{p.slug}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {p.views} view{p.views === 1 ? "" : "s"} · updated {timeAgo(p.updated_at, now)}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link to={`/u/${p.slug}`}><Button variant="ghost" size="sm">View</Button></Link>
                  {canEdit && <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>}
                  {canDelete && <Button variant="danger" size="sm" onClick={() => setConfirm(p)} disabled={busyId === "delete"}>Delete</Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit page" size="xl">
        {editing && (
          <PageForm initial={editing} submitLabel="Save changes" onSubmit={saveEdit} submitting={submit} />
        )}
      </Modal>
      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={doDelete}
        title="Delete page?"
        message={`This permanently deletes "/u/${confirm?.slug}". This cannot be undone.`}
        danger
        loading={busyId === "delete"}
      />
    </div>
  );
}
