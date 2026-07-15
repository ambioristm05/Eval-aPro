import { Check, Send, Smile } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTimedState } from '../../hooks/useTimedState.js';
import { createDirectMessage, getMessageThread, listMessageContacts } from '../../services/messageService.js';
import { getErrorMessage } from '../../utils/errors.js';

function formatMessageTime(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('es-DO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getRoleLabel(role) {
  const labels = { admin: 'Administrador', evaluator: 'Evaluador', student: 'Estudiante' };
  return labels[role] ?? 'Usuario';
}

function getPanelDescription(role) {
  if (role === 'student') return 'Habla con tus evaluadores vinculados por grupo o asignación.';
  if (role === 'evaluator') return 'Conversa con tus estudiantes y con los administradores activos.';
  if (role === 'admin') return 'Mantén comunicación directa con los evaluadores activos.';
  return 'Mensajes directos entre perfiles relacionados.';
}

const EMOJI_LIST = [
  '😊','😂','❤️','👍','🙏','😍','🎉','😢','😭','😅',
  '🔥','✅','👏','💪','🤔','😎','🥳','😁','💯','🫂',
  '📚','✏️','📝','🎓','⭐','🏆','💡','📌','🗓️','👀',
];

function DirectMessagesPanel({ role, initialContactId = '' }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef(null);
  const threadBodyRef = useRef(null);
  const emojiWrapperRef = useRef(null);
  const [error, setError] = useTimedState();
  const [message, setMessage] = useTimedState();
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingThread, setIsLoadingThread] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const refreshContacts = useCallback(async (preferredContactId = '') => {
    const data = await listMessageContacts();
    const nextContacts = data.contacts ?? [];
    setContacts(nextContacts);
    setSelectedContactId((current) => {
      const candidate = preferredContactId || initialContactId || current;
      if (candidate && nextContacts.some((c) => c.user.id === candidate)) return candidate;
      return nextContacts[0]?.user.id ?? '';
    });
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function fetchContacts() {
      setIsLoadingContacts(true);
      setError('');
      try {
        const data = await listMessageContacts();
        if (!isMounted) return;
        const nextContacts = data.contacts ?? [];
        setContacts(nextContacts);
        setSelectedContactId((current) => {
          const preferredId = initialContactId || current;
          if (preferredId && nextContacts.some((c) => c.user.id === preferredId)) return preferredId;
          if (current && nextContacts.some((c) => c.user.id === current)) return current;
          return nextContacts[0]?.user.id ?? '';
        });
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoadingContacts(false);
      }
    }
    fetchContacts();
    return () => { isMounted = false; };
  }, [initialContactId, setError]);

  useEffect(() => {
    if (!initialContactId || !contacts.some((c) => c.user.id === initialContactId)) return;
    setSelectedContactId(initialContactId);
  }, [contacts, initialContactId]);

  useEffect(() => {
    if (!selectedContactId) { setThread([]); return; }
    let isMounted = true;
    async function fetchThread() {
      setIsLoadingThread(true);
      setError('');
      try {
        const data = await getMessageThread(selectedContactId);
        if (!isMounted) return;
        setThread(data.messages ?? []);
        await refreshContacts(selectedContactId);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoadingThread(false);
      }
    }
    fetchThread();
    return () => { isMounted = false; };
  }, [refreshContacts, selectedContactId, setError]);

  useEffect(() => {
    const el = threadBodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread]);

  useEffect(() => {
    if (!emojiOpen) return;
    const handleClickOutside = (e) => {
      if (emojiWrapperRef.current && !emojiWrapperRef.current.contains(e.target)) {
        setEmojiOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [emojiOpen]);

  const selectedContact = contacts.find((c) => c.user.id === selectedContactId) ?? null;

  const insertEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) { setDraft((d) => d + emoji); setEmojiOpen(false); return; }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    setEmojiOpen(false);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    const trimmed = draft.trim();
    if (!selectedContactId) { setError('Selecciona un contacto para escribir.'); return; }
    if (!trimmed) { setError('Escribe un mensaje antes de enviarlo.'); return; }
    setIsSending(true);
    try {
      const data = await createDirectMessage({ recipientId: selectedContactId, body: trimmed });
      setThread((current) => [...current, data.message]);
      setDraft('');
      setMessage('Mensaje enviado.');
      await refreshContacts(selectedContactId);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="dm-layout">
      <aside className="dm-contacts" aria-label="Contactos">
        <div className="dm-contacts-header">
          <strong>Mensajes</strong>
          <span>{getPanelDescription(role)}</span>
        </div>
        {error ? <p className="form-message form-message-error">{error}</p> : null}
        {message ? <p className="form-message form-message-success">{message}</p> : null}
        {isLoadingContacts ? (
          <p className="form-message">Cargando contactos...</p>
        ) : !contacts.length ? (
          <p className="dm-contacts-empty">No hay contactos disponibles aún.</p>
        ) : (
          contacts.map((contact) => {
            const isActive = contact.user.id === selectedContactId;
            return (
              <button
                className={`dm-contact-card${isActive ? ' active' : ''}`}
                key={contact.user.id}
                type="button"
                onClick={() => setSelectedContactId(contact.user.id)}
              >
                <div className="dm-contact-card-head">
                  <strong>{contact.user.name}</strong>
                  {contact.unreadCount ? <span className="count-pill">{contact.unreadCount}</span> : null}
                </div>
                <span>{getRoleLabel(contact.user.role)}</span>
                <small>{contact.lastMessage || 'Sin mensajes todavía.'}</small>
              </button>
            );
          })
        )}
      </aside>

      <div className="dm-thread">
        <div className="dm-thread-header">
          <strong>{selectedContact?.user.name ?? 'Conversación'}</strong>
          <span>{selectedContact ? getRoleLabel(selectedContact.user.role) : 'Sin contacto'}</span>
        </div>

        <div className="dm-thread-body" aria-label="Conversación" ref={threadBodyRef}>
          {isLoadingThread ? (
            <p className="form-message">Cargando conversación...</p>
          ) : thread.length ? (
            thread.map((item) => (
              <article
                className={`dm-bubble dm-bubble-${item.direction}`}
                key={item.id}
              >
                {item.direction === 'incoming' && (
                  <span className="dm-bubble-sender">{item.sender?.name}</span>
                )}
                <span className="dm-bubble-body">{item.body}</span>
                <span className="dm-bubble-meta">
                  <span className="dm-bubble-time">{formatMessageTime(item.createdAt)}</span>
                  {item.direction === 'outgoing' && (
                    <span className="dm-ticks" aria-label="Enviado">
                      <Check size={11} />
                      <Check size={11} />
                    </span>
                  )}
                </span>
              </article>
            ))
          ) : (
            <p className="dm-thread-empty">
              Aún no hay mensajes. ¡Inicia la conversación!
            </p>
          )}
        </div>

        <form className="dm-form" onSubmit={handleSendMessage}>
          <div className="dm-input-bar">
            <div className="emoji-picker-wrapper" ref={emojiWrapperRef}>
              <button
                type="button"
                className="dm-icon-btn emoji-trigger"
                aria-label="Insertar emoji"
                disabled={!selectedContactId || isSending}
                onClick={() => setEmojiOpen((o) => !o)}
              >
                <Smile size={28} aria-hidden="true" />
              </button>
              {emojiOpen ? (
                <div className="emoji-picker" role="listbox" aria-label="Emojis">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className="emoji-option"
                      onClick={() => insertEmoji(emoji)}
                      aria-label={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <textarea
              ref={textareaRef}
              className="dm-textarea"
              value={draft}
              rows="1"
              placeholder="Escribe un mensaje..."
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedContactId || isSending}
            />

            <button
              className="dm-send-btn"
              type="submit"
              aria-label="Enviar mensaje"
              disabled={!selectedContactId || isSending}
            >
              {isSending
                ? <span className="button-spinner-ring" aria-hidden="true" />
                : <Send size={18} aria-hidden="true" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DirectMessagesPanel;
