import { LogIn, LogOut, Menu, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { logout } from '../../services/authService.js';
import { useAuthStore } from '../../stores/authStore.js';

function Header() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const showGuestLinks = !user && location.pathname !== '/';
  const hasNavigation = Boolean(user) || showGuestLinks;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      clearSession();
      setIsMenuOpen(false);
    }
  };

  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Ir al inicio de EvalúaPro">
        <img className="brand-mark" src="/icono-plano.svg" width="40" height="40" alt="" aria-hidden="true" />
        <span>EvalúaPro</span>
      </Link>

      {hasNavigation ? (
        <button
          className="header-menu-button"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="primary-navigation"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setIsMenuOpen((current) => !current)}
        >
          {isMenuOpen ? <X size={19} aria-hidden="true" /> : <Menu size={19} aria-hidden="true" />}
        </button>
      ) : null}

      {hasNavigation ? (
        <nav
          id="primary-navigation"
          className={`nav-links${isMenuOpen ? ' nav-links-open' : ''}`}
          aria-label="Navegación principal"
        >
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
                Iniciar sesión
              </NavLink>
              <NavLink to="/register/student">
                <UserPlus size={18} aria-hidden="true" />
                Registro estudiante
              </NavLink>
            </>
          )}
        </nav>
      ) : null}
    </header>
  );
}

export default Header;
