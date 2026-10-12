import { useEffect, useState } from "react";

import { fetchProductAnalytics } from "@/lib/products";

type ProductAnalyticsModalProps = {
  productId: string | null;
  isOpen: boolean;
  onClose: () => void;
};

function formatAnalyticsValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "N/A";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatAnalyticsValue(item)).join(", ");
  }

  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nestedValue]) => `${key}: ${formatAnalyticsValue(nestedValue)}`)
      .join("; ");
  }

  return String(value);
}

export function ProductAnalyticsModal({ productId, isOpen, onClose }: ProductAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !productId) {
      const timeout = window.setTimeout(() => {
        setAnalytics(null);
        setError(null);
        setIsLoading(false);
      }, 0);

      return () => window.clearTimeout(timeout);
    }

    let isMounted = true;
    const activeProductId = productId;

    async function loadAnalytics() {
      if (!activeProductId) {
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchProductAnalytics(activeProductId);
        if (isMounted) {
          setAnalytics(data as Record<string, unknown>);
        }
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error ? caughtError.message : "Unable to load analytics for this product.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadAnalytics();

    return () => {
      isMounted = false;
    };
  }, [isOpen, productId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Chat Session Count</h2>
            <p className="mt-1 text-sm text-slate-500">Product ID: {productId ?? "Unknown"}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close analytics modal"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            ✕
          </button>
        </div>

        <div className="p-5">
          {isLoading ? (
            <div aria-live="polite" className="text-sm text-slate-600">Loading analytics…</div>
          ) : error ? (
            <div aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : analytics && Object.keys(analytics).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">{key}</dt>
                  <dd className="mt-2 text-sm text-slate-900">{formatAnalyticsValue(value)}</dd>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              No chat session data is available for this product yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
