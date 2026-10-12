import Link from "next/link";

import type { Product } from "@/lib/products";

import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: Product[];
  searchTerm: string;
  loading: boolean;
  error: string | null;
  requiresSignIn: boolean;
  actions: Record<string, "delete" | "sold" | undefined>;
  actionErrors: Record<string, string | undefined>;
  actionRequiresSignIn: Record<string, boolean | undefined>;
  exitingProductIds: string[];
  onOpenAnalytics: (productId: string) => void;
  onDelete: (productId: string) => void;
  onMarkAsSold: (productId: string) => void;
  onRetry: () => void;
};

export function ProductGrid({
  products,
  searchTerm,
  loading,
  error,
  requiresSignIn,
  actions,
  actionErrors,
  actionRequiresSignIn,
  exitingProductIds,
  onOpenAnalytics,
  onDelete,
  onMarkAsSold,
  onRetry,
}: ProductGridProps) {
  if (loading) {
    return (
      <div aria-live="polite" aria-busy="true" className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            aria-hidden="true"
            className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm"
          >
            <div className="h-4 w-1/2 rounded bg-slate-200" />
            <div className="mt-5 h-5 w-3/4 rounded bg-slate-200" />
            <div className="mt-4 h-12 rounded bg-slate-200" />
            <div className="mt-5 h-9 rounded bg-slate-200" />
          </div>
        ))}
        <span className="sr-only">Loading products…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div aria-live="assertive" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
        {error}
        {requiresSignIn ? (
          <p className="mt-2">
            <Link href="/Login" className="font-semibold underline underline-offset-2">
              Sign in again
            </Link>
          </p>
        ) : null}
        {!requiresSignIn ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-lg border border-red-300 px-3 py-1.5 font-medium hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
          >
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleProducts = products.filter((product) => {
    const category = product.category;
    const haystack = [product.title ?? product.name, product.description, category]
      .filter((value): value is string => typeof value === "string")
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalizedSearch);
  });

  if (!visibleProducts.length && searchTerm.trim()) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">No matching products</h3>
        <p className="mt-2 text-sm text-slate-600">Try a different search term or clear your filters.</p>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">No products yet</h3>
        <p className="mt-2 text-sm text-slate-600">Create your first product to start selling.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {visibleProducts.map((product) => {
        const productId = String(product.id);
        return (
          <ProductCard
            key={productId}
            product={product}
            action={actions[productId] ?? null}
            actionError={actionErrors[productId] ?? null}
            actionRequiresSignIn={actionRequiresSignIn[productId] ?? false}
            isExiting={exitingProductIds.includes(productId)}
            onOpenAnalytics={onOpenAnalytics}
            onDelete={onDelete}
            onMarkAsSold={onMarkAsSold}
          />
        );
      })}
    </div>
  );
}
