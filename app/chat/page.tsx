import { Suspense } from "react";

import { ChatExperience } from "@/components/chat/ChatExperience";
import { ProductsNavbar } from "@/components/products/ProductsNavbar";

function ChatLoading() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ProductsNavbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
          <p role="status" className="text-sm text-slate-600">Preparing your product chat…</p>
        </section>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatExperience />
    </Suspense>
  );
}
