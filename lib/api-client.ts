const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_SELLBOT_API_URL ??
  "http://localhost:8000";

function getBaseUrl() {
  return DEFAULT_API_BASE_URL.replace(/\/+$/, "");
}

function resolveUrl(input: string) {
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return input;
  }

  const trimmed = input.replace(/^\/+/, "");
  return `${getBaseUrl()}/${trimmed}`;
}

function readAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const storageKeys = [
    "sb-access-token",
    "sb-auth-token",
    "access_token",
    "auth_token",
    "sellbot_access_token",
  ];

  for (const key of storageKeys) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return value;
    }
  }

  const cookieEntry = document.cookie
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => {
      const [key] = entry.split("=");
      return /(sb-.*-auth-token|access_token|auth_token)/i.test(key ?? "");
    });

  if (!cookieEntry) {
    return null;
  }

  const [, rawValue] = cookieEntry.split("=");
  return rawValue ? decodeURIComponent(rawValue) : null;
}

function buildHeaders(initHeaders?: HeadersInit, includeJsonContent = true) {
  const headers = new Headers(initHeaders ?? {});

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (includeJsonContent && !headers.has("Content-Type") && !(initHeaders instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function publicFetch<T = unknown>(input: string, init: RequestInit = {}): Promise<T> {
  const url = resolveUrl(input);
  const headers = buildHeaders(init.headers, !(init.body instanceof FormData));

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText ? `Request failed (${response.status}): ${errorText}` : `Request failed (${response.status}).`,
    );
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export async function authFetch<T = unknown>(input: string, init: RequestInit = {}): Promise<T> {
  const token = readAuthToken();
  const headers = buildHeaders(init.headers, !(init.body instanceof FormData));

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return publicFetch<T>(input, {
    ...init,
    headers,
  });
}
