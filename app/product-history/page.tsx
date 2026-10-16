"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

import { ProductsNavbar } from "@/components/products/ProductsNavbar";
import { isAuthenticationError } from "@/lib/api-client";
import { getProductChatMessages, type ChatSessionResponse } from "@/lib/products";

export default function ProductHistoryPage() {
  const [productId, setProductId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ChatSessionResponse[]>([]);
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
        const result = await getProductChatMessages(id);
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
            <p className="mt-2 text-sm text-slate-600">Recent messages from interested customers</p>
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
              {conversations.map((conversation) => {
                const messageDate = new Date(conversation.last_message_at);
                const readableDate = Number.isNaN(messageDate.getTime())
                  ? "Time unavailable"
                  : messageDate.toLocaleString(undefined, {
                      dateStyle: "long",
                      timeStyle: "short",
                    });
                const avatarUrl = conversation.user.avatar_url?.trim();
                return (
                  <li key={conversation.id}>
                    <Link
                      href={`/product-history/${encodeURIComponent(conversation.id)}?product_id=${encodeURIComponent(productId ?? "")}`}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#145fcc] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] sm:flex-row sm:items-center"
                      aria-label={`View conversation with ${conversation.user.display_name}`}
                    >
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={`${conversation.user.display_name}'s avatar`}
                          width={48}
                          height={48}
                          unoptimized
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-200 text-lg font-semibold text-slate-600"
                        >
                          {conversation.user.display_name.trim().charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {conversation.user.display_name}
                        </p>
                        <p className="mt-1 truncate text-sm text-slate-600">
                          {conversation.product.title} · {conversation.product.price}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Last message:{" "}
                          <time dateTime={conversation.last_message_at}>{readableDate}</time>
                        </p>
                      </div>
                    </Link>
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
