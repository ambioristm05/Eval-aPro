import { Eye, EyeOff, LoaderCircle, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, requestPasswordReset } from '../../services/authService.js';
import { useAuthStore } from '../../stores/authStore.js';
import { getDashboardPath } from '../../utils/auth.js';
import { useTimedState } from '../../hooks/useTimedState.js';
import { getErrorMessage } from '../../utils/errors.js';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [forgotEmailError, setForgotEmailError] = useState('');
  const [error, setError] = useTimedState();
  const [resetMessage, setResetMessage] = useTimedState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [navigate, user]);

  const validateEmail = (value) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) return 'El correo electrónico es obligatorio.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedValue)) return 'Ingresa un correo electrónico válido.';
    return '';
  };

  const validateLoginForm = (values) => {
    const nextErrors = {};
    const emailError = validateEmail(values.email);

    if (emailError) nextErrors.email = emailError;
    if (!values.password) nextErrors.password = 'La contraseña es obligatoria.';

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const nextErrors = validateLoginForm({ ...formData, [name]: value });
    setFieldErrors((current) => ({ ...current, [name]: nextErrors[name] ?? '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
      return;
    }

    const nextErrors = validateLoginForm(formData);
    setFieldErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      const session = await login(formData);
      setSession(session);
      const fallbackPath = getDashboardPath(session.user.role);
      navigate(location.state?.from?.pathname ?? fallbackPath, { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResetMessage('');

    const email = forgotEmail || formData.email;
    const emailError = validateEmail(email);
    setForgotEmailError(emailError);

    if (emailError) return;

    setIsResetSubmitting(true);

    try {
      const result = await requestPasswordReset(email);
      setResetMessage(result.message);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <section className="form-page">
      <div className="form-panel">
        <p className="eyebrow">Acceso seguro</p>
        <h1>Iniciar sesión</h1>
        <form className="stacked-form" onSubmit={handleSubmit}>
          <label>
            Correo electrónico
            <input
              type="email"
              name="email"
              value={formData.email}
              placeholder="usuario@correo.com"
              autoComplete="email"
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              required
            />
            {fieldErrors.email ? <span className="field-error" id="login-email-error">{fieldErrors.email}</span> : null}
          </label>
          <label>
            Contraseña
            <span className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                placeholder="********"
                autoComplete="current-password"
                onChange={handleChange}
                onBlur={handleBlur}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </span>
            {fieldErrors.password ? <span className="field-error" id="login-password-error">{fieldErrors.password}</span> : null}
          </label>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setShowForgotPassword((current) => !current);
              setForgotEmail(formData.email);
              setResetMessage('');
            }}
          >
            ¿Olvidaste tu contraseña?
          </button>
          {error ? <p className="form-message form-message-error">{error}</p> : null}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? <LoaderCircle className="button-spinner" size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {showForgotPassword ? (
          <form className="stacked-form forgot-password-form" onSubmit={handleForgotSubmit}>
            <label>
              Correo para restablecer acceso
              <input
                type="email"
                value={forgotEmail}
                placeholder="usuario@correo.com"
                autoComplete="email"
                onChange={(event) => {
                  setForgotEmail(event.target.value);
                  setForgotEmailError('');
                }}
                aria-invalid={Boolean(forgotEmailError)}
                aria-describedby={forgotEmailError ? 'forgot-email-error' : undefined}
                required
              />
              {forgotEmailError ? <span className="field-error" id="forgot-email-error">{forgotEmailError}</span> : null}
            </label>
            {resetMessage ? <p className="form-message form-message-success">{resetMessage}</p> : null}
            <button className="button button-secondary" type="submit" disabled={isResetSubmitting}>
              {isResetSubmitting ? <LoaderCircle className="button-spinner" size={18} aria-hidden="true" /> : null}
              {isResetSubmitting ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

export default LoginPage;
