"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ProductsNavbar } from "@/components/products/ProductsNavbar";
import { isAuthenticationError } from "@/lib/api-client";
import { getUserProfile, type UserProfile } from "@/lib/profile";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void getUserProfile()
      .then((result) => {
        if (isMounted) {
          setProfile(result);
        }
      })
      .catch((caughtError: unknown) => {
        if (isMounted) {
          const authenticationError = isAuthenticationError(caughtError);
          setRequiresSignIn(authenticationError);
          setError(
            authenticationError
              ? "Your session has expired. Sign in again to view your profile."
              : caughtError instanceof Error
                ? caughtError.message
                : "Unable to load your profile right now.",
          );
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

  const avatarUrl = profile?.avatar_url.trim();
  const initial = profile?.display_name.trim().charAt(0).toUpperCase() || "?";
  const dailyLimit = profile?.subscription.daily_product_limit ?? 0;
  const productsCreatedToday = profile?.usage.products_created_today ?? 0;
  const dailyUsagePercent =
    dailyLimit > 0 ? Math.min(100, (productsCreatedToday / dailyLimit) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ProductsNavbar />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-[-0.05em]">Your profile</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account details, subscription, and product usage.
          </p>
        </header>

        {loading ? (
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p role="status" className="text-sm text-slate-600">Loading your profile…</p>
          </section>
        ) : error ? (
          <section
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
          >
            <p>{error}</p>
            {requiresSignIn ? (
              <Link
                href="/Login?next=%2Fprofile"
                className="mt-3 inline-block font-semibold underline underline-offset-2"
              >
                Sign in again
              </Link>
            ) : null}
          </section>
        ) : profile ? (
          <div className="space-y-5">
            <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={`${profile.display_name}'s profile`}
                  width={72}
                  height={72}
                  unoptimized
                  className="h-[72px] w-[72px] shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-blue-50 text-2xl font-semibold text-[#145fcc]"
                >
                  {initial}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold text-slate-900">
                  {profile.display_name}
                </h2>
                <p className="mt-1 break-all text-sm text-slate-600">{profile.email}</p>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Current subscription</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em]">
                    {profile.subscription.name}
                  </h2>
                </div>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc]"
                >
                  Manage subscription
                </button>
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <dt className="text-sm text-slate-600">Product limit</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {profile.subscription.max_products.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-slate-500">products</span>
                  </dd>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <dt className="text-sm text-slate-600">Daily product limit</dt>
                  <dd className="mt-1 text-lg font-semibold">
                    {profile.subscription.daily_product_limit.toLocaleString()}
                    <span className="ml-1 text-sm font-normal text-slate-500">per day</span>
                  </dd>
                </div>
              </dl>

              <div className="mt-5 rounded-2xl border border-slate-200 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="text-sm font-medium text-slate-700">Products created today</h3>
                  <p className="text-sm font-semibold text-slate-900">
                    {productsCreatedToday.toLocaleString()}
                    {dailyLimit > 0 ? (
                      <span className="font-normal text-slate-500">
                        {" "}/ {dailyLimit.toLocaleString()}
                      </span>
                    ) : null}
                  </p>
                </div>
                {dailyLimit > 0 ? (
                  <div
                    role="progressbar"
                    aria-label="Daily product usage"
                    aria-valuemin={0}
                    aria-valuemax={dailyLimit}
                    aria-valuenow={Math.min(productsCreatedToday, dailyLimit)}
                    className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className="h-full rounded-full bg-[#145fcc] transition-[width]"
                      style={{ width: `${dailyUsagePercent}%` }}
                    />
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
}
