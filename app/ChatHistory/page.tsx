"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductsNavbar } from "@/components/products/ProductsNavbar";
import { authFetch, isAuthenticationError } from "@/lib/api-client";

interface BuyerChatSession {
  id: string;
  product: {
    title: string;
    price: string | number;
    public_id: string;
    owner: {
      id: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
  last_message_at: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseBuyerChatSessions(response: unknown): BuyerChatSession[] {
  if (!Array.isArray(response)) {
    throw new Error("The chat service returned invalid conversation data.");
  }

  return response.map((value, index): BuyerChatSession => {
    if (
      !isRecord(value) ||
      typeof value.id !== "string" ||
      typeof value.last_message_at !== "string" ||
      !isRecord(value.product) ||
      typeof value.product.title !== "string" ||
      (typeof value.product.price !== "string" && typeof value.product.price !== "number") ||
      typeof value.product.public_id !== "string" ||
      !isRecord(value.product.owner) ||
      typeof value.product.owner.id !== "string" ||
      typeof value.product.owner.display_name !== "string" ||
      (value.product.owner.avatar_url !== undefined &&
        typeof value.product.owner.avatar_url !== "string" &&
        value.product.owner.avatar_url !== null)
    ) {
      throw new Error(
        `The chat service returned invalid data for conversation ${index + 1}.`,
      );
    }

    return {
      id: value.id,
      product: {
        title: value.product.title,
        price: value.product.price,
        public_id: value.product.public_id,
        owner: {
          id: value.product.owner.id,
          display_name: value.product.owner.display_name,
          avatar_url:
            typeof value.product.owner.avatar_url === "string"
              ? value.product.owner.avatar_url
              : null,
        },
      },
      last_message_at: value.last_message_at,
    };
  });
}

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

export default function BuyerChatHistoryPage() {
  const [conversations, setConversations] = useState<BuyerChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void authFetch<unknown>("/Buyer/List-Chat-Sessions", { method: "GET" })
      .then(parseBuyerChatSessions)
      .then((result) => {
        if (isMounted) {
          setConversations(result);
        }
      })
      .catch((caughtError: unknown) => {
        if (isMounted) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "Unable to load your conversations.",
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
            <h1 className="text-3xl font-semibold tracking-[-0.05em]">Chat History</h1>
            <p className="mt-2 text-sm text-slate-600">Your conversations about products</p>
          </header>

          {loading ? (
            <p role="status" className="py-6 text-sm text-slate-600">
              Loading conversations…
            </p>
          ) : error ? (
            <div
              role="alert"
              className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
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
          ) : conversations.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h2 className="font-semibold">No conversations yet</h2>
              <p className="mt-2 text-sm text-slate-600">
                Your product conversations will appear here.
              </p>
            </div>
          ) : (
            <ul className="mt-5 space-y-3">
              {conversations.map((conversation) => {
                const avatarUrl = conversation.product.owner.avatar_url?.trim();
                const ownerName =
                  conversation.product.owner.display_name.trim() || "Product owner";

                return (
                  <li key={conversation.id}>
                    <Link
                      href={`/chat?public_id=${encodeURIComponent(conversation.product.public_id)}`}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#145fcc] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] sm:flex-row sm:items-center"
                      aria-label={`View conversation about ${conversation.product.title} with ${ownerName}`}
                    >
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={`${ownerName}'s avatar`}
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
                          {ownerName.charAt(0).toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">
                          {conversation.product.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Price: {conversation.product.price}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">Owner: {ownerName}</p>
                        <p className="mt-2 text-sm text-slate-500">
                          Last message:{" "}
                          <time dateTime={conversation.last_message_at}>
                            {formatMessageTime(conversation.last_message_at)}
                          </time>
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
