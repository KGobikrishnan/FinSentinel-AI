import { create } from 'zustand';
import { UserProfile, UserRole } from '../types';
import { apiClient } from '../api/client';

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: {
    id: 1,
    username: 'cfo_admin',
    email: 'cfo@finsentinel.ai',
    fullName: 'Alexandra Chen, CFO',
    role: 'ROLE_CFO_ADMIN',
    enabled: true,
  },
  accessToken: localStorage.getItem('finsentinel_access_token'),
  isAuthenticated: true,
  isLoading: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.post('/auth/login', { username, password });
      const { accessToken, refreshToken, user } = response.data;

      localStorage.setItem('finsentinel_access_token', accessToken);
      localStorage.setItem('finsentinel_refresh_token', refreshToken);
      localStorage.setItem('finsentinel_username', user.username);

      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('finsentinel_access_token');
      localStorage.removeItem('finsentinel_refresh_token');
      localStorage.removeItem('finsentinel_username');
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
      });
    }
  },

  switchDemoRole: async (role: UserRole) => {
    const roleMap: Record<UserRole, { username: string; name: string; email: string }> = {
      ROLE_CFO_ADMIN: { username: 'cfo_admin', name: 'Alexandra Chen, CFO', email: 'cfo@finsentinel.ai' },
      ROLE_FINANCE_AUDITOR: { username: 'finance_auditor', name: 'Marcus Vance, Lead Auditor', email: 'auditor@finsentinel.ai' },
      ROLE_PROCUREMENT_MANAGER: { username: 'procurement_mgr', name: 'Elena Rostova, Procurement Head', email: 'procurement@finsentinel.ai' },
      ROLE_VENDOR: { username: 'vendor_cloudcorp', name: 'David Miller, Vendor Rep', email: 'vendor@cloudscale.io' },
    };

    const target = roleMap[role];
    try {
      // Attempt login with backend
      await get().login(target.username, 'Admin@123');
    } catch {
      // Local fallback for offline/client preview mode
      const user: UserProfile = {
        id: role === 'ROLE_CFO_ADMIN' ? 1 : role === 'ROLE_FINANCE_AUDITOR' ? 2 : role === 'ROLE_PROCUREMENT_MANAGER' ? 3 : 4,
        username: target.username,
        email: target.email,
        fullName: target.name,
        role: role,
        enabled: true,
      };
      set({
        user,
        isAuthenticated: true,
      });
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('finsentinel_access_token');
    if (!token) return;

    try {
      const response = await apiClient.get<UserProfile>('/auth/me');
      set({
        user: response.data,
        isAuthenticated: true,
      });
    } catch {
      // Keep existing default demo session
    }
  },
}));
