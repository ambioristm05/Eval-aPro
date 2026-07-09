import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

const CONFIRM_WORD = 'ELIMINAR';

function PermanentDeleteDialog({ open, title, description, requirePassword = false, isBusy = false, onCancel, onConfirm }) {
  const [confirmation, setConfirmation] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (open) {
      setConfirmation('');
      setPassword('');
    }
  }, [open]);

  if (!open) return null;

  const canConfirm = confirmation === CONFIRM_WORD && (!requirePassword || password.length > 0);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canConfirm || isBusy) return;
    onConfirm({ password });
  };

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="confirm-dialog confirm-dialog-danger"
        role="dialog"
        aria-modal="true"
        aria-labelledby="permanent-delete-title"
        aria-describedby="permanent-delete-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="confirm-dialog-icon">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <div className="confirm-dialog-content">
          <h2 id="permanent-delete-title">{title}</h2>
          {description ? <p id="permanent-delete-description">{description}</p> : null}

          <form className="stacked-form compact-form" onSubmit={handleSubmit}>
            <label>
              Escribe {CONFIRM_WORD} para confirmar
              <input
                type="text"
                value={confirmation}
                placeholder={CONFIRM_WORD}
                autoComplete="off"
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>

            {requirePassword ? (
              <label>
                Tu contraseña de administrador
                <input
                  type="password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            ) : null}

            <div className="confirm-dialog-actions">
              <button className="button button-ghost" type="button" onClick={onCancel} disabled={isBusy}>
                Cancelar
              </button>
              <button className="button button-danger" type="submit" disabled={!canConfirm || isBusy}>
                {isBusy ? <span className="button-spinner-ring" aria-hidden="true" /> : null}
                {isBusy ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default PermanentDeleteDialog;
