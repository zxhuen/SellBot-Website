"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductsNavbar } from "@/components/products/ProductsNavbar";
import { isAuthenticationError } from "@/lib/api-client";
import { getProductConversationHistory } from "@/lib/products";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function formatValue(value: unknown): string | null {
  if (value === null || value === undefined || typeof value === "object") {
    return null;
  }
  return String(value);
}

export default function ProductHistoryPage() {
  const [productId, setProductId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const id = new URLSearchParams(window.location.search).get("product_id");
      if (!id) {
        setError("A product ID was not provided.");
        setLoading(false);
        return;
      }
      setProductId(id);

      try {
        const result = await getProductConversationHistory(id);
        if (isMounted) {
          setConversations(result);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load conversations for this product.",
          );
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
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/products" className="text-sm font-medium text-[#145fcc] hover:underline">
          ← Back to products
        </Link>
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <header className="border-b border-slate-200 pb-5">
            <h1 className="text-3xl font-semibold tracking-[-0.05em]">Product Conversations</h1>
            <p className="mt-2 break-all text-sm text-slate-600">
              {productId ? `Product ID: ${productId}` : "Conversation history"}
            </p>
          </header>

          {loading ? (
            <p aria-live="polite" className="py-6 text-sm text-slate-600">Loading conversations…</p>
          ) : error ? (
            <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
              {requiresSignIn ? (
                <p className="mt-2">
                  <Link href="/Login" className="font-semibold underline underline-offset-2">
                    Sign in again
                  </Link>
                </p>
              ) : null}
            </div>
          ) : conversations.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h2 className="font-semibold">No conversations yet</h2>
              <p className="mt-2 text-sm text-slate-600">
                Customer conversations for this product will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {conversations.map((conversation, index) => {
                const fields = isRecord(conversation)
                  ? Object.entries(conversation)
                      .map(([key, value]) => [key, formatValue(value)] as const)
                      .filter((entry): entry is readonly [string, string] => entry[1] !== null)
                  : [["Conversation", formatValue(conversation) ?? "Details unavailable"] as const];
                const stableId = isRecord(conversation)
                  ? conversation.id ?? conversation.session_id ?? conversation.chat_session_id
                  : undefined;

                return (
                  <li
                    key={stableId === undefined ? index : String(stableId)}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <dl className="grid gap-3 sm:grid-cols-2">
                      {fields.map(([key, value]) => (
                        <div key={key} className="min-w-0">
                          <dt className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                            {key.replace(/_/g, " ")}
                          </dt>
                          <dd className="mt-1 break-words text-sm text-slate-900">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
