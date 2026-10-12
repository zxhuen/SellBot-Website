import { useEffect, useState } from "react";
import Link from "next/link";

import { isAuthenticationError } from "@/lib/api-client";
import { getChatSessionCount } from "@/lib/products";
import { useModalAccessibility } from "@/lib/use-modal-accessibility";

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
      .map(([key, nestedValue]) => `${key.replace(/_/g, " ")}: ${formatAnalyticsValue(nestedValue)}`)
      .join("; ");
  }

  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function ProductAnalyticsModal({ productId, isOpen, onClose }: ProductAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const dialogRef = useModalAccessibility<HTMLDivElement>(isOpen, onClose);

  useEffect(() => {
    if (!isOpen || !productId) {
      const timeout = window.setTimeout(() => {
        setAnalytics(null);
        setError(null);
        setRequiresSignIn(false);
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
      setRequiresSignIn(false);

      try {
        const data = await getChatSessionCount(activeProductId);
        if (isMounted) {
          setAnalytics(data);
        }
      } catch (caughtError) {
        if (!isMounted) {
          return;
        }

        setError(
          caughtError instanceof Error ? caughtError.message : "Unable to load analytics for this product.",
        );
        setRequiresSignIn(isAuthenticationError(caughtError));
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

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-analytics-title"
        tabIndex={-1}
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="product-analytics-title" className="text-xl font-semibold text-slate-900">
              Product Analytics
            </h2>
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
              {requiresSignIn ? (
                <p className="mt-2">
                  <Link href="/Login" className="font-semibold underline underline-offset-2">
                    Sign in again
                  </Link>
                </p>
              ) : null}
            </div>
          ) : analytics !== null && analytics !== undefined ? (
            <div className="space-y-3">
              {isRecord(analytics) ? (
                Object.entries(analytics).map(([key, value]) => (
                  <div key={key} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
                      {key.replace(/_/g, " ")}
                    </dt>
                    <dd className="mt-2 text-sm text-slate-900">{formatAnalyticsValue(value)}</dd>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <dt className="text-xs font-medium uppercase tracking-[0.1em] text-slate-500">
                    Chat session count
                  </dt>
                  <dd className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatAnalyticsValue(analytics)}
                  </dd>
                </div>
              )}
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
