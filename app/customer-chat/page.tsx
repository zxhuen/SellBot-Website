import { CustomerChatList } from "@/components/chat/CustomerChatList";
import { ProductsNavbar } from "@/components/products/ProductsNavbar";

export default function CustomerChatPage() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ProductsNavbar />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <CustomerChatList />
      </main>
    </div>
  );
}
