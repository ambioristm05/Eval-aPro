import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTimedState } from '../../hooks/useTimedState.js';
import { useMessageNotifications } from '../../hooks/useMessageNotifications.js';
import { useAuthStore } from '../../stores/authStore.js';

function getProfilePath(role, contactId = '') {
  const pathByRole = {
    admin: '/admin/profile',
    evaluator: '/evaluator/profile',
    student: '/student/profile',
  };

  const basePath = pathByRole[role] ?? '/';
  return contactId ? `${basePath}?contact=${encodeURIComponent(contactId)}` : basePath;
}

function formatNotificationTime(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildPanelLayout(buttonRect) {
  const panelWidth = Math.min(384, window.innerWidth - 32);
  const isDesktop = window.innerWidth >= 1025;

  if (isDesktop) {
    const left = Math.min(Math.max(16, buttonRect.left), Math.max(16, window.innerWidth - panelWidth - 16));
    const bottom = Math.max(16, window.innerHeight - buttonRect.top + 10);

    return {
      isDesktop,
      style: {
        position: 'fixed',
        left: `${left}px`,
        right: 'auto',
        top: 'auto',
        bottom: `${bottom}px`,
        width: `${panelWidth}px`,
        maxHeight: `min(32rem, calc(100vh - ${bottom + 16}px))`,
        overflowY: 'auto',
      },
    };
  }

  const left = Math.min(
    Math.max(16, buttonRect.right - panelWidth),
    Math.max(16, window.innerWidth - panelWidth - 16),
  );

  return {
    isDesktop,
    style: {
      position: 'fixed',
      left: `${left}px`,
      right: 'auto',
      top: `${buttonRect.bottom + 10}px`,
      bottom: 'auto',
      width: `${panelWidth}px`,
      maxHeight: `min(32rem, calc(100vh - ${buttonRect.bottom + 26}px))`,
      overflowY: 'auto',
    },
  };
}

function MessageNotificationCenter() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useTimedState();
  const [panelLayout, setPanelLayout] = useState({ isDesktop: false, style: {} });
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const {
    unreadContacts,
    unreadCount,
    isLoading,
    error,
    permission,
    requestSystemPermission,
  } = useMessageNotifications({ enabled: Boolean(user) });

  const buttonLabel = useMemo(() => {
    if (!unreadCount) return 'Notificaciones';
    return unreadCount === 1 ? '1 mensaje nuevo' : `${unreadCount} mensajes nuevos`;
  }, [unreadCount]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePanelLayout = () => {
      if (!buttonRef.current) return;
      setPanelLayout(buildPanelLayout(buttonRef.current.getBoundingClientRect()));
    };

    const handlePointerDown = (event) => {
      const panelNode = panelRef.current;
      const buttonNode = buttonRef.current;

      if (panelNode?.contains(event.target) || buttonNode?.contains(event.target)) return;
      setIsOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    updatePanelLayout();
    window.addEventListener('resize', updatePanelLayout);
    window.addEventListener('scroll', updatePanelLayout, true);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('resize', updatePanelLayout);
      window.removeEventListener('scroll', updatePanelLayout, true);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!user) return null;

  const openThreadFromNotification = (contactId) => {
    setIsOpen(false);
    navigate(getProfilePath(user.role, contactId));
  };

  const handleEnableSystemNotifications = async () => {
    const nextPermission = await requestSystemPermission();

    if (nextPermission === 'granted') {
      setMessage('Notificaciones del sistema activadas.');
      return;
    }

    if (nextPermission === 'denied') {
      setMessage('El sistema bloqueó las notificaciones para esta app.');
      return;
    }

    setMessage('No fue posible activar las notificaciones del sistema.');
  };

  const panelContent = isOpen
    ? createPortal(
        <div
          ref={panelRef}
          className={`notification-panel${panelLayout.isDesktop ? ' notification-panel-floating' : ''}`}
          style={panelLayout.style}
          role="dialog"
          aria-label="Notificaciones de mensajes"
        >
          <div className="notification-panel-head">
            <div>
              <strong>Mensajes nuevos</strong>
              <small>Abre una conversación desde aquí.</small>
            </div>
            {permission === 'default' ? (
              <button className="button button-ghost button-compact" type="button" onClick={handleEnableSystemNotifications}>
                Activar sistema
              </button>
            ) : null}
          </div>

          {message ? <p className="form-message form-message-success">{message}</p> : null}
          {error ? <p className="form-message form-message-error">{error}</p> : null}

          {permission === 'denied' ? (
            <p className="notification-panel-note">
              Las notificaciones del sistema están bloqueadas. Puedes habilitarlas desde la configuración del sistema o del navegador.
            </p>
          ) : null}

          {isLoading ? (
            <p className="notification-panel-note">Cargando notificaciones...</p>
          ) : unreadContacts.length ? (
            <div className="notification-list">
              {unreadContacts.map((contact) => (
                <button
                  className="notification-card"
                  key={contact.user.id}
                  type="button"
                  onClick={() => openThreadFromNotification(contact.user.id)}
                >
                  <div className="notification-card-head">
                    <strong>{contact.user.name}</strong>
                    <span className="count-pill">{contact.unreadCount}</span>
                  </div>
                  <small>{contact.lastMessage || 'Tienes un mensaje nuevo.'}</small>
                  <span>{formatNotificationTime(contact.lastMessageAt)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="notification-empty">
              <CheckCheck size={20} aria-hidden="true" />
              <p>No tienes mensajes nuevos.</p>
            </div>
          )}
        </div>,
        document.body,
      )
    : null;

  return (
    <div className="notification-center">
      <button
        ref={buttonRef}
        className={`nav-button notification-button${unreadCount ? ' has-unread' : ''}`}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => setIsOpen((current) => !current)}
      >
        {unreadCount ? <BellRing size={18} aria-hidden="true" /> : <Bell size={18} aria-hidden="true" />}
        <span>{buttonLabel}</span>
        {unreadCount ? <span className="notification-badge">{unreadCount}</span> : null}
      </button>
      {panelContent}
    </div>
  );
}

export default MessageNotificationCenter;
