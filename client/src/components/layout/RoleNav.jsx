import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { roleNavigation } from '../../utils/navigation.jsx';

function getPathname(to) {
  return to.split(/[?#]/)[0];
}

function getHash(to) {
  const hashIndex = to.indexOf('#');
  return hashIndex === -1 ? '' : to.slice(hashIndex);
}

function RoleNav() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({});
  const role = user?.role;
  const links = role ? (roleNavigation[role] ?? []) : [];
  const primaryLinks = links.slice(0, 4);
  const overflowLinks = links.slice(4);
  const evaluatorWorkflowRoutes = [
    '/evaluator/courses',
    '/evaluator/groups',
    '/evaluator/students',
    '/evaluator/instruments',
    '/evaluator/evaluations',
    '/evaluator/reports',
  ];

  useEffect(() => {
    setIsMoreOpen(false);
  }, [location.pathname]);

  if (!user) {
    return null;
  }

  const linkMatchesLocation = (link, { exact = false } = {}) => {
    const pathname = getPathname(link.to);
    const hash = getHash(link.to);
    const matchesOwnPath =
      location.pathname === pathname ||
      (!exact && !hash && location.pathname.startsWith(`${pathname}/`));
    const matchesOwnHash = !hash || (location.pathname === pathname && location.hash === hash);

    return (matchesOwnPath && matchesOwnHash) || link.children?.some((child) => linkMatchesLocation(child));
  };

  const isOverflowActive = overflowLinks.some((link) => linkMatchesLocation(link));

  const isSubmenuOpen = (link) =>
    link.to in openSubmenus ? openSubmenus[link.to] : linkMatchesLocation(link);

  const toggleSubmenu = (link) => {
    setOpenSubmenus((current) => ({ ...current, [link.to]: !isSubmenuOpen(link) }));
  };

  const getWorkflowClassName = (link) => {
    if (role !== 'evaluator') return '';

    const workflowIndex = evaluatorWorkflowRoutes.indexOf(link.to);
    if (workflowIndex === -1) return '';

    return [
      'role-nav-link-workflow',
      workflowIndex === 0 ? 'role-nav-link-workflow-first' : '',
      workflowIndex === evaluatorWorkflowRoutes.length - 1 ? 'role-nav-link-workflow-last' : '',
    ]
      .filter(Boolean)
      .join(' ');
  };

  const navLinkClassName = (link, isOverflow = false) =>
    ({ isActive }) =>
      [
        'role-nav-link',
        isOverflow ? 'role-nav-link-overflow' : '',
        getWorkflowClassName(link),
        isActive || linkMatchesLocation(link) ? 'active' : '',
      ]
        .filter(Boolean)
        .join(' ');

  const renderNavLink = (link, options = {}) => {
    const Icon = link.icon;
    const { className = navLinkClassName(link), role: linkRole } = options;

    return (
      <NavLink className={className} end={link.to === `/${user.role}`} to={link.to} key={link.to} role={linkRole}>
        <Icon size={17} aria-hidden="true" />
        <span>{link.label}</span>
      </NavLink>
    );
  };

  const renderNavItem = (link, isOverflow = false) => {
    if (!link.children?.length) {
      return renderNavLink(link, { className: navLinkClassName(link, isOverflow) });
    }

    const isOpen = isSubmenuOpen(link);

    return (
      <div
        className={`role-nav-item role-nav-item-with-submenu${isOpen ? ' role-nav-item-open' : ''}`}
        key={link.to}
      >
        <div className="role-nav-parent-row">
          {renderNavLink(link, { className: navLinkClassName(link, isOverflow) })}
          <button
            type="button"
            className="role-nav-toggle"
            aria-expanded={isOpen}
            aria-label={isOpen ? `Contraer ${link.label}` : `Expandir ${link.label}`}
            onClick={() => toggleSubmenu(link)}
          >
            <ChevronDown
              size={16}
              aria-hidden="true"
              className={isOpen ? 'role-nav-toggle-icon role-nav-toggle-icon-open' : 'role-nav-toggle-icon'}
            />
          </button>
        </div>
        {isOpen ? (
          <div className="role-nav-submenu" aria-label={`${link.label}: subsecciones`}>
            {link.children.map((child) => {
              const ChildIcon = child.icon;

              return (
                <NavLink
                  className={() => `role-nav-submenu-link${linkMatchesLocation(child, { exact: true }) ? ' active' : ''}`}
                  end={child.to === link.to}
                  to={child.to}
                  key={`${link.to}-${child.label}`}
                >
                  <ChildIcon size={15} aria-hidden="true" />
                  <span>{child.label}</span>
                </NavLink>
              );
            })}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <nav className="role-nav" aria-label="Navegación del rol">
      {primaryLinks.map((link) => renderNavItem(link))}

      {overflowLinks.map((link) => renderNavItem(link, true))}

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
                return (
                  renderNavLink(link, {
                    className: ({ isActive }) =>
                      `role-nav-menu-link${isActive || linkMatchesLocation(link) ? ' active' : ''}`,
                    role: 'menuitem',
                  })
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
