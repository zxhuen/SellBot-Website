import { authFetch } from "./api-client";

export interface ProductFormValues {
  name: string;
  price: string;
  description: string;
  contact_link: string;
}

export interface Product {
  id: string | number;
  public_id?: string | number;
  name: string;
  description: string;
  price: number | string;
  contact_link?: string;
  status?: string;
  view_count?: number | string;
  created_at?: string;
  [key: string]: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeProduct(raw: unknown): Product | null {
  if (!isRecord(raw)) {
    return null;
  }

  const productId = raw.id ?? raw.product_id ?? raw.public_id ?? raw.uuid ?? raw.slug;
  const productName = raw.name ?? raw.title ?? "Unnamed product";

  if (productId == null) {
    return null;
  }

  const publicId = raw.public_id ?? raw.product_id ?? productId;
  const numericPrice = typeof raw.price === "number" ? raw.price : Number(raw.price ?? raw.amount ?? 0);

  return {
    ...raw,
    id: String(productId),
    public_id: typeof publicId === "string" || typeof publicId === "number" ? publicId : String(publicId),
    name: String(productName),
    description: typeof raw.description === "string" ? raw.description : "",
    price: Number.isFinite(numericPrice) ? numericPrice : 0,
    contact_link:
      typeof raw.contact_link === "string"
        ? raw.contact_link
        : typeof raw.link === "string"
          ? raw.link
          : undefined,
    status: typeof raw.status === "string" ? raw.status : "active",
    view_count: Number(raw.view_count ?? raw.views ?? 0),
    created_at: typeof raw.created_at === "string" ? raw.created_at : undefined,
  };
}

function decodeProductCollection(data: unknown): Product[] | null {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeProduct(item)).filter(Boolean) as Product[];
  }

  if (!isRecord(data)) {
    return null;
  }

  const possibleCollections = [
    data.items,
    data.products,
    data.data,
    data.results,
    data.product,
  ];

  for (const candidate of possibleCollections) {
    if (Array.isArray(candidate)) {
      return candidate.map((item) => normalizeProduct(item)).filter(Boolean) as Product[];
    }
  }

  if (isRecord(data.products)) {
    return [normalizeProduct(data.products)].filter(Boolean) as Product[];
  }

  return null;
}

export async function fetchProducts(): Promise<Product[]> {
  const attemptedPaths = ["/products", "/api/products", "/product"];
  let lastError: unknown;

  for (const path of attemptedPaths) {
    try {
      const response = await authFetch<unknown>(path);
      const collection = decodeProductCollection(response);

      if (collection !== null) {
        return collection;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

export async function createProduct(values: ProductFormValues): Promise<Product> {
  const payload = {
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    contact_link: values.contact_link.trim(),
  };

  const response = await authFetch<unknown>("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const normalized = normalizeProduct(response);
  if (normalized) {
    return normalized;
  }

  if (isRecord(response) && "data" in response && isRecord(response.data)) {
    const nested = normalizeProduct(response.data);
    if (nested) {
      return nested;
    }
  }

  throw new Error("The backend did not return the created product.");
}

export async function fetchProductAnalytics(productId: string): Promise<Record<string, unknown>> {
  const candidatePaths = [
    `/products/${productId}/analytics`,
    `/product/${productId}/analytics`,
    `/products/${productId}/sessions`,
    `/products/${productId}`,
  ];

  for (const path of candidatePaths) {
    try {
      const response = await authFetch<unknown>(path);

      if (response == null) {
        continue;
      }

      if (isRecord(response)) {
        if ("analytics" in response && isRecord(response.analytics)) {
          return response.analytics as Record<string, unknown>;
        }

        if ("data" in response && isRecord(response.data)) {
          if ("analytics" in response.data && isRecord(response.data.analytics)) {
            return response.data.analytics as Record<string, unknown>;
          }

          return response.data as Record<string, unknown>;
        }

        return response as Record<string, unknown>;
      }

      if (typeof response === "number" || typeof response === "string") {
        return { chat_session_count: response };
      }
    } catch {
      continue;
    }
  }

  return { product_id: productId, chat_session_count: 0 };
}
