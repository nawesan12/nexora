const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshTokens();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      const retryRes = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({}));
        throw new ApiClientError(
          retryRes.status,
          body.error?.code || "REQUEST_FAILED",
          body.error?.message || "Request failed",
        );
      }

      const retryBody = await retryRes.json();
      return retryBody.data as T;
    }

    throw new ApiClientError(401, "UNAUTHORIZED", "Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiClientError(
      res.status,
      body.error?.code || "REQUEST_FAILED",
      body.error?.message || "Request failed",
    );
  }

  if (res.status === 204) return undefined as T;

  const body = await res.json();
  return body.data as T;
}

async function requestWithMeta<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; meta: import("@nexora/shared/types").Meta }> {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshTokens();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      const retryRes = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (!retryRes.ok) {
        const body = await retryRes.json().catch(() => ({}));
        throw new ApiClientError(
          retryRes.status,
          body.error?.code || "REQUEST_FAILED",
          body.error?.message || "Request failed",
        );
      }

      const retryBody = await retryRes.json();
      return { data: retryBody.data as T, meta: retryBody.meta };
    }

    throw new ApiClientError(401, "UNAUTHORIZED", "Session expired");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiClientError(
      res.status,
      body.error?.code || "REQUEST_FAILED",
      body.error?.message || "Request failed",
    );
  }

  const body = await res.json();
  return { data: body.data as T, meta: body.meta };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  getWithMeta: <T>(path: string) => requestWithMeta<T>(path),
  post: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),
  put: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),
  patch: <T>(path: string, data?: unknown) =>
    request<T>(path, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
