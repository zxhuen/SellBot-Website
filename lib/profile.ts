import { authFetch } from "@/lib/api-client";

export interface UserProfile {
  email: string;
  display_name: string;
  avatar_url: string;
  subscription: {
    name: string;
    max_products: number;
    daily_product_limit: number;
  };
  usage: {
    products_created_today: number;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!isRecord(value) || !isRecord(value.subscription) || !isRecord(value.usage)) {
    return false;
  }

  return (
    typeof value.email === "string" &&
    typeof value.display_name === "string" &&
    typeof value.avatar_url === "string" &&
    typeof value.subscription.name === "string" &&
    isNonNegativeInteger(value.subscription.max_products) &&
    isNonNegativeInteger(value.subscription.daily_product_limit) &&
    isNonNegativeInteger(value.usage.products_created_today)
  );
}

export async function getUserProfile(): Promise<UserProfile> {
  const response = await authFetch<unknown>("/User/show-profile", { method: "GET" });

  if (!isUserProfile(response)) {
    throw new Error("The profile service returned invalid account data.");
  }

  return response;
}
