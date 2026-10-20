"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { usePathname } from "next/navigation";

const sellerLinks = [
  { href: "/customer-chat", label: "Customer Chats" },
  { href: "/products", label: "Products" },
];

const buyerLinks = [
  { href: "/ChatHistory", label: "Chat History" },
];

const profileLink = { href: "/profile?return_to=/products", label: "Profile" };

export function ProductsNavbar() {
  return (
    <Suspense fallback={<NavbarContent pathname={null} />}>
      <NavbarWithPathname />
    </Suspense>
  );
}

function NavbarWithPathname() {
  return <NavbarContent pathname={usePathname()} />;
}

function NavbarContent({ pathname }: { pathname: string | null }) {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  function getLinkClass(isActive: boolean) {
    return [
      "inline-flex min-h-11 items-center rounded-full px-3 py-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900",
      isActive
        ? "bg-[#145fcc] text-white shadow-sm"
        : "hover:bg-slate-200/80 hover:text-slate-900",
    ].join(" ");
  }

  return (
    <nav
      aria-label="Main navigation"
      className="border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[72px] items-center justify-between gap-3 py-3">
        <Link href="/" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#145fcc] shadow-sm">
            <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 32 32">
              <path d="M7 10.5 16 5l9 5.5v10L16 26l-9-5.5v-10Z" fill="white" />
              <path d="m7 10.5 9 5.4 9-5.4M16 16v10" stroke="#145fcc" strokeWidth="2" />
              <path d="m11 8 9 5.5v3.2L11 11.2V8Z" fill="#BBD5FF" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-[-0.04em] text-slate-900">SellBot</span>
        </Link>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc] md:hidden"
          aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-main-navigation"
          onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
        >
          {isMobileMenuOpen ? (
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="m6 6 12 12M18 6 6 18" />
            </svg>
          ) : (
            <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>

        <div className="hidden flex-wrap items-center justify-end gap-3 md:flex">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Seller
            </span>
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-600">
              {sellerLinks.map(({ href, label }) => {
                const linkPath = href.split("?")[0];
                const isActive = pathname === linkPath;
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={getLinkClass(isActive)}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Buyer
            </span>
            <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-600">
              {buyerLinks.map(({ href, label }) => {
                const linkPath = href.split("?")[0];
                const isActive = pathname?.toLowerCase() === linkPath.toLowerCase();
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={getLinkClass(isActive)}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-600">
            <Link
              href={profileLink.href}
              aria-current={pathname === "/profile" ? "page" : undefined}
              className={getLinkClass(pathname === "/profile")}
            >
              {profileLink.label}
            </Link>
          </div>
        </div>

        </div>

        <div
          id="mobile-main-navigation"
          hidden={!isMobileMenuOpen}
          className="space-y-4 border-t border-slate-200 py-4 md:hidden"
        >
            <div>
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Seller
              </p>
              <div className="mt-1 flex flex-col">
                {sellerLinks.map(({ href, label }) => {
                  const isActive = pathname === href;
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={getLinkClass(isActive)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Buyer
              </p>
              <div className="mt-1 flex flex-col">
                {buyerLinks.map(({ href, label }) => {
                  const isActive = pathname?.toLowerCase() === href.toLowerCase();
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={isActive ? "page" : undefined}
                      className={getLinkClass(isActive)}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Account
              </p>
              <div className="mt-1 flex flex-col">
                <Link
                  href={profileLink.href}
                  aria-current={pathname === "/profile" ? "page" : undefined}
                  className={getLinkClass(pathname === "/profile")}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              </div>
            </div>
        </div>
      </div>
    </nav>
  );
}
