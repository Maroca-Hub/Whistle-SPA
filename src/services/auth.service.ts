import { api, ApiError } from "./api";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  session_state: string;
  scope: string;
}

export interface MeResponse {
  id?: string;
  name?: string;
  firstName?: string;
  email?: string;
  avatarUrl?: string;
}

export const authService = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>("/auth", credentials),
  me: () => api.get<MeResponse>("/me"),
};

export { ApiError };
