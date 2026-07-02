import { LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../../services/authService.js';
import { useAuthStore } from '../../stores/authStore.js';
import { getDashboardPath } from '../../utils/auth.js';
import { getErrorMessage } from '../../utils/errors.js';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const user = useAuthStore((state) => state.user);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [navigate, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (user) {
      navigate(getDashboardPath(user.role), { replace: true });
      return;
    }

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
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              name="password"
              value={formData.password}
              placeholder="********"
              autoComplete="current-password"
              onChange={handleChange}
              required
            />
          </label>
          {error ? <p className="form-message form-message-error">{error}</p> : null}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            <LogIn size={18} aria-hidden="true" />
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default LoginPage;
