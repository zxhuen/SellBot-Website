"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { CreateProductModal } from "@/components/products/CreateProductModal";
import { ProductAnalyticsModal } from "@/components/products/ProductAnalyticsModal";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductsHeader } from "@/components/products/ProductsHeader";
import { ProductsNavbar } from "@/components/products/ProductsNavbar";
import { ProductsToolbar } from "@/components/products/ProductsToolbar";
import { isAuthenticationError } from "@/lib/api-client";
import {
  addProduct,
  deleteProduct,
  getProducts,
  markProductAsSold,
  type Product,
  type ProductFormValues,
} from "@/lib/products";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requiresSignIn, setRequiresSignIn] = useState(false);
  const [actions, setActions] = useState<Record<string, "delete" | "sold" | undefined>>({});
  const [actionErrors, setActionErrors] = useState<Record<string, string | undefined>>({});
  const [actionRequiresSignIn, setActionRequiresSignIn] = useState<Record<string, boolean | undefined>>({});
  const [exitingProductIds, setExitingProductIds] = useState<string[]>([]);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createRequiresSignIn, setCreateRequiresSignIn] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isAnalyticsOpen, setAnalyticsOpen] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const deleteTimers = useRef(new Map<string, number>());

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    setRequiresSignIn(false);

    try {
      const nextProducts = await getProducts();
      setProducts(nextProducts);
    } catch (caughtError) {
      const authenticationError = isAuthenticationError(caughtError);
      setRequiresSignIn(authenticationError);
      setError(
        authenticationError
          ? "Your session has expired. Sign in again to load your products."
          : caughtError instanceof Error
            ? caughtError.message
            : "Unable to load products right now.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleCreateProduct = async (values: ProductFormValues) => {
    setIsSubmitting(true);
    setCreateError(null);
    setCreateRequiresSignIn(false);

    try {
      const createdProduct = await addProduct(values);
      setProducts((currentProducts) => [createdProduct, ...currentProducts]);
      setCooldownUntil(Date.now() + 5000);
      setCreateOpen(false);
      setSearchTerm("");
    } catch (caughtError) {
      setCreateRequiresSignIn(isAuthenticationError(caughtError));
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to create the product right now.";
      setCreateError(message);
      throw caughtError;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (cooldownUntil === null) {
      setCooldownRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000));
      setCooldownRemaining(remaining);
      if (remaining === 0) {
        setCooldownUntil(null);
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  useEffect(
    () => () => {
      for (const timer of deleteTimers.current.values()) {
        window.clearTimeout(timer);
      }
      deleteTimers.current.clear();
    },
    [],
  );

  const handleProductAction = async (productId: string, action: "delete" | "sold") => {
    if (actions[productId]) {
      return;
    }

    setActions((current) => ({ ...current, [productId]: action }));
    setActionErrors((current) => ({ ...current, [productId]: undefined }));
    setActionRequiresSignIn((current) => ({ ...current, [productId]: false }));

    try {
      if (action === "delete") {
        await deleteProduct(productId);
        setExitingProductIds((current) => [...current, productId]);
        const timer = window.setTimeout(() => {
          setProducts((current) => current.filter((product) => String(product.id) !== productId));
          setExitingProductIds((current) => current.filter((id) => id !== productId));
          setActions((current) => {
            const next = { ...current };
            delete next[productId];
            return next;
          });
          deleteTimers.current.delete(productId);
        }, 200);
        deleteTimers.current.set(productId, timer);
        return;
      }

      await markProductAsSold(productId);
      setProducts((current) =>
        current.map((product) =>
          String(product.id) === productId ? { ...product, status: "sold" } : product,
        ),
      );
    } catch (caughtError) {
      setActionRequiresSignIn((current) => ({
        ...current,
        [productId]: isAuthenticationError(caughtError),
      }));
      setActionErrors((current) => ({
        ...current,
        [productId]:
          caughtError instanceof Error ? caughtError.message : "The product action failed. Please try again.",
      }));
    } finally {
      if (action !== "delete" || !deleteTimers.current.has(productId)) {
        setActions((current) => {
          const next = { ...current };
          delete next[productId];
          return next;
        });
      }
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
            newProductLabel={
              cooldownRemaining > 0 ? `New Product (${cooldownRemaining}s)` : "+ New Product"
            }
            onNewProduct={() => {
              setCreateError(null);
              setCreateRequiresSignIn(false);
              setCreateOpen(true);
            }}
          />

          <div className="mt-6 space-y-5">
            <ProductsToolbar value={searchTerm} onChange={setSearchTerm} />
            {cooldownRemaining > 0 ? (
              <p role="status" className="text-sm text-slate-500">
                You can create another product in {cooldownRemaining} seconds.
              </p>
            ) : null}
            <ProductGrid
              products={products}
              searchTerm={searchTerm}
              loading={loading}
              error={error}
              requiresSignIn={requiresSignIn}
              actions={actions}
              actionErrors={actionErrors}
              actionRequiresSignIn={actionRequiresSignIn}
              exitingProductIds={exitingProductIds}
              onOpenAnalytics={(productId) => {
                setSelectedProductId(productId);
                setAnalyticsOpen(true);
              }}
              onDelete={(productId) => void handleProductAction(productId, "delete")}
              onMarkAsSold={(productId) => void handleProductAction(productId, "sold")}
              onRetry={() => void loadProducts()}
            />
          </div>
        </section>
      </main>

      <CreateProductModal
        isOpen={isCreateOpen}
        isSubmitting={isSubmitting}
        error={createError}
        requiresSignIn={createRequiresSignIn}
        cooldownRemaining={cooldownRemaining}
        onClose={() => {
          setCreateOpen(false);
          setCreateError(null);
          setCreateRequiresSignIn(false);
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
