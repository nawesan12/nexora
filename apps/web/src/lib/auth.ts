import { api } from "./api-client";
import type { UserInfo } from "@nexora/shared/types";

interface LoginRequest {
  email: string;
  password: string;
}

interface AccessCodeRequest {
  access_code: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  empresa: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<UserInfo>("/api/v1/auth/login", data),

  loginWithAccessCode: (data: AccessCodeRequest) =>
    api.post<UserInfo>("/api/v1/auth/login/access-code", data),

  register: (data: RegisterRequest) =>
    api.post<UserInfo>("/api/v1/auth/register", data),

  logout: () => api.post<void>("/api/v1/auth/logout"),

  getMe: () => api.get<UserInfo>("/api/v1/auth/me"),

  forgotPassword: (data: ForgotPasswordRequest) =>
    api.post<void>("/api/v1/auth/forgot-password", data),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<void>("/api/v1/auth/reset-password", data),

  verifyEmail: (token: string) =>
    api.post<void>("/api/v1/auth/verify-email", { token }),
};
