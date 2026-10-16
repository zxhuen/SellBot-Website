import { Suspense } from "react";

import { ChatHistory } from "@/components/chat/ChatHistory";
import { ProductsNavbar } from "@/components/products/ProductsNavbar";

type ChatHistoryPageProps = {
  params: Promise<{ chatSessionId: string }>;
  searchParams: Promise<{ product_id?: string | string[] }>;
};

function ChatHistoryLoading() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ProductsNavbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <p role="status" className="text-sm text-slate-600">Loading conversation…</p>
        </section>
      </main>
    </div>
  );
}

export default function ChatHistoryPage(props: ChatHistoryPageProps) {
  return (
    <Suspense fallback={<ChatHistoryLoading />}>
      <ChatHistoryRoute {...props} />
    </Suspense>
  );
}

async function ChatHistoryRoute({ params, searchParams }: ChatHistoryPageProps) {
  const [{ chatSessionId }, query] = await Promise.all([params, searchParams]);
  const productId = Array.isArray(query.product_id) ? query.product_id[0] : query.product_id;

  return <ChatHistory chatSessionId={chatSessionId} productId={productId ?? null} />;
}
