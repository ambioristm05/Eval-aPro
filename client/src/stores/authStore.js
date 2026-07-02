import { create } from 'zustand';
import { getMe } from '../services/authService.js';

export const useAuthStore = create((set) => ({
  user: null,
  token: window.localStorage.getItem('evaluapro_token'),
  isBootstrapping: true,
  setSession: ({ user, token }) => {
    if (token) {
      window.localStorage.setItem('evaluapro_token', token);
    }

    set({ user, token, isBootstrapping: false });
  },
  setUser: (user) => set({ user }),
  bootstrapSession: async () => {
    const token = window.localStorage.getItem('evaluapro_token');

    if (!token) {
      set({ user: null, token: null, isBootstrapping: false });
      return;
    }

    try {
      const user = await getMe();
      set({ user, token, isBootstrapping: false });
    } catch {
      window.localStorage.removeItem('evaluapro_token');
      set({ user: null, token: null, isBootstrapping: false });
    }
  },
  clearSession: () => {
    window.localStorage.removeItem('evaluapro_token');
    set({ user: null, token: null, isBootstrapping: false });
  },
}));
