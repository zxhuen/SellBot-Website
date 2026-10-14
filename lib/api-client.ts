import { supabase } from "./supabase/client";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Your session has expired. Please sign in again.");
    this.name = "AuthenticationRequiredError";
  }
}

export function isAuthenticationError(error: unknown): boolean {
  return (
    error instanceof AuthenticationRequiredError ||
    (error instanceof ApiRequestError && error.status === 401)
  );
}

const DEFAULT_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  process.env.NEXT_PUBLIC_BACKEND_URL ??
  process.env.NEXT_PUBLIC_SELLBOT_API_URL ??
  "http://localhost:8000";
let loginRedirectStarted = false;

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

async function readAuthToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session) {
    return null;
  }

  return session.access_token ?? null;
}

function redirectToLogin() {
  if (typeof window === "undefined" || loginRedirectStarted) {
    return;
  }

  loginRedirectStarted = true;
  const next = `${window.location.pathname}${window.location.search}`;
  const loginUrl = new URL("/Login", window.location.origin);
  loginUrl.searchParams.set("next", next);
  window.location.replace(loginUrl.toString());
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
  const token = await readAuthToken();

  const isApiRequest = new URL(url).origin === new URL(getBaseUrl()).origin;
  if (token && isApiRequest && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && isApiRequest) {
      redirectToLogin();
    }

    const errorText = await response.text();
    throw new ApiRequestError(
      errorText ? `Request failed (${response.status}): ${errorText}` : `Request failed (${response.status}).`,
      response.status,
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
  const token = await readAuthToken();
  const headers = buildHeaders(init.headers, !(init.body instanceof FormData));

  if (!token) {
    redirectToLogin();
    throw new AuthenticationRequiredError();
  }

  headers.set("Authorization", `Bearer ${token}`);

  try {
    return await publicFetch<T>(input, {
      ...init,
      headers,
    });
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 401) {
      redirectToLogin();
      throw new AuthenticationRequiredError();
    }
    throw error;
  }
}
