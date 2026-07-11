import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { listMessageContacts } from '../services/messageService.js';
import { getErrorMessage } from '../utils/errors.js';

const POLL_INTERVAL_MS = 15000;

export function useMessageNotifications({ enabled = true } = {}) {
  const [contacts, setContacts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [permission, setPermission] = useState(() =>
    typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'unsupported'
  );
  const previousContactsRef = useRef(new Map());
  const hasLoadedOnceRef = useRef(false);

  const maybeShowSystemNotifications = useCallback(
    (nextContacts) => {
      if (
        permission !== 'granted' ||
        typeof window === 'undefined' ||
        !('Notification' in window) ||
        document.visibilityState === 'visible'
      ) {
        return;
      }

      nextContacts.forEach((contact) => {
        const previous = previousContactsRef.current.get(contact.user.id);
        const nextUnread = Number(contact.unreadCount || 0);
        const previousUnread = Number(previous?.unreadCount || 0);
        const nextMessageAt = contact.lastMessageAt || '';
        const previousMessageAt = previous?.lastMessageAt || '';

        if (nextUnread > previousUnread && nextMessageAt && nextMessageAt !== previousMessageAt) {
          const notification = new window.Notification(contact.user.name, {
            body: contact.lastMessage || 'Tienes un mensaje nuevo en EvalúaPro.',
            tag: `evaluapro-message-${contact.user.id}`,
          });

          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        }
      });
    },
    [permission]
  );

  const refresh = useCallback(async () => {
    if (!enabled) {
      setContacts([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await listMessageContacts();
      const nextContacts = data.contacts ?? [];

      if (hasLoadedOnceRef.current) {
        maybeShowSystemNotifications(nextContacts);
      }

      setContacts(nextContacts);
      setError('');
      previousContactsRef.current = new Map(
        nextContacts.map((contact) => [
          contact.user.id,
          {
            unreadCount: Number(contact.unreadCount || 0),
            lastMessageAt: contact.lastMessageAt || '',
          },
        ])
      );
      hasLoadedOnceRef.current = true;
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  }, [enabled, maybeShowSystemNotifications]);

  useEffect(() => {
    setIsLoading(true);
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return undefined;

    const intervalId = window.setInterval(() => {
      refresh();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, refresh]);

  const unreadContacts = useMemo(
    () => contacts.filter((contact) => Number(contact.unreadCount || 0) > 0),
    [contacts]
  );
  const unreadCount = useMemo(
    () => unreadContacts.reduce((total, contact) => total + Number(contact.unreadCount || 0), 0),
    [unreadContacts]
  );

  const requestSystemPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }

    const nextPermission = await window.Notification.requestPermission();
    setPermission(nextPermission);
    return nextPermission;
  }, []);

  return {
    contacts,
    unreadContacts,
    unreadCount,
    isLoading,
    error,
    permission,
    refresh,
    requestSystemPermission,
  };
}
