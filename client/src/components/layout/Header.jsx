import { LogIn, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserRound, UserPlus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useSidebarStore } from '../../stores/sidebarStore.js';
import MessageNotificationCenter from './MessageNotificationCenter.jsx';

function Header() {
  const user = useAuthStore((state) => state.user);
  const { collapsed, toggle } = useSidebarStore();
  const clearSession = useAuthStore((state) => state.clearSession);
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const showGuestLinks = !user && location.pathname !== '/';
  const hasNavigation = Boolean(user) || showGuestLinks;

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async ({ redirectHome = false } = {}) => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      clearSession();
      setIsMenuOpen(false);
      setIsLoggingOut(false);
      if (redirectHome) navigate('/');
    }
  };

  const handleBrandClick = async (event) => {
    if (!user) return;

    event.preventDefault();
    await handleLogout({ redirectHome: true });
  };

  return (
    <header className="site-header">
      <div className="brand-row">
        <Link to="/" className="brand" aria-label="Ir al inicio de EvalúaPro" onClick={handleBrandClick}>
          <img className="brand-mark" src="/icono-plano.svg" width="40" height="40" alt="" aria-hidden="true" />
          <span className="brand-name">EvalúaPro</span>
        </Link>
        {user ? (
          <button
            type="button"
            className="sidebar-toggle"
            aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
            onClick={toggle}
          >
            {collapsed
              ? <PanelLeftOpen size={18} aria-hidden="true" />
              : <PanelLeftClose size={18} aria-hidden="true" />}
          </button>
        ) : null}
      </div>

      {hasNavigation ? (
        <div className="header-actions">
          {user ? <MessageNotificationCenter /> : null}
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
        </div>
      ) : null}

      {hasNavigation ? (
        <nav
          id="primary-navigation"
          className={`nav-links${isMenuOpen ? ' nav-links-open' : ''}`}
          aria-label="Navegación principal"
        >
          {user ? (
            <>
              <Link className="user-pill" to={`/${user.role}/profile`}>
                <UserRound size={16} aria-hidden="true" />
                <span>{user.name}</span>
              </Link>
              <button
                className="nav-button"
                type="button"
                onClick={() => handleLogout()}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? <span className="button-spinner-ring" aria-hidden="true" /> : <LogOut size={18} aria-hidden="true" />}
                <span>{isLoggingOut ? 'Saliendo...' : 'Salir'}</span>
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
