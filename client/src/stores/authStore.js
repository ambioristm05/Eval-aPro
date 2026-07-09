import { create } from 'zustand';
import { getMe } from '../services/authService.js';

export const useAuthStore = create((set) => ({
  user: null,
  token: window.sessionStorage.getItem('evaluapro_token'),
  isBootstrapping: true,
  setSession: ({ user, token }) => {
    if (token) {
      window.sessionStorage.setItem('evaluapro_token', token);
      window.localStorage.removeItem('evaluapro_token');
    }

    set({ user, token, isBootstrapping: false });
  },
  setUser: (user) => set({ user }),
  bootstrapSession: async () => {
    const token = window.sessionStorage.getItem('evaluapro_token');
    window.localStorage.removeItem('evaluapro_token');

    if (!token) {
      set({ user: null, token: null, isBootstrapping: false });
      return;
    }

    try {
      const user = await getMe();
      set({ user, token, isBootstrapping: false });
    } catch {
      window.sessionStorage.removeItem('evaluapro_token');
      window.localStorage.removeItem('evaluapro_token');
      set({ user: null, token: null, isBootstrapping: false });
    }
  },
  clearSession: () => {
    window.sessionStorage.removeItem('evaluapro_token');
    window.localStorage.removeItem('evaluapro_token');
    set({ user: null, token: null, isBootstrapping: false });
  },
}));
