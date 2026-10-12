"use client";

import { useEffect } from "react";

import { supabase } from "@/lib/supabase/client";

function getSafeNextPath(rawNext: string | null) {
  if (!rawNext || !rawNext.startsWith("/") || rawNext.startsWith("//")) {
    return "/products";
  }

  try {
    const destination = new URL(rawNext, window.location.origin);

    if (
      destination.origin !== window.location.origin ||
      destination.pathname === "/auth/callback" ||
      destination.pathname.toLowerCase() === "/login"
    ) {
      return "/products";
    }

    return `${destination.pathname}${destination.search}`;
  } catch {
    return "/products";
  }
}

export default function AuthCallbackPage() {
  useEffect(() => {
    let isMounted = true;

    async function completeSignIn() {
      const { data, error } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      // Remove any OAuth credentials left in the fragment before navigating away.
      window.history.replaceState(null, "", window.location.pathname + window.location.search);

      if (error || !data.session) {
        const loginUrl = new URL("/Login", window.location.origin);
        loginUrl.searchParams.set(
          "error",
          "Google sign-in could not be completed. Please try again.",
        );
        window.location.replace(loginUrl.toString());
        return;
      }

      const nextPath = getSafeNextPath(new URLSearchParams(window.location.search).get("next"));
      window.location.replace(nextPath);
    }

    void completeSignIn().catch(() => {
      if (!isMounted) {
        return;
      }

      const loginUrl = new URL("/Login", window.location.origin);
      loginUrl.searchParams.set(
        "error",
        "Google sign-in could not be completed. Please try again.",
      );
      window.location.replace(loginUrl.toString());
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm text-slate-700"
    >
      Completing Google sign-in…
    </main>
  );
}
