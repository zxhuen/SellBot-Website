"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { supabase } from "@/lib/supabase/client";
import { getUserInitial } from "@/lib/user-initial";

const menuLinks = [
  { href: "/customer-chat", label: "Chats" },
  { href: "/products", label: "Products" },
  { href: "/ChatHistory", label: "History" },
];

type NavbarProps = { userName?: string };

export function ProductsNavbar({ userName }: NavbarProps = {}) {
  return (
    <Suspense fallback={<NavbarContent pathname={null} userName={userName} />}>
      <NavbarWithPathname userName={userName} />
    </Suspense>
  );
}

function NavbarWithPathname({ userName }: NavbarProps) {
  return <NavbarContent pathname={usePathname()} userName={userName} />;
}

function NavbarContent({ pathname, userName }: NavbarProps & { pathname: string | null }) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authInitial, setAuthInitial] = useState("?");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAuthInitial(getUserInitial(
        user?.user_metadata?.display_name,
        user?.user_metadata?.full_name,
        user?.user_metadata?.name,
        user?.email,
      ));
    });

    return () => subscription.unsubscribe();
  }, []);

  const userInitial = userName?.trim() ? getUserInitial(userName) : authInitial;
  const isProfileActive = pathname === "/profile";

  return (
    <nav
      aria-label="Main navigation"
      className="border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div className="mx-auto flex min-h-[72px] max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="mr-auto inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#145fcc] shadow-sm">
            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 32 32">
              <path d="M7 10.5 16 5l9 5.5v10L16 26l-9-5.5v-10Z" fill="white" />
              <path d="m7 10.5 9 5.4 9-5.4M16 16v10" stroke="#145fcc" strokeWidth="2" />
              <path d="m11 8 9 5.5v3.2L11 11.2V8Z" fill="#BBD5FF" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-[-0.04em] text-slate-900">SellBot</span>
        </Link>

        <div
          id="main-navigation-links"
          className={`${isMobileMenuOpen ? "flex" : "hidden"} order-last w-full flex-col gap-1 border-t border-slate-200 pt-3 text-sm font-medium text-slate-600 md:order-none md:flex md:w-auto md:flex-row md:items-center md:gap-2 md:rounded-full md:border md:bg-slate-50 md:p-1`}
        >
          {menuLinks.map(({ href, label }) => {
            const isActive = pathname?.toLowerCase() === href.toLowerCase();
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-4 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] ${isActive ? "bg-[#145fcc] text-white shadow-sm" : "hover:bg-slate-200/80 hover:text-slate-900"}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </div>

        <Link
          href="/profile?return_to=/products"
          aria-label="Your profile"
          title="Your profile"
          aria-current={isProfileActive ? "page" : undefined}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] ${isProfileActive ? "bg-[#145fcc] text-white shadow-sm" : "bg-blue-50 text-[#145fcc] hover:bg-blue-100"}`}
          onClick={() => setMobileMenuOpen(false)}
        >
          <span aria-hidden="true">{userInitial}</span>
        </Link>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] md:hidden"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="main-navigation-links"
          onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
        >
          <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d={isMobileMenuOpen ? "m6 6 12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"} />
          </svg>
        </button>
      </div>
    </nav>
  );
}
