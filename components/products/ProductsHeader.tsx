type ProductsHeaderProps = {
  description: string;
  onNewProduct: () => void;
};

export function ProductsHeader({ description, onNewProduct }: ProductsHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-[-0.05em] text-slate-900">Products</h1>
        <p className="mt-2 text-sm text-slate-600">{description}</p>
      </div>

      <button
        type="button"
        onClick={onNewProduct}
        className="inline-flex items-center justify-center rounded-xl bg-[#145fcc] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#124da8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145fcc]"
      >
        + New Product
      </button>
    </header>
  );
}
