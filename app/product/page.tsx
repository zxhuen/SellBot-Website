"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductsNavbar } from "@/components/products/ProductsNavbar";
import { isAuthenticationError } from "@/lib/api-client";
import { getProductByPublicId, type Product } from "@/lib/products";

function formatPrice(value: Product["price"]) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `₱${numeric.toFixed(2)}` : String(value);
}

function getSafeContactUrl(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export default function ProductPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const contactUrl = getSafeContactUrl(product?.contact_link);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const publicId = new URLSearchParams(window.location.search).get("public_id");
      if (!publicId) {
        setError("A product ID was not provided.");
        setLoading(false);
        return;
      }

      try {
        const result = await getProductByPublicId(publicId);
        if (isMounted) {
          setProduct(result);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load this product.");
          setRequiresSignIn(isAuthenticationError(caughtError));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ProductsNavbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/products" className="text-sm font-medium text-[#145fcc] hover:underline">
          ← Back to products
        </Link>
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {loading ? (
            <p aria-live="polite" className="text-sm text-slate-600">Loading product…</p>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
              {requiresSignIn ? (
                <p className="mt-2">
                  <Link href="/Login" className="font-semibold underline underline-offset-2">
                    Sign in again
                  </Link>
                </p>
              ) : null}
            </div>
          ) : product ? (
            <>
              <p className="break-all text-xs font-medium uppercase tracking-[0.14em] text-slate-500">
                Public ID: {product.public_id ?? product.id}
              </p>
              <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
                <h1 className="text-3xl font-semibold tracking-[-0.04em]">{product.title ?? product.name}</h1>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                  {product.status ?? "available"}
                </span>
              </div>
              <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-600">
                {product.description || "No description provided."}
              </p>
              <p className="mt-6 text-2xl font-semibold">{formatPrice(product.price)}</p>
              {contactUrl ? (
                <a
                  href={contactUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex rounded-xl bg-[#145fcc] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#124da8]"
                >
                  Contact seller
                </a>
              ) : null}
            </>
          ) : null}
        </section>
      </main>
    </div>
  );
}
