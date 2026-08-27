import { useEffect, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { ToastProvider } from "./components/ui";
import { LoadingScreen } from "./components/LoadingScreen";
import { JoinModal } from "./components/JoinModal";
import { PublicLayout } from "./layouts/PublicLayout";
import { AdminLayout } from "./layouts/AdminLayout";
import { Home } from "./pages/Home";
import { About } from "./pages/About";
import { NotFound } from "./pages/NotFound";
import { PublicPage } from "./pages/PublicPage";
import { AdminLogin } from "./pages/admin/AdminLogin";
import { Dashboard } from "./pages/admin/Dashboard";
import { AdminUsers } from "./pages/admin/Users";
import { AdminPages } from "./pages/admin/AdminPages";
import { SiteSettings } from "./pages/admin/SiteSettings";
import { Account } from "./pages/admin/Account";
import { CreatePage } from "./pages/CreatePage";
import { MyPages } from "./pages/MyPages";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    try {
      window.scrollTo({ top: 0 });
    } catch {}
  }, [pathname]);
  return null;
}

// Top-level App handles the boot loading screen and the shared join modal.
function Shell() {
  const [booting, setBooting] = useState(() => {
    try {
      return !sessionStorage.getItem("fm_booted");
    } catch {
      return true;
    }
  });
  const [joinServer, setJoinServer] = useState(null);

  useEffect(() => {
    if (booting) {
      const t = setTimeout(() => {
        setBooting(false);
        try {
          sessionStorage.setItem("fm_booted", "1");
        } catch {}
      }, 1800);
      return () => {
        clearTimeout(t);
      };
    }
  }, [booting]);

  return (
    <div className="relative min-h-screen">
      {booting && <LoadingScreen />}
      <ScrollToTop />

      <div className={booting ? "pointer-events-none opacity-0" : "transition-opacity duration-500"}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicLayout>
                <Home onJoin={setJoinServer} />
              </PublicLayout>
            }
          />
          <Route
            path="/find"
            element={<Navigate to="/" replace />}
          />
          <Route
            path="/about"
            element={
              <PublicLayout>
                <About />
              </PublicLayout>
            }
          />
          {/* custom pages are standalone (no chrome) */}
          <Route path="/u/:slug" element={<PublicPage />} />

          {/* admin */}
          <Route path="/starnova" element={<AdminLogin />} />
          <Route element={<AdminLayout />}>
            <Route path="/starnova/dashboard" element={<Dashboard />} />
            <Route path="/starnova/users" element={<AdminUsers />} />
            <Route path="/starnova/pages" element={<AdminPages />} />
            <Route path="/starnova/settings" element={<SiteSettings />} />
            <Route path="/starnova/account" element={<Account />} />
          </Route>

          {/* user area */}
          <Route path="/createpage" element={<CreatePage />} />
          <Route
            path="/mypages"
            element={
              <PublicLayout>
                <MyPages />
              </PublicLayout>
            }
          />

          <Route
            path="*"
            element={
              <PublicLayout>
                <NotFound />
              </PublicLayout>
            }
          />
        </Routes>
      </div>

      {joinServer && <JoinModal server={joinServer} onClose={() => setJoinServer(null)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </AuthProvider>
  );
}
