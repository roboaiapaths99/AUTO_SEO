import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * AutoSEO AI Platform — Auth Store
 * =================================
 * Manages user authentication state, tokens, and profile data.
 */

interface User {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  preferences?: {
    email_notifications: boolean;
    security_alerts: boolean;
    newsletter: boolean;
    audit_reports: boolean;
  };
  api_keys?: Array<{
    key: string;
    name: string;
    created_at: string;
    last_used?: string;
  }>;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (updatedUser) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        }));
      },
    }),
    {
      name: 'autoseo-auth-storage',
    }
  )
);
