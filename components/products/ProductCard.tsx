import Link from "next/link";

import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  onOpenAnalytics: (productId: string) => void;
};

function formatPrice(value: Product["price"]) {
  const numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric);
}

export function ProductCard({ product, onOpenAnalytics }: ProductCardProps) {
  const productId = product.public_id ?? product.id;
  const status = String(product.status ?? "active").replace(/^\w/, (char) => char.toUpperCase());

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">{productId}</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{product.name}</h3>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          {status}
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600 line-clamp-3">{product.description}</p>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-500">Price</span>
        <span className="font-semibold text-slate-900">{formatPrice(product.price)}</span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <dt className="text-xs uppercase tracking-[0.08em] text-slate-500">Views</dt>
          <dd className="mt-1 text-base font-semibold text-slate-900">
            {Number(product.view_count ?? 0).toLocaleString()}
          </dd>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <dt className="text-xs uppercase tracking-[0.08em] text-slate-500">Contact</dt>
          <dd className="mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-base font-medium text-slate-900">
            {product.contact_link ? "Linked" : "N/A"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2 pt-2">
        {product.contact_link ? (
          <Link
            href={product.contact_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
          >
            View Product
          </Link>
        ) : null}

        <button
          type="button"
          onClick={() => onOpenAnalytics(String(product.id))}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          Analytics
        </button>
      </div>
    </article>
  );
}
