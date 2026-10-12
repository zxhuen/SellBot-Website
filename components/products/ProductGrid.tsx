import type { Product } from "@/lib/products";

import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: Product[];
  searchTerm: string;
  loading: boolean;
  error: string | null;
  onOpenAnalytics: (productId: string) => void;
};

export function ProductGrid({ products, searchTerm, loading, error, onOpenAnalytics }: ProductGridProps) {
  if (loading) {
    return (
      <div aria-live="polite" className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading products...
      </div>
    );
  }

  if (error) {
    return (
      <div aria-live="assertive" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
        {error}
      </div>
    );
  }

  const visibleProducts = products.filter((product) => {
    const haystack = [
      product.name,
      product.description,
      product.public_id,
      product.status,
      product.contact_link,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(searchTerm.trim().toLowerCase());
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
      {visibleProducts.map((product) => (
        <ProductCard key={String(product.id)} product={product} onOpenAnalytics={onOpenAnalytics} />
      ))}
    </div>
  );
}
