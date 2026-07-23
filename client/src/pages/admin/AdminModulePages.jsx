import { Clock, Copy, MailPlus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useTimedState } from '../../hooks/useTimedState.js';
import { createEvaluatorInvitation, deleteInvitation, getInvitations } from '../../services/authService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { moduleIcons } from '../../utils/navigation.jsx';

const STATUS_LABEL = { pending: 'Pendiente', used: 'Usada', expired: 'Expirada' };

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function AdminInvitationsPage() {
  const [formData, setFormData] = useState({ email: '', expiresInDays: 7 });
  const [invitation, setInvitation] = useState(null);
  const [message, setMessage] = useTimedState();
  const [error, setError] = useTimedState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadHistory = useCallback(async () => {
    try {
      const data = await getInvitations();
      setHistory(data);
    } catch {
      // historial no crítico, falla silenciosa
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setInvitation(null);
    setIsSubmitting(true);

    try {
      const result = await createEvaluatorInvitation({
        email: formData.email,
        expiresInDays: Number(formData.expiresInDays),
      });
      setInvitation(result);
      setMessage(
        result.emailSent
          ? `Invitación creada y enviada por correo a ${formData.email}.`
          : 'Invitación creada, pero no se pudo enviar el correo. Comparte el enlace manualmente.'
      );
      setFormData({ email: '', expiresInDays: 7 });
      loadHistory();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError('');
    setMessage('');

    try {
      await deleteInvitation(deleteTarget.id);
      setMessage('Invitación eliminada.');
      setDeleteTarget(null);
      await loadHistory();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCopy = async () => {
    if (!invitation?.registrationUrl) return;
    try {
      await navigator.clipboard.writeText(invitation.registrationUrl);
      setMessage('Enlace copiado al portapapeles.');
    } catch {
      setError('No se pudo copiar automáticamente. Copia el enlace manualmente.');
    }
  };

  return (
    <section className="module-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <moduleIcons.KeyRound size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Invitaciones</h1>
          <p className="dashboard-description">
            Genera enlaces de registro para evaluadores sin exponer un formulario público.
          </p>
        </div>
      </div>

      <div className="module-page-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Crear invitación de evaluador</h2>
            <p>El enlace queda asociado al correo indicado y solo puede usarse una vez.</p>
          </div>

          <form className="stacked-form compact-form" onSubmit={handleSubmit}>
            <label>
              Correo del evaluador
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="evaluador@correo.com"
                autoComplete="email"
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Expira en días
              <input
                type="number"
                name="expiresInDays"
                value={formData.expiresInDays}
                min="1"
                max="30"
                onChange={handleChange}
                required
              />
            </label>

            {error ? <p className="form-message form-message-error">{error}</p> : null}
            {message ? <p className="form-message form-message-success">{message}</p> : null}

            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="button-spinner-ring" aria-hidden="true" />
              ) : (
                <MailPlus size={18} aria-hidden="true" />
              )}
              {isSubmitting ? 'Generando...' : 'Generar invitación'}
            </button>
          </form>

          {invitation ? (
            <div className="invitation-result">
              <span>Enlace de registro</span>
              <input type="text" value={invitation.registrationUrl} readOnly />
              <button className="button button-secondary" type="button" onClick={handleCopy}>
                <Copy size={18} aria-hidden="true" />
                Copiar enlace
              </button>
            </div>
          ) : null}
        </section>

        <aside className="dashboard-panel">
          <div className="panel-heading">
            <h2>Estado</h2>
            <p>Control del registro protegido de evaluadores.</p>
          </div>
          <div className="progress-list">
            <div>
              <span>Registro público evaluador</span>
              <strong>Oculto</strong>
            </div>
            <div>
              <span>Generación de enlaces</span>
              <strong>Activa</strong>
            </div>
            <div>
              <span>Uso de invitación</span>
              <strong>Un solo uso</strong>
            </div>
          </div>
        </aside>
      </div>

      {/* Historial */}
      <section className="dashboard-panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-heading">
          <h2>
            <Clock size={18} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.4rem' }} />
            Historial de invitaciones
          </h2>
          <p>Todas las invitaciones generadas con su estado actual.</p>
        </div>

        {isLoadingHistory ? (
          <p className="empty-state-text">Cargando historial…</p>
        ) : history.length === 0 ? (
          <p className="empty-state-text">No hay invitaciones generadas todavía.</p>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th>Creada</th>
                  <th>Expira</th>
                  <th>Usada</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>
              <tbody>
                {history.map((inv) => (
                  <tr key={inv.id}>
                    <td>{inv.email}</td>
                    <td>
                      <span className={`invitation-status invitation-status-${inv.status}`}>
                        {STATUS_LABEL[inv.status]}
                      </span>
                    </td>
                    <td>{formatDate(inv.createdAt)}</td>
                    <td>{formatDate(inv.expiresAt)}</td>
                    <td>{formatDate(inv.usedAt)}</td>
                    <td>
                      <button
                        className="icon-button danger"
                        type="button"
                        onClick={() => setDeleteTarget(inv)}
                        title="Eliminar invitación"
                        aria-label={`Eliminar invitación de ${inv.email}`}
                      >
                        <Trash2 size={17} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Eliminar invitación de ${deleteTarget?.email ?? ''}`}
        description="Esta acción borra el registro del historial de invitaciones y no se puede deshacer. Si el evaluador ya usó el enlace, su cuenta no se ve afectada."
        confirmLabel="Eliminar invitación"
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
}
