import { useState } from "react";
import Link from "next/link";

import type { ProductFormValues } from "@/lib/products";
import { useModalAccessibility } from "@/lib/use-modal-accessibility";

type CreateProductModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  error: string | null;
  requiresSignIn: boolean;
  cooldownRemaining: number;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<void>;
};

const initialValues: ProductFormValues = {
  name: "",
  price: "",
  description: "",
  contact_link: "",
};

export function CreateProductModal({
  isOpen,
  isSubmitting,
  error,
  requiresSignIn,
  cooldownRemaining,
  onClose,
  onSubmit,
}: CreateProductModalProps) {
  const [values, setValues] = useState<ProductFormValues>(initialValues);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const dialogRef = useModalAccessibility<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) {
    return null;
  }

  const handleChange = (field: keyof ProductFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setSubmitError(null);
  };

  const price = Number(values.price);
  let validContactUrl = false;
  try {
    const contactUrl = new URL(values.contact_link.trim());
    validContactUrl = contactUrl.protocol === "http:" || contactUrl.protocol === "https:";
  } catch {
    validContactUrl = false;
  }
  const isFormValid =
    values.name.trim().length > 0 &&
    values.description.trim().length > 0 &&
    values.price.trim().length > 0 &&
    Number.isFinite(price) &&
    price > 0 &&
    validContactUrl;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isFormValid) {
      setSubmitError("Enter a product name, description, positive price, and valid HTTP or HTTPS contact URL.");
      return;
    }

    try {
      setSubmitError(null);
      await onSubmit(values);
      setValues(initialValues);
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : "Unable to create the product right now.",
      );
    }
  };

  const displayError = submitError ?? error;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-product-title"
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 id="create-product-title" className="text-xl font-semibold text-slate-900">
            Create Product
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close create product form"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            ✕
          </button>
        </div>

        <form noValidate onSubmit={handleSubmit} className="max-h-[calc(90vh-80px)] space-y-5 overflow-y-auto px-5 py-5">
          <div>
            <label htmlFor="product-name" className="mb-2 block text-sm font-medium text-slate-700">
              Product Name / Title
            </label>
            <input
              id="product-name"
              name="name"
              type="text"
              autoFocus
              autoComplete="off"
              value={values.name}
              onChange={(event) => handleChange("name", event.target.value)}
              placeholder="Wireless Mouse"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="product-price" className="mb-2 block text-sm font-medium text-slate-700">
              Price
            </label>
            <input
              id="product-price"
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              value={values.price}
              onChange={(event) => handleChange("price", event.target.value)}
              placeholder="29.99"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="product-description" className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              id="product-description"
              name="description"
              rows={4}
              value={values.description}
              onChange={(event) => handleChange("description", event.target.value)}
              placeholder="Describe your product..."
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label htmlFor="product-contact-link" className="mb-2 block text-sm font-medium text-slate-700">
              Contact Link
            </label>
            <input
              id="product-contact-link"
              name="contact_link"
              type="url"
              value={values.contact_link}
              onChange={(event) => handleChange("contact_link", event.target.value)}
              placeholder="https://example.com/contact"
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {displayError ? (
            <div aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {displayError}
              {requiresSignIn ? (
                <p className="mt-2">
                  <Link href="/Login" className="font-semibold underline underline-offset-2">
                    Sign in again
                  </Link>
                </p>
              ) : null}
            </div>
          ) : null}

          {cooldownRemaining > 0 ? (
            <p role="status" className="text-sm text-slate-600">
              You can create another product in {cooldownRemaining} seconds.
            </p>
          ) : null}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting || cooldownRemaining > 0}
              className="rounded-xl bg-[#145fcc] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#124da8] disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isSubmitting
                ? "Creating..."
                : cooldownRemaining > 0
                  ? `Wait ${cooldownRemaining}s`
                  : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
