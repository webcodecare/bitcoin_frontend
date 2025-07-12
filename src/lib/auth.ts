import { apiRequest } from "./queryClient";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "admin" | "user";
  isActive: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  subscriptionTier: "free" | "basic" | "premium" | "pro";
  subscriptionStatus?: "active" | "canceled" | "past_due" | "trialing" | "incomplete";
  subscriptionEndsAt?: string;
  lastLoginAt?: string;
  createdAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  notificationEmail: boolean;
  notificationSms: boolean;
  notificationPush: boolean;
  theme: "light" | "dark";
  language: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ProfileResponse {
  user: User;
  settings?: UserSettings;
}

export const authAPI = {
  async register(email: string, password: string, firstName?: string, lastName?: string): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/register", {
      email,
      password,
      firstName,
      lastName,
    });
    return await response.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiRequest("POST", "/api/auth/login", {
      email,
      password,
    });
    return await response.json();
  },

  async getProfile(token: string): Promise<ProfileResponse> {
    const response = await fetch("/api/user/profile", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to get profile");
    }

    return await response.json();
  },

  async updateSettings(token: string, settings: Partial<UserSettings>): Promise<UserSettings> {
    const response = await fetch("/api/user/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      throw new Error("Failed to update settings");
    }

    return await response.json();
  },
};

// Local storage helpers
export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem("auth_token");
  },

  set(token: string): void {
    localStorage.setItem("auth_token", token);
  },

  remove(): void {
    localStorage.removeItem("auth_token");
  },
};
