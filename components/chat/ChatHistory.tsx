"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductsNavbar } from "@/components/products/ProductsNavbar";
import { isAuthenticationError } from "@/lib/api-client";
import { loadProductChatMessages, type ChatMessage } from "@/lib/chat";

function formatMessageTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Time unavailable";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function ChatHistory({
  chatSessionId,
  productId,
}: {
  chatSessionId: string;
  productId: string | null;
}) {
  const backHref = productId
    ? `/product-history?product_id=${encodeURIComponent(productId)}`
    : "/products";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void loadProductChatMessages(chatSessionId)
      .then((result) => {
        if (isMounted) {
          setMessages(result);
        }
      })
      .catch((caughtError: unknown) => {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load messages for this conversation.",
          );
          setRequiresSignIn(isAuthenticationError(caughtError));
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [chatSessionId]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ProductsNavbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href={backHref} className="text-sm font-medium text-[#145fcc] hover:underline">
          ← Back to conversations
        </Link>
        <section className="mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-5 sm:px-7">
            <h1 className="text-2xl font-semibold tracking-[-0.04em]">Conversation messages</h1>
            <p className="mt-1 text-sm text-slate-600">Messages between the buyer and SellBot</p>
          </header>

          {loading ? (
            <p role="status" className="px-5 py-8 text-sm text-slate-600 sm:px-7">
              Loading messages…
            </p>
          ) : error ? (
            <div
              role="alert"
              className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:m-7"
            >
              {error}
              {requiresSignIn ? (
                <p className="mt-2">
                  <Link href="/Login" className="font-semibold underline underline-offset-2">
                    Sign in again
                  </Link>
                </p>
              ) : null}
            </div>
          ) : messages.length === 0 ? (
            <p className="px-5 py-8 text-sm text-slate-600 sm:px-7">
              There are no messages in this conversation yet.
            </p>
          ) : (
            <ol
              aria-label="Conversation messages"
              className="space-y-4 bg-slate-50/70 px-4 py-5 sm:px-7"
            >
              {messages.map((message) => {
                const isBuyer = message.role.toLowerCase() === "user";
                const label = isBuyer
                  ? "Buyer"
                  : message.role.toLowerCase() === "assistant"
                    ? "Luna"
                    : message.role;

                return (
                  <li key={message.id} className={`flex ${isBuyer ? "justify-start" : "justify-end"}`}>
                    <article
                      aria-label={`${label} message`}
                      className={[
                        "max-w-[min(88%,42rem)] rounded-2xl px-4 py-3 shadow-sm",
                        isBuyer
                          ? "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                          : "rounded-br-md bg-[#145fcc] text-white",
                      ].join(" ")}
                    >
                      <p
                        className={`mb-1 text-xs font-semibold ${
                          isBuyer ? "text-[#145fcc]" : "text-blue-100"
                        }`}
                      >
                        {label}
                      </p>
                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {message.content}
                      </p>
                      <time
                        dateTime={message.created_at}
                        className={`mt-2 block text-right text-xs ${
                          isBuyer ? "text-slate-500" : "text-blue-100"
                        }`}
                      >
                        {formatMessageTime(message.created_at)}
                      </time>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>
    </div>
  );
}
