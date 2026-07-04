import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { roleNavigation } from '../../utils/navigation.jsx';

function RoleNav() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const role = user?.role;
  const links = role ? (roleNavigation[role] ?? []) : [];
  const primaryLinks = links.slice(0, 4);
  const overflowLinks = links.slice(4);
  const isOverflowActive = overflowLinks.some(
    (link) => location.pathname === link.to || location.pathname.startsWith(`${link.to}/`),
  );

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  if (!user) {
    return null;
  }

  const navLinkClassName = (isOverflow = false) =>
    ({ isActive }) => `role-nav-link${isOverflow ? ' role-nav-link-overflow' : ''}${isActive ? ' active' : ''}`;

  return (
    <nav className="role-nav" aria-label="Navegación del rol">
      {primaryLinks.map((link) => {
        const Icon = link.icon;

        return (
          <NavLink className={navLinkClassName()} end={link.to === `/${user.role}`} to={link.to} key={link.to}>
            <Icon size={17} aria-hidden="true" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}

      {overflowLinks.map((link) => {
        const Icon = link.icon;

        return (
          <NavLink
            className={navLinkClassName(true)}
            end={link.to === `/${user.role}`}
            to={link.to}
            key={link.to}
          >
            <Icon size={17} aria-hidden="true" />
            <span>{link.label}</span>
          </NavLink>
        );
      })}

      {overflowLinks.length ? (
        <div className="role-nav-more">
          <button
            className={`role-nav-more-button${isOverflowActive ? ' active' : ''}`}
            type="button"
            aria-expanded={isMoreOpen}
            aria-haspopup="menu"
            onClick={() => setIsMoreOpen((current) => !current)}
          >
            <MoreHorizontal size={18} aria-hidden="true" />
            <span>Más</span>
          </button>

          {isMoreOpen ? (
            <div className="role-nav-more-menu" role="menu">
              {overflowLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <NavLink
                    className={({ isActive }) => `role-nav-menu-link${isActive ? ' active' : ''}`}
                    end={link.to === `/${user.role}`}
                    to={link.to}
                    key={link.to}
                    role="menuitem"
                  >
                    <Icon size={17} aria-hidden="true" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}

export default RoleNav;
