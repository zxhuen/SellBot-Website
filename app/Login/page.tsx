import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign in to SellBot",
  description: "Sign in to SellBot, your AI-powered selling assistant.",
};

const benefits = [
  "AI-powered customer conversations",
  "Helpful answers, available 24/7",
  "Share your products with a simple link",
];

function BrandMark() {
  return (
    <svg
      aria-hidden="true"
      className="h-7 w-7"
      fill="none"
      viewBox="0 0 32 32"
    >
      <path d="M7 10.5 16 5l9 5.5v10L16 26l-9-5.5v-10Z" fill="white" />
      <path d="m7 10.5 9 5.4 9-5.4M16 16v10" stroke="#145fcc" strokeWidth="2" />
      <path d="m11 8 9 5.5v3.2L11 11.2V8Z" fill="#BBD5FF" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--login-blue-soft)] text-[var(--login-blue)]"
    >
      <svg fill="none" height="14" viewBox="0 0 16 16" width="14">
        <path
          d="m3.5 8.2 2.8 2.7 6.2-6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      </svg>
    </span>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" height="20" viewBox="0 0 48 48" width="20">
      <path
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.7c3.9-3.6 6-8.8 6-14.9Z"
        fill="#4285F4"
      />
      <path
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5c-1.8 1.2-4 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.1A20 20 0 0 0 24 44Z"
        fill="#34A853"
      />
      <path
        d="M12.8 27.9a12 12 0 0 1 0-7.8V15H5.9a20 20 0 0 0 0 18l6.9-5.1Z"
        fill="#FBBC05"
      />
      <path
        d="M24 11.9c3 0 5.7 1 7.8 3.1l5.8-5.8A19.4 19.4 0 0 0 24 4 20 20 0 0 0 5.9 15l6.9 5.1c1.6-4.7 6-8.2 11.2-8.2Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function BenefitItem({ children }: { children: string }) {
  return (
    <li className="flex items-center gap-3 text-[15px] leading-6 text-[var(--login-secondary)]">
      <CheckIcon />
      <span>{children}</span>
    </li>
  );
}

function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="max-w-xl">
      <p className="mb-5 text-xs font-semibold tracking-[0.16em] text-[var(--login-blue)]">
        YOUR AI SELLING ASSISTANT
      </p>
      <h1
        className="max-w-lg text-[clamp(2.75rem,5vw,4.25rem)] leading-[1.06] font-semibold tracking-[-0.055em]"
        id="hero-title"
      >
        Sell smarter
        <br className="hidden sm:block" /> with AI.
      </h1>
      <p className="mt-6 max-w-lg text-base leading-7 text-[var(--login-secondary)] sm:text-lg sm:leading-8">
        Let SellBot answer your customers&apos; questions 24/7 while you focus
        on selling.
      </p>
      <ul className="mt-9 space-y-4">
        {benefits.map((benefit) => (
          <BenefitItem key={benefit}>{benefit}</BenefitItem>
        ))}
      </ul>
    </section>
  );
}

function LoginCard() {
  return (
    <section
      aria-labelledby="login-title"
      className="w-full rounded-[20px] border border-[var(--login-border)] bg-[var(--login-surface)] p-7 shadow-[0_18px_55px_-38px_rgba(24,43,77,0.35)] sm:p-10"
      id="sign-in-card"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-semibold tracking-[-0.035em]" id="login-title">
          Welcome to SellBot
        </h2>
        <p className="mt-3 text-sm leading-6 text-[var(--login-secondary)]">
          One secure sign-in, then let your AI assistant get to work.
        </p>
      </div>
      <button
        className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--login-border)] bg-[var(--login-surface)] px-4 py-3 text-sm font-medium text-[var(--login-text)] shadow-sm transition-colors hover:bg-black/[0.03] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[var(--login-blue)] motion-reduce:transition-none dark:hover:bg-white/[0.05]"
        type="button"
      >
        <GoogleLogo />
        <span>Continue with Google</span>
      </button>
      <p className="mt-5 text-center text-xs leading-5 text-[var(--login-muted)]">
        Sign in securely with your Google account.
      </p>
    </section>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page min-h-screen overflow-hidden font-sans antialiased">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-[max(1.25rem,env(safe-area-inset-left))] py-6 sm:px-8 sm:py-7">
        <Link
          aria-label="SellBot home"
          className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--login-blue)]"
          href="/"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#145fcc] shadow-sm">
            <BrandMark />
          </span>
          <span className="text-lg font-semibold tracking-[-0.04em]">SellBot</span>
        </Link>
        <a
          className="rounded-full px-4 py-2 text-sm font-medium text-[var(--login-secondary)] transition-colors hover:bg-black/[0.04] hover:text-[var(--login-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--login-blue)] motion-reduce:transition-none dark:hover:bg-white/[0.06]"
          href="#sign-in-card"
        >
          Sign In
        </a>
      </header>
      <main className="mx-auto grid min-h-[calc(100svh-88px)] w-full max-w-7xl items-center gap-12 px-5 pb-[max(3rem,env(safe-area-inset-bottom))] pt-8 sm:px-8 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:gap-20 lg:pt-0">
        <HeroSection />
        <LoginCard />
      </main>
    </div>
  );
}