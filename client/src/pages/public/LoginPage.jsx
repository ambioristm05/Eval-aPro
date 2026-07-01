import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login } from '../../services/authService.js';
import { useAuthStore } from '../../stores/authStore.js';
import { getDashboardPath } from '../../utils/auth.js';
import { getErrorMessage } from '../../utils/errors.js';

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
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
        <h1>Iniciar sesion</h1>
        <form className="stacked-form" onSubmit={handleSubmit}>
          <label>
            Correo electronico
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
            Contrasena
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
