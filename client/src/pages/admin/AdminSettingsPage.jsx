import { Settings } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTimedState } from '../../hooks/useTimedState.js';
import { getSettings, updateSettings } from '../../services/settingsService.js';
import { getErrorMessage } from '../../utils/errors.js';

const DEFAULTS = {
  institutionName: '',
  evaluatorRegistrationOpen: false,
  invitationExpiryDays: 7,
  minPassingGrade: 60,
  studentPrintDefault: false,
};

function ToggleField({ label, description, checked, onChange, disabled }) {
  return (
    <label className="permission-toggle" style={{ width: '100%' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span className="permission-toggle-track" aria-hidden="true">
        <span className="permission-toggle-thumb" />
      </span>
      <span>
        <strong>{label}</strong>
        {description ? <small className={`permission-status ${checked ? 'permission-status-allowed' : 'permission-status-denied'}`}>{checked ? 'Habilitado' : 'Deshabilitado'}</small> : null}
        {description ? <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--color-muted)', marginTop: '0.15rem' }}>{description}</span> : null}
      </span>
    </label>
  );
}

function AdminSettingsPage() {
  const [form, setForm] = useState(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useTimedState();
  const [message, setMessage] = useTimedState();

  useEffect(() => {
    let isMounted = true;

    async function fetchSettings() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getSettings();
        if (isMounted) {
          setForm({
            institutionName: data.institutionName ?? '',
            evaluatorRegistrationOpen: data.evaluatorRegistrationOpen ?? false,
            invitationExpiryDays: data.invitationExpiryDays ?? 7,
            minPassingGrade: data.minPassingGrade ?? 60,
            studentPrintDefault: data.studentPrintDefault ?? false,
          });
        }
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  const set = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await updateSettings(form);
      setMessage(result.message ?? 'Configuración guardada.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="module-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <Settings size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Configuración</h1>
          <p className="dashboard-description">
            Ajusta los parámetros globales del sistema. Los cambios aplican a toda la plataforma de forma inmediata.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="skeleton-list" aria-label="Cargando configuración">
          {[0, 1, 2].map((i) => (
            <div className="skeleton-card" key={i}>
              <span className="skeleton-line skeleton-line-title" />
              <span className="skeleton-line" />
              <span className="skeleton-line" />
            </div>
          ))}
        </div>
      ) : (
        <form className="settings-form" onSubmit={handleSave}>
          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Institución</h2>
              <p>Datos generales que aparecen en reportes impresos.</p>
            </div>
            <div className="stacked-form compact-form">
              <label>
                Nombre de la institución
                <input
                  type="text"
                  value={form.institutionName}
                  placeholder="Ej. Centro Educativo Nacional"
                  maxLength={120}
                  onChange={(e) => set('institutionName')(e.target.value)}
                  disabled={isSaving}
                />
              </label>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Acceso y registro</h2>
              <p>Controla cómo los evaluadores acceden al sistema.</p>
            </div>
            <div className="stacked-form">
              <ToggleField
                label="Registro público de evaluadores"
                description="Permite que evaluadores se registren sin invitación desde la URL pública."
                checked={form.evaluatorRegistrationOpen}
                onChange={set('evaluatorRegistrationOpen')}
                disabled={isSaving}
              />
              <label>
                Días de expiración de invitaciones (por defecto)
                <input
                  type="number"
                  value={form.invitationExpiryDays}
                  min={1}
                  max={90}
                  onChange={(e) => set('invitationExpiryDays')(Number(e.target.value))}
                  disabled={isSaving}
                />
              </label>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Parámetros académicos</h2>
              <p>Criterios de evaluación aplicados globalmente.</p>
            </div>
            <div className="stacked-form compact-form">
              <label>
                Nota mínima de aprobación (%)
                <input
                  type="number"
                  value={form.minPassingGrade}
                  min={0}
                  max={100}
                  step={1}
                  onChange={(e) => set('minPassingGrade')(Number(e.target.value))}
                  disabled={isSaving}
                />
              </label>
            </div>
          </section>

          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>Reportes</h2>
              <p>Preferencias de impresión y visibilidad para los estudiantes.</p>
            </div>
            <div className="stacked-form">
              <ToggleField
                label="Impresión de reportes habilitada para estudiantes por defecto"
                description="Aplica a nuevos estudiantes. Se puede ajustar individualmente desde cada reporte."
                checked={form.studentPrintDefault}
                onChange={set('studentPrintDefault')}
                disabled={isSaving}
              />
            </div>
          </section>

          <div className="settings-form-footer">
            {error ? <p className="form-message form-message-error" style={{ margin: 0 }}>{error}</p> : null}
            {message ? <p className="form-message form-message-success" style={{ margin: 0 }}>{message}</p> : null}
            <button className="button button-primary" type="submit" disabled={isSaving}>
              {isSaving ? <span className="button-spinner-ring" aria-hidden="true" /> : null}
              {isSaving ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default AdminSettingsPage;
