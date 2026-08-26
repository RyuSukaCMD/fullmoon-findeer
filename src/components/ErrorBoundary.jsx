import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error in React:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#050914] px-5 py-12 text-slate-100">
          <div className="card w-full max-w-md border border-white/10 bg-[#0e1730] p-8 text-center shadow-2xl">
            <span className="text-5xl">🌕</span>
            <h2 className="mt-4 font-display text-3xl text-moon">Something went wrong</h2>
            <p className="mt-2 text-sm text-slate-400">
              The application encountered an unexpected error, but we caught it before it could turn into a blank screen.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-3 text-left font-mono text-xs text-rose-300">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="btn-fruit mt-6 px-6 py-2.5 text-sm font-semibold"
            >
              Reload Website
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
