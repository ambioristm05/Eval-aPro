import { UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { registerEvaluatorWithInvitation, validateInvitation } from '../../services/authService.js';
import { useTimedState } from '../../hooks/useTimedState.js';
import { useAuthStore } from '../../stores/authStore.js';
import { getDashboardPath } from '../../utils/auth.js';
import { getErrorMessage } from '../../utils/errors.js';

function EvaluatorRegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const setSession = useAuthStore((state) => state.setSession);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [status, setStatus] = useState('validating');
  const [error, setError] = useTimedState();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkInvitation() {
      if (!token) {
        setStatus('invalid');
        setError('La invitación no incluye un token válido.');
        return;
      }

      try {
        const result = await validateInvitation(token);
        if (!isMounted) return;

        setFormData((current) => ({ ...current, email: result.invitation.email }));
        setStatus('valid');
      } catch (requestError) {
        if (!isMounted) return;
        setStatus('invalid');
        setError(getErrorMessage(requestError));
      }
    }

    checkInvitation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await registerEvaluatorWithInvitation({ ...formData, token });
      setSession(session);
      navigate(getDashboardPath(session.user.role), { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-page">
      <div className="form-panel">
        <p className="eyebrow">Registro protegido</p>
        <h1>Crear cuenta de evaluador</h1>

        {status === 'validating' ? (
          <p className="form-message">Validando invitación...</p>
        ) : null}

        {status === 'invalid' ? (
          <p className="form-message form-message-error">{error}</p>
        ) : null}

        {status === 'valid' ? (
          <form className="stacked-form" onSubmit={handleSubmit}>
            <label>
              Nombre completo
              <input
                type="text"
                name="name"
                value={formData.name}
                placeholder="Nombre del evaluador"
                autoComplete="name"
                onChange={handleChange}
                required
                minLength={2}
              />
            </label>
            <label>
              Correo electrónico
              <input
                type="email"
                name="email"
                value={formData.email}
                autoComplete="email"
                readOnly
                required
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                name="password"
                value={formData.password}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                onChange={handleChange}
                required
                minLength={8}
              />
            </label>
            {error ? <p className="form-message form-message-error">{error}</p> : null}
            <button className="button button-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span className="button-spinner-ring" aria-hidden="true" />
              ) : (
                <UserPlus size={18} aria-hidden="true" />
              )}
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        ) : null}
      </div>
    </section>
  );
}

export default EvaluatorRegisterPage;
