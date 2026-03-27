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
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture: string;
  created_at: string;
  updated_at: string | null;
}

export const authService = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>("/auth", credentials),
  me: () => api.get<MeResponse>("/me"),
};

export { ApiError };
