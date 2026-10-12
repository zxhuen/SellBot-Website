import Link from "next/link";

const sellerLinks = [
  { href: "/customer-chats", label: "Customer Chats" },
  { href: "/products", label: "Products" },
];

const buyerLinks = [
  { href: "/buyer-history", label: "Chat History" },
  { href: "/profile?return_to=/products", label: "Profile" },
];

export function ProductsNavbar() {
  return (
    <nav
      aria-label="Main navigation"
      className="border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-600">
            {sellerLinks.map(({ href, label }) => {
              const isActive = href === "/products";
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "rounded-full px-3 py-2 transition-colors",
                    isActive
                      ? "bg-[#145fcc] text-white shadow-sm"
                      : "hover:bg-slate-200/80 hover:text-slate-900",
                  ].join(" ")}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 text-sm font-medium text-slate-600">
            {buyerLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full px-3 py-2 transition-colors hover:bg-slate-200/80 hover:text-slate-900"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
