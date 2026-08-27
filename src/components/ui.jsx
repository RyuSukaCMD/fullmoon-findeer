import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ---------------- Spinner ---------------- */
export function Spinner({ className = "h-5 w-5" }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M12 2a10 10 0 019.95 9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- Button ---------------- */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  children,
  disabled,
  ...props
}) {
  const variants = {
    primary:
      "bg-gradient-to-r from-fruit to-orange-400 text-ink shadow-[0_8px_24px_-8px_rgba(255,109,61,0.7)] hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-6px_rgba(255,109,61,0.9)]",
    ghost: "bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 hover:border-white/20",
    danger: "bg-rose-500/90 text-white hover:bg-rose-500",
    success: "bg-emerald-500/90 text-ink hover:bg-emerald-400",
    subtle: "bg-white/5 text-slate-300 hover:bg-white/10",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2.5 text-sm rounded-xl",
    lg: "px-6 py-3 text-sm rounded-xl",
  };
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 select-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.99] ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  );
}

/* ---------------- Form fields ---------------- */
export function Field({ label, hint, error, children }) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold text-slate-300">{label}</span>
      )}
      {children}
      {error && <span className="mt-1 block text-xs text-rose-400">{error}</span>}
      {hint && !error && <span className="mt-1 block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-moon/50 focus:ring-2 focus:ring-moon/20";

export function Input(props) {
  return <input {...props} className={`${inputBase} ${props.className || ""}`} />;
}
export function Textarea(props) {
  return <textarea {...props} className={`${inputBase} min-h-[90px] ${props.className || ""}`} />;
}
export function Select({ children, ...props }) {
  return (
    <select {...props} className={`${inputBase} appearance-none ${props.className || ""}`}>
      {children}
    </select>
  );
}

/* ---------------- Toggle (Switch Button) ---------------- */
export function Toggle({ checked = false, onChange, disabled = false, ariaLabel, className = "", id }) {
  const isChecked = Boolean(checked);

  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={isChecked}
      aria-label={ariaLabel || "Toggle switch"}
      disabled={disabled}
      onClick={() => {
        if (!disabled && onChange) {
          onChange(!isChecked);
        }
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-moon/50 focus:ring-offset-2 focus:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-50 ${
        isChecked ? "bg-moon" : "bg-slate-700 hover:bg-slate-600"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 rounded-full shadow-md ring-0 transition-transform duration-200 ease-in-out ${
          isChecked
            ? "translate-x-5 bg-ink"
            : "translate-x-0 bg-slate-200"
        }`}
      />
    </button>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({ tone = "neutral", children }) {
  const tones = {
    neutral: "bg-white/8 text-slate-300 border-white/10",
    moon: "bg-moon/10 text-moon border-moon/30",
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30",
    rose: "bg-rose-500/10 text-rose-300 border-rose-500/30",
    storm: "bg-storm/10 text-storm border-storm/30",
    fruit: "bg-fruit/10 text-orange-300 border-fruit/30",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const sizes = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className={`card relative w-full ${sizes[size]} max-h-[92dvh] overflow-hidden`}
            initial={{ scale: 0.95, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 12, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <h3 className="font-display text-xl text-white">{title}</h3>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="max-h-[calc(92dvh-120px)] overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="border-t border-white/10 px-5 py-4">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- Confirm dialog ---------------- */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger, loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
            Confirm
          </Button>
        </div>
      }
    >
      <p className="text-sm text-slate-300">{message}</p>
    </Modal>
  );
}

/* ---------------- Toast ---------------- */
const ToastCtx = createContext(null);
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  const value = {
    success: (m) => push(m, "success"),
    error: (m) => push(m, "error"),
    info: (m) => push(m, "info"),
  };
  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className={`pointer-events-auto rounded-xl border px-4 py-2.5 text-sm shadow-lg backdrop-blur ${
                t.tone === "success"
                  ? "border-emerald-500/30 bg-emerald-950/90 text-emerald-200"
                  : t.tone === "error"
                  ? "border-rose-500/30 bg-rose-950/90 text-rose-200"
                  : "border-white/10 bg-panel/95 text-slate-200"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
export function useToast() {
  return useContext(ToastCtx);
}

/* ---------------- Page states ---------------- */
export function EmptyState({ icon = "🌙", title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center">
      <span className="text-4xl">{icon}</span>
      <h4 className="mt-3 font-display text-xl text-white">{title}</h4>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function ErrorState({ title = "Something went wrong", message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-rose-500/20 bg-rose-500/5 px-6 py-16 text-center">
      <span className="text-4xl">⚠️</span>
      <h4 className="mt-3 font-display text-xl text-white">{title}</h4>
      {message && <p className="mt-1 max-w-sm text-sm text-slate-400">{message}</p>}
      {onRetry && (
        <Button variant="ghost" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* ---------------- Skeleton ---------------- */
export function Skeleton({ className = "" }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

/* ---------------- Stat card ---------------- */
export function StatCard({ icon, label, value, accent = "text-moon" }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-xl">{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-400">{label}</p>
        <p className={`font-display text-2xl ${accent}`}>{value}</p>
      </div>
    </div>
  );
}

/* ---------------- Relative time ---------------- */
export function useNow(interval = 20000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), interval);
    return () => clearInterval(id);
  }, [interval]);
  return now;
}
export function timeAgo(ts, now) {
  if (!ts) return "—";
  const diff = Math.max(0, (now || Date.now()) - ts);
  const s = Math.floor(diff / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
