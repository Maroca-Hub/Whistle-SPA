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

export interface UpdateMeRequest {
  firstName?: string;
  lastName?: string;
  profilePicture?: File;
}

export interface UpdatePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export const authService = {
  login: (credentials: LoginRequest) =>
    api.post<LoginResponse>("/auth", credentials),
  me: () => api.get<MeResponse>("/me"),
  updateMe: ({ firstName, lastName, profilePicture }: UpdateMeRequest) => {
    const formData = new FormData();

    if (firstName) {
      formData.append("firstName", firstName);
    }

    if (lastName) {
      formData.append("lastName", lastName);
    }

    if (profilePicture) {
      formData.append("profilePicture", profilePicture);
    }

    return api.patch<MeResponse>("/me", formData);
  },
  updatePassword: (body: UpdatePasswordRequest) =>
    api.patch<void>("/me/password", body),
};

export { ApiError };
