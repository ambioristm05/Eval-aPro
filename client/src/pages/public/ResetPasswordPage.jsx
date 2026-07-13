import { Eye, EyeOff, KeyRound, LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../services/authService.js';
import { getErrorMessage } from '../../utils/errors.js';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate('/login', { replace: true }), 3000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  if (!token) {
    return (
      <section className="form-page">
        <div className="form-panel">
          <p className="eyebrow">Recuperar contraseña</p>
          <h1>Enlace inválido</h1>
          <p className="lead">Este enlace de recuperación no es válido o ya expiró.</p>
          <Link to="/login" className="button button-primary" style={{ marginTop: '0.5rem' }}>
            Volver al inicio de sesión
          </Link>
        </div>
      </section>
    );
  }

  const validate = () => {
    const errors = {};
    if (password.length < 8) errors.password = 'La contraseña debe tener al menos 8 caracteres.';
    if (password !== confirm) errors.confirm = 'Las contraseñas no coinciden.';
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <section className="form-page">
        <div className="form-panel">
          <p className="eyebrow">Recuperar contraseña</p>
          <h1>¡Contraseña actualizada!</h1>
          <p className="lead">Tu contraseña fue cambiada correctamente. Redirigiendo al inicio de sesión…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="form-page">
      <div className="form-panel">
        <p className="eyebrow">Recuperar contraseña</p>
        <h1>Nueva contraseña</h1>
        <form className="stacked-form" onSubmit={handleSubmit}>
          <label>
            Nueva contraseña
            <span className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((c) => ({ ...c, password: '' })); }}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'rp-password-error' : undefined}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((c) => !c)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </span>
            {fieldErrors.password ? <span className="field-error" id="rp-password-error">{fieldErrors.password}</span> : null}
          </label>

          <label>
            Confirmar contraseña
            <span className="password-field">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                placeholder="Repite la contraseña"
                autoComplete="new-password"
                onChange={(e) => { setConfirm(e.target.value); setFieldErrors((c) => ({ ...c, confirm: '' })); }}
                aria-invalid={Boolean(fieldErrors.confirm)}
                aria-describedby={fieldErrors.confirm ? 'rp-confirm-error' : undefined}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirm((c) => !c)}
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirm ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </span>
            {fieldErrors.confirm ? <span className="field-error" id="rp-confirm-error">{fieldErrors.confirm}</span> : null}
          </label>

          {error ? <p className="form-message form-message-error">{error}</p> : null}

          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="button-spinner" size={18} aria-hidden="true" /> : <KeyRound size={18} aria-hidden="true" />}
            {isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ResetPasswordPage;
