import type { UserProfile, UserRole } from "../types/platform";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const TOKEN_KEY = "scholarst_access_token";
const REFRESH_KEY = "scholarst_refresh_token";

let inMemoryUser: UserProfile | null = null;

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role?: "applicant" | "officer" | "inspector";
  phone?: string;
  designation?: string;
  department?: string;
  tribe_name?: string;
  caste_certificate_no?: string;
  annual_income?: number;
  state_of_domicile?: string;
  district?: string;
  academic_level?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  reset_token?: string;
  code?: string;
  masked_email?: string;
  expires_in_minutes?: number;
}

export const authService = {
  getToken(): string | null {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem("access_token")
    );
  },

  setSession(accessToken: string, refreshToken?: string) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem("profile");
    localStorage.removeItem("role");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    inMemoryUser = null;
  },

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  },

  async login(
    username: string,
    password: string
  ): Promise<{ profile: UserProfile; accessToken: string }> {
    const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: username.trim(),
        password: password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || "Invalid username or password");
    }

    if (!data.profile || !data.profile.is_active) {
      throw new Error("This account is inactive. Please contact your system administrator.");
    }

    this.setSession(data.access_token, data.refresh_token);
    inMemoryUser = data.profile;

    return {
      profile: data.profile,
      accessToken: data.access_token,
    };
  },

  async register(
    payload: RegisterPayload
  ): Promise<{ profile: UserProfile; accessToken: string }> {
    const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || "Failed to create account. Please check your details.");
    }

    if (!data.profile || !data.profile.is_active) {
      throw new Error("Account registration completed, but account is pending activation.");
    }

    this.setSession(data.access_token, data.refresh_token);
    inMemoryUser = data.profile;

    return {
      profile: data.profile,
      accessToken: data.access_token,
    };
  },

  async forgotPassword(identifier: string): Promise<ForgotPasswordResponse> {
    const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: identifier.trim(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || "Password reset request failed. Please check the identifier.");
    }

    return data;
  },

  async resetPassword(
    identifier: string,
    resetCode: string,
    newPassword: string,
    confirmPassword?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${BACKEND_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier: identifier.trim(),
        reset_code: resetCode.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.detail || "Failed to reset password. Please check your verification code.");
    }

    return data;
  },

  async getCurrentUser(forceRefresh = false): Promise<UserProfile | null> {
    const token = this.getToken();
    if (!token) {
      inMemoryUser = null;
      return null;
    }

    if (inMemoryUser && !forceRefresh) {
      return inMemoryUser;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        this.clearSession();
        return null;
      }

      const data = await response.json();
      if (!data.profile || !data.profile.is_active) {
        this.clearSession();
        return null;
      }

      inMemoryUser = data.profile;
      return inMemoryUser;
    } catch {
      return inMemoryUser;
    }
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      try {
        await fetch(`${BACKEND_URL}/api/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch {
        // Continue cleanup even if network request fails
      }
    }
    this.clearSession();
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  getDashboardPath(role?: UserRole | string): string {
    const r = (role || "").toLowerCase();
    if (r === "admin") return "/admin";
    if (r === "officer" || r === "inspector") return "/officer";
    return "/applicant";
  },
};
