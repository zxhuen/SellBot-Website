"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

import { ProductsNavbar } from "@/components/products/ProductsNavbar";
import { ApiRequestError, isAuthenticationError } from "@/lib/api-client";
import { loadChatSession, sendLunaMessage, type ChatMessage } from "@/lib/chat";

function getRequestErrorMessage(error: unknown, action: "load" | "send") {
  if (error instanceof ApiRequestError) {
    if (error.status === 404) {
      return "This product could not be found or is no longer available.";
    }
    if (error.status === 422) {
      return "The request was not accepted. Check the message and try again.";
    }
    if (error.status === 429) {
      return "Luna is receiving too many requests. Please wait a little while and try again.";
    }
    return action === "load"
      ? "Unable to load this conversation right now. Please try again."
      : "Luna could not respond right now. Please try again.";
  }

  if (error instanceof TypeError) {
    return "We could not reach SellBot. Check your internet connection and try again.";
  }

  return action === "load"
    ? "Unable to load this conversation right now. Please try again."
    : "Luna could not respond right now. Please try again.";
}

export function ChatExperience() {
  const searchParams = useSearchParams();
  const publicId = searchParams.get("public_id")?.trim() || null;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(publicId !== null);
  const [isSending, setIsSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(
    publicId ? null : "A product ID was not provided. Return to products and open a product chat.",
  );
  const [sendError, setSendError] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const mounted = useRef(false);
  const sending = useRef(false);
  const messageSequence = useRef(0);
  const historyEnd = useRef<HTMLDivElement>(null);

  const handleLoadSuccess = useCallback((history: ChatMessage[]) => {
    if (mounted.current) {
      setMessages(history);
    }
  }, []);

  const handleLoadFailure = useCallback((error: unknown) => {
    if (mounted.current) {
      const authenticationError = isAuthenticationError(error);
      setLoadError(
        authenticationError
          ? "Your session is missing or has expired. Sign in to load this conversation."
          : getRequestErrorMessage(error, "load"),
      );
      setRequiresSignIn(authenticationError);
    }
  }, []);

  const finishLoading = useCallback(() => {
    if (mounted.current) {
      setIsLoading(false);
    }
  }, []);

  const loadConversation = useCallback((id: string) => {
    setIsLoading(true);
    setLoadError(null);
    setRequiresSignIn(false);
    void loadChatSession(id)
      .then(handleLoadSuccess)
      .catch(handleLoadFailure)
      .finally(finishLoading);
  }, [finishLoading, handleLoadFailure, handleLoadSuccess]);

  useEffect(() => {
    mounted.current = true;
    if (publicId) {
      void loadChatSession(publicId)
        .then(handleLoadSuccess)
        .catch(handleLoadFailure)
        .finally(finishLoading);
    }

    return () => {
      mounted.current = false;
    };
  }, [finishLoading, handleLoadFailure, handleLoadSuccess, publicId]);

  useEffect(() => {
    historyEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isLoading, isSending]);

  const chatPath = publicId ? `/chat?public_id=${encodeURIComponent(publicId)}` : "/chat";
  const loginHref = `/Login?next=${encodeURIComponent(chatPath)}`;

  async function handleSend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();

    if (!publicId || !message || message.length > 500 || sending.current || isLoading) {
      if (!message && input.length > 0) {
        setSendError("Enter a message before sending.");
      }
      return;
    }

    sending.current = true;
    setIsSending(true);
    setSendError(null);
    setRequiresSignIn(false);

    const createdAt = new Date().toISOString();
    const optimisticId = `pending-${Date.now()}-${messageSequence.current++}`;
    setMessages((current) => [
      ...current,
      {
        id: optimisticId,
        role: "user",
        content: message,
        created_at: createdAt,
      },
    ]);

    try {
      const response = await sendLunaMessage(publicId, message);
      setMessages((current) => [
        ...current,
        {
          id: `luna-${Date.now()}-${messageSequence.current++}`,
          role: "assistant",
          content: response,
          created_at: new Date().toISOString(),
        },
      ]);
      setInput("");
    } catch (error) {
      setMessages((current) => current.filter(({ id }) => id !== optimisticId));
      const authenticationError = isAuthenticationError(error);
      setSendError(
        authenticationError
          ? "Your session is missing or has expired. Sign in to send a message."
          : getRequestErrorMessage(error, "send"),
      );
      setRequiresSignIn(authenticationError);
    } finally {
      sending.current = false;
      setIsSending(false);
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ProductsNavbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <Link href="/products" className="text-sm font-medium text-[#145fcc] hover:underline">
          ← Back to products
        </Link>

        <section className="mt-5 flex min-h-[min(760px,calc(100svh-180px))] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-200 px-5 py-4 sm:px-7">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#145fcc]">
              SellBot assistant
            </p>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h1 className="text-2xl font-semibold tracking-[-0.04em]">Chat with Luna</h1>
              <p className="break-all text-sm text-slate-500">
                {publicId ? `Product ${publicId}` : "Product chat"}
              </p>
            </div>
          </header>

          {loadError ? (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:m-7">
              <p role="alert">{loadError}</p>
              {requiresSignIn ? (
                <Link href={loginHref} className="mt-2 inline-block font-semibold underline underline-offset-2">
                  Sign in again
                </Link>
              ) : publicId ? (
                <button
                  type="button"
                  onClick={() => void loadConversation(publicId)}
                  className="mt-3 rounded-lg border border-red-300 bg-white px-3 py-2 font-medium text-red-800 hover:bg-red-100"
                >
                  Retry
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div
                aria-label="Conversation history"
                aria-live="polite"
                className="min-h-72 flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-4 py-5 sm:px-7"
              >
                {isLoading ? (
                  <p role="status" className="py-8 text-center text-sm text-slate-500">
                    Starting your conversation with Luna…
                  </p>
                ) : messages.length === 0 ? (
                  <div className="mx-auto max-w-md py-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-[#145fcc]">
                      L
                    </div>
                    <h2 className="mt-4 font-semibold text-slate-900">Start a conversation with Luna</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Ask a question about this product to get started.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isUser = message.role.toLowerCase() === "user";
                    const timestamp = new Date(message.created_at);

                    return (
                      <article
                        key={message.id}
                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                        aria-label={isUser ? "Your message" : "Luna's message"}
                      >
                        <div
                          className={[
                            "max-w-[min(88%,42rem)] rounded-2xl px-4 py-3 shadow-sm",
                            isUser
                              ? "rounded-br-md bg-[#145fcc] text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-800",
                          ].join(" ")}
                        >
                          <p className={`mb-1 text-xs font-semibold ${isUser ? "text-blue-100" : "text-[#145fcc]"}`}>
                            {isUser ? "You" : "Luna"}
                          </p>
                          <p className="whitespace-pre-wrap break-words text-sm leading-6">
                            {message.content}
                          </p>
                          {!Number.isNaN(timestamp.getTime()) ? (
                            <time
                              dateTime={message.created_at}
                              className={`mt-2 block text-right text-[11px] ${isUser ? "text-blue-100" : "text-slate-400"}`}
                            >
                              {timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </time>
                          ) : null}
                        </div>
                      </article>
                    );
                  })
                )}

                {isSending ? (
                  <div className="flex justify-start">
                    <p role="status" className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                      Luna is thinking…
                    </p>
                  </div>
                ) : null}
                <div ref={historyEnd} />
              </div>

              <form onSubmit={(event) => void handleSend(event)} className="border-t border-slate-200 bg-white p-4 sm:p-5">
                {sendError ? (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    <p role="alert">{sendError}</p>
                    {requiresSignIn ? (
                      <Link href={loginHref} className="font-semibold underline underline-offset-2">
                        Sign in again
                      </Link>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex items-end gap-3">
                  <label htmlFor="chat-message" className="sr-only">
                    Message Luna
                  </label>
                  <textarea
                    id="chat-message"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder="Ask Luna about this product…"
                    rows={2}
                    maxLength={500}
                    disabled={!publicId || isLoading || isSending}
                    className="min-h-12 flex-1 resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm leading-6 outline-none transition focus:border-[#145fcc] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={!publicId || isLoading || isSending || !input.trim()}
                    className="inline-flex h-12 shrink-0 items-center justify-center rounded-xl bg-[#145fcc] px-5 text-sm font-semibold text-white transition hover:bg-[#124da8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] disabled:cursor-not-allowed disabled:opacity-50"
                    aria-busy={isSending}
                  >
                    {isSending ? "Sending…" : "Send"}
                  </button>
                </div>
                <p className="mt-2 text-right text-xs text-slate-400">{input.length}/500 · Enter to send, Shift+Enter for a new line</p>
              </form>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
