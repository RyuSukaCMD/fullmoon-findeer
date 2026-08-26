import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { PageForm } from "../components/PageForm";
import { EmptyState, useToast } from "../components/ui";
import { api } from "../services/api";
import { useAuth } from "../auth/AuthContext";

export function CreatePage() {
  const { user, loading, hasPermission } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (!user) return <Navigate to="/starnova" replace />;
  if (!hasPermission("CREATE_PAGE")) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-16">
        <EmptyState icon="🔒" title="No access" message="Your account doesn't have permission to create pages." />
      </div>
    );
  }

  const submit = async (form) => {
    setSubmitting(true);
    try {
      await api.pages.create(form);
      toast.success("Page created!");
      navigate(`/u/${form.slug.trim().toLowerCase()}`, { replace: true });
    } catch (e) {
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <h1 className="font-display text-4xl text-white">Create page</h1>
      <p className="mt-1 mb-8 text-sm text-slate-400">
        Build a fully customizable page. Everything you set here is applied and
        persisted, and shown at its custom URL.
      </p>
      <PageForm submitLabel="Create page" onSubmit={submit} submitting={submitting} />
    </div>
  );
}
