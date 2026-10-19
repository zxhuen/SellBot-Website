import { supabase } from "./supabase/client";

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly validationErrors: ApiValidationError[] = [],
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getValidationErrors(responseBody: unknown): ApiValidationError[] {
  if (!isRecord(responseBody) || !Array.isArray(responseBody.detail)) {
    return [];
  }

  return responseBody.detail.flatMap((issue): ApiValidationError[] => {
    if (
      !isRecord(issue) ||
      !Array.isArray(issue.loc) ||
      !issue.loc.every((part) => typeof part === "string" || typeof part === "number") ||
      typeof issue.msg !== "string" ||
      typeof issue.type !== "string"
    ) {
      return [];
    }

    return [{ loc: issue.loc, msg: issue.msg, type: issue.type }];
  });
}

function getHttpErrorMessage(status: number, validationErrors: ApiValidationError[]): string {
  if (status === 422) {
    if (validationErrors.length === 0) {
      return "The product details were rejected. Check the required fields and try again.";
    }

    const issues = validationErrors.map((issue) => {
      const field = issue.loc.filter((part) => part !== "body").join(".") || "request";
      return `${field}: ${issue.msg}`;
    });
    return `Validation failed: ${issues.join(" ")}`;
  }
  if (status === 429) {
    return "Too many requests. Please wait a moment before trying again.";
  }
  if (status >= 500) {
    return "The service is temporarily unavailable. Please try again later.";
  }

  return `Request failed (${status}).`;
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

    let responseBody: unknown;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }
    const validationErrors = getValidationErrors(responseBody);
    throw new ApiRequestError(
      getHttpErrorMessage(response.status, validationErrors),
      response.status,
      validationErrors,
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
