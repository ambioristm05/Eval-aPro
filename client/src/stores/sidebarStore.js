import { create } from 'zustand';

const STORAGE_KEY = 'evaluapro_sidebar_collapsed';

export const useSidebarStore = create((set) => ({
  collapsed: window.localStorage.getItem(STORAGE_KEY) === 'true',
  toggle: () =>
    set((state) => {
      const next = !state.collapsed;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return { collapsed: next };
    }),
}));
