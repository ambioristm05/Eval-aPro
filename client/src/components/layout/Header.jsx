import { ClipboardCheck, LogIn, LogOut, UserPlus } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { logout } from '../../services/authService.js';
import { useAuthStore } from '../../stores/authStore.js';

function Header() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearSession();
    }
  };

  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Ir al inicio de EvaluaPro">
        <span className="brand-mark">
          <ClipboardCheck size={22} aria-hidden="true" />
        </span>
        <span>EvaluaPro</span>
      </Link>

      <nav className="nav-links" aria-label="Navegacion principal">
        {user ? (
          <>
            <span className="user-pill">{user.name}</span>
            <button className="nav-button" type="button" onClick={handleLogout}>
              <LogOut size={18} aria-hidden="true" />
              Salir
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">
              <LogIn size={18} aria-hidden="true" />
              Iniciar sesion
            </NavLink>
            <NavLink to="/register/student">
              <UserPlus size={18} aria-hidden="true" />
              Registro estudiante
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
