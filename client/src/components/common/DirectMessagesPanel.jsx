import { MessageSquareText, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTimedState } from '../../hooks/useTimedState.js';
import { createDirectMessage, getMessageThread, listMessageContacts } from '../../services/messageService.js';
import { getErrorMessage } from '../../utils/errors.js';

function formatMessageTime(value) {
  if (!value) return '';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getRoleLabel(role) {
  const labels = {
    admin: 'Administrador',
    evaluator: 'Evaluador',
    student: 'Estudiante',
  };

  return labels[role] ?? 'Usuario';
}

function getPanelDescription(role) {
  if (role === 'student') return 'Habla con tus evaluadores vinculados por grupo o asignación.';
  if (role === 'evaluator') return 'Conversa con tus estudiantes y con los administradores activos.';
  if (role === 'admin') return 'Mantén comunicación directa con los evaluadores activos.';
  return 'Mensajes directos entre perfiles relacionados.';
}

function DirectMessagesPanel({ role, initialContactId = '' }) {
  const [contacts, setContacts] = useState([]);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');
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
      if (candidate && nextContacts.some((contact) => contact.user.id === candidate)) {
        return candidate;
      }

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
          if (preferredId && nextContacts.some((contact) => contact.user.id === preferredId)) {
            return preferredId;
          }

          if (current && nextContacts.some((contact) => contact.user.id === current)) {
            return current;
          }

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

    return () => {
      isMounted = false;
    };
  }, [initialContactId, setError]);

  useEffect(() => {
    if (!initialContactId || !contacts.some((contact) => contact.user.id === initialContactId)) return;
    setSelectedContactId(initialContactId);
  }, [contacts, initialContactId]);

  useEffect(() => {
    if (!selectedContactId) {
      setThread([]);
      return;
    }

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

    return () => {
      isMounted = false;
    };
  }, [refreshContacts, selectedContactId, setError]);

  const selectedContact = contacts.find((contact) => contact.user.id === selectedContactId) ?? null;

  const handleSendMessage = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const trimmed = draft.trim();
    if (!selectedContactId) {
      setError('Selecciona un contacto para escribir.');
      return;
    }

    if (!trimmed) {
      setError('Escribe un mensaje antes de enviarlo.');
      return;
    }

    setIsSending(true);

    try {
      const data = await createDirectMessage({
        recipientId: selectedContactId,
        body: trimmed,
      });
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

  return (
    <section className="dashboard-panel direct-messages-panel">
      <div className="panel-heading">
        <h2>Mensajes directos</h2>
        <p>{getPanelDescription(role)}</p>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      {isLoadingContacts ? (
        <p className="form-message">Cargando contactos...</p>
      ) : !contacts.length ? (
        <div className="direct-messages-empty">
          <MessageSquareText size={24} aria-hidden="true" />
          <div>
            <strong>No hay contactos disponibles</strong>
            <p>Cuando exista una relación válida entre perfiles, la conversación aparecerá aquí.</p>
          </div>
        </div>
      ) : (
        <div className="direct-messages-layout">
          <aside className="direct-messages-contacts" aria-label="Contactos disponibles">
            {contacts.map((contact) => {
              const isActive = contact.user.id === selectedContactId;

              return (
                <button
                  className={`direct-contact-card${isActive ? ' active' : ''}`}
                  key={contact.user.id}
                  type="button"
                  onClick={() => setSelectedContactId(contact.user.id)}
                >
                  <div className="direct-contact-card-head">
                    <strong>{contact.user.name}</strong>
                    {contact.unreadCount ? <span className="count-pill">{contact.unreadCount}</span> : null}
                  </div>
                  <span>{getRoleLabel(contact.user.role)}</span>
                  <small>{contact.lastMessage || 'Sin mensajes todavía.'}</small>
                </button>
              );
            })}
          </aside>

          <div className="direct-messages-thread">
            <div className="direct-thread-header">
              <div>
                <strong>{selectedContact?.user.name ?? 'Conversación'}</strong>
                <span>{selectedContact ? getRoleLabel(selectedContact.user.role) : 'Sin contacto'}</span>
              </div>
            </div>

            <div className="direct-thread-body" aria-label="Conversación">
              {isLoadingThread ? (
                <p className="form-message">Cargando conversación...</p>
              ) : thread.length ? (
                thread.map((item) => (
                  <article
                    className={`direct-message-bubble direct-message-bubble-${item.direction}`}
                    key={item.id}
                  >
                    <strong>{item.direction === 'incoming' ? item.sender?.name : 'Tú'}</strong>
                    <p>{item.body}</p>
                    <small>{formatMessageTime(item.createdAt)}</small>
                  </article>
                ))
              ) : (
                <p className="direct-thread-empty">
                  Aún no hay mensajes con este contacto. Puedes iniciar la conversación ahora.
                </p>
              )}
            </div>

            <form className="stacked-form compact-form direct-message-form" onSubmit={handleSendMessage}>
              <label>
                Nuevo mensaje
                <textarea
                  value={draft}
                  rows="3"
                  placeholder="Escribe un mensaje breve y directo"
                  onChange={(event) => setDraft(event.target.value)}
                  disabled={!selectedContactId || isSending}
                />
              </label>
              <div className="form-actions">
                <button className="button button-primary" type="submit" disabled={!selectedContactId || isSending}>
                  {isSending ? <span className="button-spinner-ring" aria-hidden="true" /> : <Send size={18} aria-hidden="true" />}
                  {isSending ? 'Enviando...' : 'Enviar mensaje'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default DirectMessagesPanel;
