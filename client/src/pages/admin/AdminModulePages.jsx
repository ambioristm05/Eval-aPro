import { Copy, MailPlus } from 'lucide-react';
import { useState } from 'react';
import ModulePage from '../../components/dashboard/ModulePage.jsx';
import { createEvaluatorInvitation } from '../../services/authService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { moduleIcons } from '../../utils/navigation.jsx';

export function AdminInvitationsPage() {
  const [formData, setFormData] = useState({ email: '', expiresInDays: 7 });
  const [invitation, setInvitation] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
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

export function AdminStatisticsPage() {
  return (
    <ModulePage
      eyebrow="Administración"
      title="Estadísticas generales"
      description="Resumen global para monitorear usuarios, evaluaciones, instrumentos y actividad del sistema."
      icon={moduleIcons.BarChart3}
      status="in-progress"
      statusDescription="El panel estadístico está definido como alcance institucional y se integrará con métricas reales del sistema."
      primaryItems={[
        {
          title: 'Usuarios por rol',
          description: 'Distribución entre administradores, evaluadores y estudiantes.',
        },
        {
          title: 'Actividad académica',
          description: 'Cantidad de tareas, instrumentos y evaluaciones publicadas.',
        },
        {
          title: 'Estados de cuenta',
          description: 'Cuentas activas, suspendidas, eliminadas y pendientes.',
        },
      ]}
      statusItems={[
        { label: 'Vista base', value: 'Definida' },
        { label: 'Alcance', value: 'Institucional' },
        { label: 'Datos', value: 'En integración' },
      ]}
    />
  );
}

export function AdminSettingsPage() {
  return (
    <ModulePage
      eyebrow="Administración"
      title="Configuración"
      description="Ajustes generales de seguridad, permisos y comportamiento del sistema."
      icon={moduleIcons.Settings}
      status="in-progress"
      statusDescription="Los ajustes centrales están planteados como módulo administrativo y todavía no guardan cambios persistentes desde esta pantalla."
      primaryItems={[
        {
          title: 'Políticas de acceso',
          description: 'Definir reglas para invitaciones y estados bloqueados.',
        },
        {
          title: 'Preferencias de reportes',
          description: 'Configurar opciones de impresión y exportación.',
        },
        {
          title: 'Parámetros académicos',
          description: 'Base para criterios comunes del centro o institución.',
        },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Disponible' },
        { label: 'Controles', value: 'Seguridad' },
        { label: 'Persistencia', value: 'En integración' },
      ]}
    />
  );
}
