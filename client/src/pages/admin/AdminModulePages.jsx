import { Copy, MailPlus } from 'lucide-react';
import { useState } from 'react';
import ModulePage from '../../components/dashboard/ModulePage.jsx';
import { createEvaluatorInvitation } from '../../services/authService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { moduleIcons } from '../../utils/navigation.jsx';

export function AdminEvaluatorsPage() {
  return (
    <ModulePage
      eyebrow="Administracion"
      title="Gestionar evaluadores"
      description="Espacio privado para crear, aprobar, suspender y revisar cuentas de profesores."
      icon={moduleIcons.UserCog}
      primaryItems={[
        {
          title: 'Crear cuenta',
          description: 'Alta manual de evaluadores con rol protegido.',
        },
        {
          title: 'Cambiar estado',
          description: 'Suspender o reactivar profesores según las reglas del sistema.',
        },
        {
          title: 'Auditoria básica',
          description: 'Registrar quien crea o modifica cuentas sensibles.',
        },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Formulario real', value: 'Pendiente' },
        { label: 'API requerida', value: 'Pendiente' },
      ]}
    />
  );
}

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
          <p className="eyebrow">Administracion</p>
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
                placeholder="profesor@correo.com"
                autoComplete="email"
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Expira en dias
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
              <MailPlus size={18} aria-hidden="true" />
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
              <span>Registro público profesor</span>
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
      eyebrow="Administracion"
      title="Estadísticas generales"
      description="Resumen global para monitorear usuarios, evaluaciones, instrumentos y actividad del sistema."
      icon={moduleIcons.BarChart3}
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
        { label: 'Vista base', value: 'Lista' },
        { label: 'Gráficas', value: 'Pendiente' },
        { label: 'Datos reales', value: 'Pendiente' },
      ]}
    />
  );
}

export function AdminSettingsPage() {
  return (
    <ModulePage
      eyebrow="Administracion"
      title="Configuración"
      description="Ajustes generales de seguridad, permisos y comportamiento del sistema."
      icon={moduleIcons.Settings}
      primaryItems={[
        {
          title: 'Políticas de acceso',
          description: 'Definir reglas para invitaciones y estados bloqueados.',
        },
        {
          title: 'Preferencias de reportes',
          description: 'Preparar opciones de impresión y exportación.',
        },
        {
          title: 'Parámetros académicos',
          description: 'Base para criterios comunes del centro o institución.',
        },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Controles', value: 'Pendiente' },
        { label: 'Persistencia', value: 'Pendiente' },
      ]}
    />
  );
}
