import { useCallback, useEffect, useRef } from 'react';
import api from '../services/api.js';
import { useEvaluationNotificationStore } from '../stores/evaluationNotificationStore.js';

const POLL_INTERVAL_MS = 60000;

export function useEvaluationNotifications({ userId, enabled = true } = {}) {
  const setNewCount = useEvaluationNotificationStore((s) => s.setNewCount);
  const hasLoadedOnceRef = useRef(false);
  const lastCountRef = useRef(null);

  const getSeenCount = useCallback(() => {
    if (!userId) return 0;
    return Number(localStorage.getItem(`eval-seen-count-${userId}`) ?? 0);
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!enabled || !userId) return;

    try {
      const { data } = await api.get('/evaluations/count');
      const current = Number(data.count ?? 0);
      const seen = getSeenCount();
      const isNew = hasLoadedOnceRef.current && current > (lastCountRef.current ?? seen);

      if (isNew && document.visibilityState !== 'visible' && window.Notification?.permission === 'granted') {
        new window.Notification('EvalúaPro', {
          body: 'Tienes una nueva evaluación publicada.',
          tag: 'evaluapro-evaluation',
        });
      }

      lastCountRef.current = current;
      setNewCount(Math.max(0, current - seen));
      hasLoadedOnceRef.current = true;
    } catch {
      // silencioso — no interrumpir la UI por un fallo de polling
    }
  }, [enabled, userId, getSeenCount, setNewCount]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !userId) return;
    const id = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, userId, refresh]);
}
