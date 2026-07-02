import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerStudent } from '../../services/authService.js';
import { useAuthStore } from '../../stores/authStore.js';
import { getDashboardPath } from '../../utils/auth.js';
import { getErrorMessage } from '../../utils/errors.js';

function StudentRegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const session = await registerStudent(formData);
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
        <p className="eyebrow">Registro público</p>
        <h1>Crear cuenta de estudiante</h1>
        <form className="stacked-form" onSubmit={handleSubmit}>
          <label>
            Nombre completo
            <input
              type="text"
              name="name"
              value={formData.name}
              placeholder="Nombre del estudiante"
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
              placeholder="estudiante@correo.com"
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
              placeholder="Mínimo 8 caracteres"
              autoComplete="new-password"
              onChange={handleChange}
              required
              minLength={8}
            />
          </label>
          {error ? <p className="form-message form-message-error">{error}</p> : null}
          <button className="button button-primary" type="submit" disabled={isSubmitting}>
            <UserPlus size={18} aria-hidden="true" />
            {isSubmitting ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default StudentRegisterPage;
