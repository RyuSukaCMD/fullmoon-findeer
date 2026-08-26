import { NavLink, Outlet, useNavigate, Navigate } from "react-router-dom";
import { Moon } from "../components/Moon";
import { useAuth } from "../auth/AuthContext";
import { Button, Spinner } from "../components/ui";

// Shell + guard for the admin area. The sidebar only shows items the current
// user is permitted to use; the backend still enforces every route.
export function AdminLayout() {
  const { user, loading, logout, hasPermission } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-moon" />
      </div>
    );
  }
  if (!user) {
    // not authenticated -> send to the admin login
    return <Navigate to="/starnova" replace />;
  }

  const links = [];
  if (hasPermission("VIEW_STATS")) links.push({ to: "/starnova", label: "Dashboard", end: true });
  if (hasPermission("VIEW_USERS")) links.push({ to: "/starnova/users", label: "Users" });
  if (hasPermission("MANAGE_PAGES")) links.push({ to: "/starnova/pages", label: "Pages" });
  // "Finder settings" is available to any authenticated owner (not just admins)
  links.push({ to: "/starnova/settings", label: "Finder settings" });
  links.push({ to: "/starnova/account", label: "Account" });

  const onLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-[100dvh]">
      {/* top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-ink/85 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Moon phaseKey="full" size={26} glowing={false} />
          <div className="leading-none">
            <span className="title-clip font-display text-base text-moon">STUDIO</span>
            <span className="ml-2 text-[10px] uppercase tracking-[0.25em] text-slate-400">Admin</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-slate-400 sm:block">
            {user.username} · {user.role}
          </span>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 md:flex-row">
        {/* sidebar */}
        <aside className="md:w-52 md:shrink-0">
          <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-white/5 bg-panel p-2 md:flex-col md:overflow-visible">
            {links.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-500">No permissions for this area.</p>
            )}
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "bg-moon/10 text-moon" : "text-slate-300 hover:bg-white/5"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
