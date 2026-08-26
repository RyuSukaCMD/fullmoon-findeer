import { useEffect, useState } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../auth/AuthContext";
import { StatCard, EmptyState, ErrorState, Skeleton, Badge } from "../../components/ui";

export function Dashboard() {
  const { hasPermission } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { stats } = await api.admin.stats();
      setData(stats);
    } catch (e) {
      setError(e.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!hasPermission("VIEW_STATS")) {
    return (
      <EmptyState icon="🔒" title="No access" message="You don't have permission to view statistics." />
    );
  }

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  const maxDay = Math.max(1, ...data.perDay.map((d) => d.views));
  const maxUserViews = Math.max(1, ...data.perUser.map((u) => u.views));
  const pageOwners = new Set(data.perPage.map((p) => p.owner)).size;

  return (
    <div className="space-y-6">
      <h2 className="font-display text-3xl text-white">Dashboard</h2>

      {/* users */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Users</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon="👥" label="Total users" value={data.total_users} />
          <StatCard icon="🟢" label="Active users" value={data.active_users} accent="text-emerald-300" />
          <StatCard icon="🚫" label="Suspended users" value={data.suspended_users} accent="text-rose-300" />
          <StatCard icon="👤" label="Page owners" value={pageOwners || 0} accent="text-storm" />
        </div>
      </section>

      {/* pages */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Pages</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon="📄" label="Total pages" value={data.total_pages} />
          <StatCard icon="🟢" label="Active pages" value={data.active_pages} accent="text-emerald-300" />
          <StatCard icon="🚫" label="Suspended pages" value={data.suspended_pages} accent="text-rose-300" />
          <StatCard icon="🌕" label="Main page views" value={data.mainPageViews} />
        </div>
      </section>

      {/* views */}
      <section>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Views</h3>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon="👁️" label="Total views" value={data.totalViews} accent="text-moon" />
          <StatCard icon="🌕" label="Main page" value={data.mainPageViews} />
          <StatCard icon="📄" label="Avg / page" value={data.total_pages ? Math.round(data.totalViews / data.total_pages) : 0} />
          <StatCard icon="⚡" label="Views today" value={data.perDay.slice(-1)[0]?.views || 0} accent="text-fruit" />
        </div>
      </section>

      {/* charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* daily chart */}
        <div className="card p-5">
          <h4 className="mb-4 font-display text-lg text-white">Views · last 14 days</h4>
          <div className="flex h-40 items-end gap-1">
            {data.perDay.map((d) => (
              <div key={d.day} className="group flex flex-1 flex-col items-center">
                <div className="relative w-full rounded-t bg-gradient-to-t from-moon/20 to-moon" style={{ height: `${Math.max(4, (d.views / maxDay) * 100)}%` }}>
                  <span className="absolute -top-5 left-1/2 hidden -translate-x-1/2 text-[10px] text-moon group-hover:block">{d.views}</span>
                </div>
                <span className="mt-1.5 text-[8px] text-slate-500">{d.day.slice(5)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* views per user */}
        <div className="card p-5">
          <h4 className="mb-4 font-display text-lg text-white">Views per user</h4>
          {data.perUser.length === 0 ? (
            <EmptyState icon="👤" title="No users" message="Create a user to get started." />
          ) : (
            <div className="space-y-3">
              {data.perUser.map((u) => (
                <div key={u.user_id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{u.username}</span>
                    <span className="text-slate-400">{u.views}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-storm to-fruit" style={{ width: `${(u.views / maxUserViews) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* views per page */}
      <section className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h4 className="font-display text-lg text-white">Views per page</h4>
        </div>
        {data.perPage.length === 0 ? (
          <div className="p-5">
            <EmptyState icon="📄" title="No pages" message="Create a custom page to start tracking it." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3">Page</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Views</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.perPage.map((p) => (
                  <tr key={p.page_id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-3 font-medium text-slate-200">{p.title}</td>
                    <td className="px-5 py-3 font-mono text-xs text-storm">/u/{p.slug}</td>
                    <td className="px-5 py-3 text-slate-400">{p.owner}</td>
                    <td className="px-5 py-3 text-slate-200">{p.views}</td>
                    <td className="px-5 py-3">
                      <Badge tone={p.status === "active" ? "emerald" : "rose"}>{p.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
