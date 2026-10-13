"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Product } from "@/lib/products";

type ProductCardProps = {
  product: Product;
  action: "delete" | "sold" | null;
  actionError: string | null;
  actionRequiresSignIn: boolean;
  isExiting: boolean;
  onOpenAnalytics: (productId: string) => void;
  onDelete: (productId: string) => void;
  onMarkAsSold: (productId: string) => void;
};

function formatPrice(value: Product["price"]) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `₱${numeric.toFixed(2)}` : String(value);
}

export function ProductCard({
  product,
  action,
  actionError,
  actionRequiresSignIn,
  isExiting,
  onOpenAnalytics,
  onDelete,
  onMarkAsSold,
}: ProductCardProps) {
  const [isExpanded, setExpanded] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [isConfirmingDelete, setConfirmingDelete] = useState(false);
  const copyTimeout = useRef<number | null>(null);
  const productId = String(product.id);
  const publicId = product.public_id == null ? "" : String(product.public_id).trim();
  const productLinkId = String(product.public_id ?? product.id);
  const isSold = String(product.status ?? "available").toLowerCase() === "sold";
  const status = isSold
    ? "Sold"
    : String(product.status ?? "available").replace(/^\w/, (char) => char.toUpperCase());

  useEffect(
    () => () => {
      if (copyTimeout.current !== null) {
        window.clearTimeout(copyTimeout.current);
      }
    },
    [],
  );

  async function copyProductLink() {
    try {
      const productUrl = new URL(
        `/product?public_id=${encodeURIComponent(productLinkId)}`,
        window.location.origin,
      ).toString();
      await navigator.clipboard.writeText(productUrl);
      setCopyState("copied");
      if (copyTimeout.current !== null) {
        window.clearTimeout(copyTimeout.current);
      }
      copyTimeout.current = window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
    }
  }

  return (
    <article
      className={[
        "group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
        isExiting ? "pointer-events-none scale-95 opacity-0" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
            Public ID: {publicId || "N/A"}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-slate-900">{product.title ?? product.name}</h2>
        </div>
        <span
          className={[
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
            isSold ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {status}
        </span>
      </div>

      <p className={["mt-3 text-sm leading-6 text-slate-600", isExpanded ? "" : "line-clamp-3"].join(" ")}>
        {product.description || "No description provided."}
      </p>
      {product.description.length > 130 ? (
        <button
          type="button"
          className="mt-1 self-start text-xs font-medium text-[#145fcc] hover:underline"
          aria-expanded={isExpanded}
          onClick={() => setExpanded((expanded) => !expanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>
      ) : null}

      <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
        <span className="text-slate-500">Price</span>
        <span className="font-semibold text-slate-900">{formatPrice(product.price)}</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 pt-2">
        {publicId ? (
          <Link
            href={`/chat?public_id=${encodeURIComponent(publicId)}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc]"
          >
            Open
          </Link>
        ) : (
          <button
            type="button"
            disabled
            title="This product does not have a public ID."
            className="inline-flex cursor-not-allowed items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-400"
          >
            Open
          </button>
        )}
        <button
          type="button"
          onClick={() => onOpenAnalytics(productId)}
          className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          View Count
        </button>
        <Link
          href={`/product-history?product_id=${encodeURIComponent(productId)}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc]"
        >
          Conversations
        </Link>
        <button
          type="button"
          onClick={() => void copyProductLink()}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc]"
        >
          {copyState === "copied" ? "Copied!" : copyState === "error" ? "Copy failed" : "Copy Link"}
        </button>
        <button
          type="button"
          disabled={Boolean(action) || isSold}
          onClick={() => onMarkAsSold(productId)}
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {action === "sold" ? "Marking sold..." : isSold ? "Sold" : "Mark as Sold"}
        </button>
        {isConfirmingDelete ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-xs text-slate-600">Delete this product?</span>
            <button
              type="button"
              disabled={Boolean(action)}
              onClick={() => onDelete(productId)}
              className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {action === "delete" ? "Deleting..." : "Confirm"}
            </button>
            <button
              type="button"
              disabled={Boolean(action)}
              onClick={() => setConfirmingDelete(false)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            type="button"
            disabled={Boolean(action)}
            onClick={() => setConfirmingDelete(true)}
            className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Delete
          </button>
        )}
      </div>

      {actionError ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {actionError}
          {actionRequiresSignIn ? (
            <>
              {" "}
              <Link href="/Login" className="font-semibold underline underline-offset-2">
                Sign in again
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </article>
  );
}
