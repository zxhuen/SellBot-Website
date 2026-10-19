"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { isAuthenticationError } from "@/lib/api-client";
import { supabase } from "@/lib/supabase/client";
import {
  CUSTOMER_CHAT_PAGE_SIZE,
  getCustomerChatSessions,
  type ChatSessionResponse,
} from "@/lib/products";

type ListError = {
  message: string;
  requiresSignIn: boolean;
};

function formatPrice(value: string | number): string {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? `₱${numeric.toFixed(2)}` : String(value);
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

export function CustomerChatList() {
  const [offset, setOffset] = useState(0);
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ListError | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [authRevision, setAuthRevision] = useState(0);
  const authRevisionRef = useRef(0);
  const cachedPages = useRef(new Map<number, ChatSessionResponse[]>());
  const pendingPages = useRef(new Map<number, Promise<ChatSessionResponse[]>>());

  const getPage = useCallback((pageOffset: number) => {
    const cached = cachedPages.current.get(pageOffset);
    if (cached) {
      return Promise.resolve(cached);
    }

    const pending = pendingPages.current.get(pageOffset);
    if (pending) {
      return pending;
    }

    const requestRevision = authRevisionRef.current;
    const request = getCustomerChatSessions(pageOffset)
      .then((result) => {
        if (requestRevision === authRevisionRef.current) {
          cachedPages.current.set(pageOffset, result);
        }
        return result;
      })
      .finally(() => {
        if (pendingPages.current.get(pageOffset) === request) {
          pendingPages.current.delete(pageOffset);
        }
      });

    pendingPages.current.set(pageOffset, request);
    return request;
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") {
        return;
      }

      authRevisionRef.current += 1;
      cachedPages.current.clear();
      pendingPages.current.clear();
      setSessions([]);
      setError(null);
      setHasNextPage(false);
      setOffset(0);
      setAuthRevision(authRevisionRef.current);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let isCurrent = true;
    const requestRevision = authRevisionRef.current;

    async function loadPage() {
      setLoading(true);
      setError(null);
      setHasNextPage(false);

      try {
        const page = await getPage(offset);
        if (!isCurrent || requestRevision !== authRevisionRef.current) {
          return;
        }

        setSessions(page);
        if (page.length === CUSTOMER_CHAT_PAGE_SIZE) {
          const nextPage = await getPage(offset + CUSTOMER_CHAT_PAGE_SIZE);
          if (!isCurrent || requestRevision !== authRevisionRef.current) {
            return;
          }
          setHasNextPage(nextPage.length > 0);
        }
      } catch (caughtError) {
        if (isCurrent && requestRevision === authRevisionRef.current) {
          const requiresSignIn = isAuthenticationError(caughtError);
          setError({
            message: requiresSignIn
              ? "Your session has expired. Sign in again to view customer conversations."
              : "We couldn't load customer conversations. Please try again.",
            requiresSignIn,
          });
        }
      } finally {
        if (isCurrent && requestRevision === authRevisionRef.current) {
          setLoading(false);
        }
      }
    }

    void loadPage();
    return () => {
      isCurrent = false;
    };
  }, [authRevision, getPage, offset, retryCount]);

  function navigateToPage(nextOffset: number) {
    setSessions([]);
    setError(null);
    setHasNextPage(false);
    setOffset(nextOffset);
  }

  return (
    <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-semibold tracking-[-0.05em]">Customer conversations</h1>
        <p className="mt-2 text-sm text-slate-600">
          Recent chats about the products you sell.
        </p>
      </header>

      {loading ? (
        <p role="status" className="py-6 text-sm text-slate-600">
          Loading customer conversations…
        </p>
      ) : error ? (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <p>{error.message}</p>
          {error.requiresSignIn ? (
            <Link
              href="/Login?next=%2Fcustomer-chat"
              className="mt-2 inline-block font-semibold underline underline-offset-2"
            >
              Sign in again
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="mt-3 rounded-lg bg-red-700 px-3 py-2 font-semibold text-white hover:bg-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            >
              Try again
            </button>
          )}
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h2 className="font-semibold">
            {offset === 0 ? "No customer conversations yet." : "No conversations on this page."}
          </h2>
          {offset === 0 ? (
            <p className="mt-2 text-sm text-slate-600">
              Customer chats about your products will appear here.
            </p>
          ) : null}
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {sessions.map((session) => {
            const avatarUrl = session.user.avatar_url?.trim();
            const customerName = session.user.display_name.trim() || "Customer";

            return (
              <li key={session.id}>
                <Link
                  href={`/product-history/${encodeURIComponent(session.id)}`}
                  aria-label={`View conversation with ${customerName} about ${session.product.title}`}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#145fcc] hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] sm:flex-row sm:items-center"
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={`${customerName}'s avatar`}
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
                      {customerName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words font-semibold text-slate-900 [overflow-wrap:anywhere]">
                      {customerName}
                    </p>
                    <p className="mt-1 break-words text-sm font-medium text-slate-700 [overflow-wrap:anywhere]">
                      {session.product.title}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Price: {formatPrice(session.product.price)}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Last message:{" "}
                      <time dateTime={session.last_message_at}>
                        {formatMessageTime(session.last_message_at)}
                      </time>
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {sessions.length > 0 || offset > 0 ? (
        <nav
          aria-label="Customer conversation pages"
          className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-4"
        >
          <button
            type="button"
            disabled={loading || offset === 0}
            onClick={() => navigateToPage(Math.max(0, offset - CUSTOMER_CHAT_PAGE_SIZE))}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500">
            Page {Math.floor(offset / CUSTOMER_CHAT_PAGE_SIZE) + 1}
          </span>
          <button
            type="button"
            disabled={loading || Boolean(error) || !hasNextPage}
            onClick={() => navigateToPage(offset + CUSTOMER_CHAT_PAGE_SIZE)}
            className="rounded-lg bg-[#145fcc] px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      ) : null}
    </section>
  );
}
