import {
  ApiRequestError,
  AuthenticationRequiredError,
  authFetch,
  publicFetch,
} from "./api-client";

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
  title?: string;
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
    title: String(productName),
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

interface ProductListItem {
  id: string;
  title: string;
  description: string;
  price: string | number;
  public_id: string;
  status: string;
}

function isProductListItem(value: unknown): value is ProductListItem {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    (typeof value.price === "string" || typeof value.price === "number") &&
    typeof value.public_id === "string" &&
    typeof value.status === "string"
  );
}

export async function getProducts(): Promise<Product[]> {
  if (productsRequest) {
    return productsRequest;
  }

  productsRequest = requestProducts();

  try {
    return await productsRequest;
  } finally {
    productsRequest = null;
  }
}

let productsRequest: Promise<Product[]> | null = null;

async function requestProducts(): Promise<Product[]> {
  const response = await authFetch<unknown>("/Products/list-product", { method: "GET" });

  if (!Array.isArray(response)) {
    throw new Error("The products service returned an invalid response.");
  }

  return response.map((item, index) => {
    if (!isProductListItem(item)) {
      throw new Error(`The products service returned invalid data for product ${index + 1}.`);
    }

    return {
      id: item.id,
      public_id: item.public_id,
      name: item.title,
      title: item.title,
      description: item.description,
      price: item.price,
      status: item.status,
    };
  });
}

export async function addProduct(values: ProductFormValues): Promise<Product> {
  const payload = {
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    contact_link: values.contact_link.trim(),
  };

  const response = await authFetch<unknown>("/Products/add-product", {
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

export const createProduct = addProduct;

function requireProductId(productId: string) {
  if (!productId.trim()) {
    throw new Error("Product id is required.");
  }
}

export async function deleteProduct(productId: string): Promise<unknown> {
  requireProductId(productId);

  return authFetch<unknown>(
    `/Products/delete-product?id=${encodeURIComponent(productId)}`,
    { method: "DELETE" },
  );
}

export async function markProductAsSold(productId: string): Promise<unknown> {
  requireProductId(productId);

  return authFetch<unknown>(
    `/Products/mark-as-sold?id=${encodeURIComponent(productId)}`,
    { method: "PATCH" },
  );
}

export async function getChatSessionCount(productId: string): Promise<unknown> {
  requireProductId(productId);

  return authFetch<unknown>(
    `/Analytics/get-chat-session-count?product_id=${encodeURIComponent(productId)}`,
    { method: "POST" },
  );
}

export async function getProductByPublicId(publicId: string): Promise<Product> {
  if (!publicId.trim()) {
    throw new Error("Public id is required.");
  }

  let response: unknown;
  try {
    response = await publicFetch<unknown>(
      `/Products/get-product-public-id?public_id=${encodeURIComponent(publicId)}`,
      { method: "GET" },
    );
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      throw new AuthenticationRequiredError();
    }
    throw error;
  }
  const product = normalizeProduct(response);

  if (!product) {
    throw new Error("The product service returned invalid product data.");
  }

  return product;
}

export interface ChatSessionResponse {
  id: string;
  product: {
    title: string;
    price: string | number;
  };
  user: {
    display_name: string;
    avatar_url: string | null;
  };
  last_message_at: string;
}

function isChatSessionResponse(value: unknown): value is ChatSessionResponse {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.last_message_at !== "string") {
    return false;
  }

  const { product, user } = value;
  return (
    isRecord(product) &&
    typeof product.title === "string" &&
    (typeof product.price === "string" || typeof product.price === "number") &&
    isRecord(user) &&
    typeof user.display_name === "string" &&
    (typeof user.avatar_url === "string" || user.avatar_url === null)
  );
}

export async function getProductChatMessages(productId: string): Promise<ChatSessionResponse[]> {
  requireProductId(productId);

  const response = await authFetch<unknown>(
    `/Products/get-product-history?product_id=${encodeURIComponent(productId)}`,
    { method: "GET" },
  );

  if (!Array.isArray(response)) {
    throw new Error("The conversation service returned an invalid response.");
  }

  return response.map((conversation, index) => {
    if (!isChatSessionResponse(conversation)) {
      throw new Error(
        `The conversation service returned invalid data for conversation ${index + 1}.`,
      );
    }

    return conversation;
  });
}

export const getProductConversationHistory = getProductChatMessages;
