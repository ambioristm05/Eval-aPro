import { AlertTriangle } from 'lucide-react';

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  isBusy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="confirm-dialog-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className={`confirm-dialog confirm-dialog-${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="confirm-dialog-icon">
          <AlertTriangle size={22} aria-hidden="true" />
        </span>
        <div className="confirm-dialog-content">
          <h2 id="confirm-dialog-title">{title}</h2>
          {description ? <p id="confirm-dialog-description">{description}</p> : null}
        </div>
        <div className="confirm-dialog-actions">
          <button className="button button-ghost" type="button" onClick={onCancel} disabled={isBusy}>
            {cancelLabel}
          </button>
          <button className="button button-danger" type="button" onClick={onConfirm} disabled={isBusy}>
            {isBusy ? <span className="button-spinner-ring" aria-hidden="true" /> : null}
            {isBusy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
