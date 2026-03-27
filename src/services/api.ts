const BASE_URL = import.meta.env.VITE_API_URL;

interface ApiErrorResponse {
  code?: number;
  message?: string;
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

const SESSION_EXPIRED_MESSAGE =
  "Your session has expired. Please log in again.";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parseErrorResponse(
  response: Response,
): Promise<ApiErrorResponse> {
  try {
    return (await response.json()) as ApiErrorResponse;
  } catch {
    return {};
  }
}

function clearAuthTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

function redirectToLogin() {
  window.history.replaceState({}, "", "/");
  window.dispatchEvent(new PopStateEvent("popstate"));
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    return false;
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as RefreshResponse;

    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);

    return true;
  } catch {
    return false;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit,
  canRetryAuth = true,
): Promise<T> {
  const token = localStorage.getItem("access_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (init?.headers) {
    Object.assign(headers, init.headers);
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    const errorData = await parseErrorResponse(response);
    const errorMessage =
      errorData.message || `${response.status} ${response.statusText}`;

    const isExpiredSessionResponse =
      response.status === 401 &&
      errorData.code === 401 &&
      errorData.message === SESSION_EXPIRED_MESSAGE;

    if (canRetryAuth && isExpiredSessionResponse) {
      const didRefresh = await tryRefreshToken();

      if (didRefresh) {
        return request<T>(path, init, false);
      }

      clearAuthTokens();
      redirectToLogin();
    }

    throw new ApiError(response.status, errorMessage);
  }

  return response.json() as Promise<T>;
}

export const api = {
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),

  get: <T>(path: string) => request<T>(path, { method: "GET" }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),

  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
