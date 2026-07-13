import { create } from 'zustand';

export const useEvaluationNotificationStore = create((set) => ({
  newCount: 0,
  setNewCount: (count) => set({ newCount: count }),
  markAsSeen: (userId, currentCount) => {
    if (userId) {
      localStorage.setItem(`eval-seen-count-${userId}`, String(currentCount));
    }
    set({ newCount: 0 });
  },
}));
