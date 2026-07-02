import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { roleNavigation } from '../../utils/navigation.jsx';

function RoleNav() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return null;
  }

  const links = roleNavigation[user.role] ?? [];

  return (
    <nav className="role-nav" aria-label="Navegación del rol">
      {links.map((link) => {
        const Icon = link.icon;

        return (
          <NavLink end={link.to === `/${user.role}`} to={link.to} key={link.to}>
            <Icon size={17} aria-hidden="true" />
            {link.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default RoleNav;
