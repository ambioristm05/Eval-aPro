import { Home, MoveLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Astronaut404 from '../../components/common/Astronaut404.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { getDashboardPath } from '../../utils/auth.js';

function NotFoundPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const homeHref = user ? getDashboardPath(user.role) : '/';

  return (
    <div className="not-found-page">
      <Astronaut404 />
      <p className="lead">
        La dirección que ingresaste no existe o fue movida.
      </p>
      <div className="not-found-actions">
        <button type="button" className="button button-secondary" onClick={() => navigate(-1)}>
          <MoveLeft size={16} aria-hidden="true" />
          Volver
        </button>
        <Link to={homeHref} className="button button-primary">
          <Home size={16} aria-hidden="true" />
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}

export default NotFoundPage;
