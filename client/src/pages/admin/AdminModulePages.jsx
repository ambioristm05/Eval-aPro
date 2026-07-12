import { Copy, MailPlus } from 'lucide-react';
import { useState } from 'react';
import { useTimedState } from '../../hooks/useTimedState.js';
import { createEvaluatorInvitation } from '../../services/authService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { moduleIcons } from '../../utils/navigation.jsx';

export function AdminInvitationsPage() {
  const [formData, setFormData] = useState({ email: '', expiresInDays: 7 });
  const [invitation, setInvitation] = useState(null);
  const [message, setMessage] = useTimedState();
  const [error, setError] = useTimedState();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      setMessage('Invitación creada correctamente.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
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
    </section>
  );
}

