"use client";

import { useEffect, useState } from "react";

import { CreateProductModal } from "@/components/products/CreateProductModal";
import { ProductAnalyticsModal } from "@/components/products/ProductAnalyticsModal";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsNavbar } from "@/components/products/ProductsNavbar";
import { ProductsToolbar } from "@/components/products/ProductsToolbar";
import { createProduct, fetchProducts, type Product, type ProductFormValues } from "@/lib/products";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isAnalyticsOpen, setAnalyticsOpen] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const nextProducts = await fetchProducts();
      setProducts(nextProducts);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to load products right now.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void loadProducts();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  const handleCreateProduct = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    setCreateError(null);

    try {
      const createdProduct = await createProduct(values);
      setProducts((currentProducts) => [createdProduct, ...currentProducts]);
      setCreateOpen(false);
      setSearchTerm("");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to create the product right now.";
      setCreateError(message);
      throw caughtError;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <ProductsNavbar />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div
          role="status"
          className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Sellbot is still on development and still unstable so many stuff may occur.
        </div>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <ProductsHeader
            description="Manage your products with ease."
            onNewProduct={() => {
              setCreateError(null);
              setCreateOpen(true);
            }}
          />

          <div className="mt-6 space-y-5">
            <ProductsToolbar value={searchTerm} onChange={setSearchTerm} />
            <ProductGrid
              products={products}
              searchTerm={searchTerm}
              loading={loading}
              error={error}
              onOpenAnalytics={(productId) => {
                setSelectedProductId(productId);
                setAnalyticsOpen(true);
              }}
            />
          </div>
        </section>
      </main>

      <CreateProductModal
        isOpen={isCreateOpen}
        isSubmitting={isSubmitting}
        error={createError}
        onClose={() => {
          setCreateOpen(false);
          setCreateError(null);
        }}
        onSubmit={handleCreateProduct}
      />

      <ProductAnalyticsModal
        productId={selectedProductId}
        isOpen={isAnalyticsOpen}
        onClose={() => {
          setAnalyticsOpen(false);
          setSelectedProductId(null);
        }}
      />
    </div>
  );
}
