import { ChevronDown, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useCourseNavStore } from '../../stores/courseNavStore.js';
import { roleNavigation } from '../../utils/navigation.jsx';

function getPathname(to) {
  return to.split(/[?#]/)[0];
}

function getHash(to) {
  const hashIndex = to.indexOf('#');
  return hashIndex === -1 ? '' : to.slice(hashIndex);
}

function matchesEvaluatorCourseSection(link, pathname, hash) {
  if (link.to === '/evaluator/courses' && link.label === 'Cursos') {
    return pathname === '/evaluator/courses' && !hash;
  }

  if (link.to === '/evaluator/courses/groups' || link.to === '/evaluator/groups') {
    return pathname === '/evaluator/courses/groups' || pathname === '/evaluator/groups';
  }

  if (link.label === 'Módulos') {
    return /^\/evaluator\/courses\/[^/]+$/.test(pathname);
  }

  if (link.label === 'Clases') {
    return /^\/evaluator\/courses\/[^/]+\/modules\/[^/]+(?:\/classes\/archive)?$/.test(pathname);
  }

  if (link.label === 'Tareas') {
    return /^\/evaluator\/courses\/[^/]+\/modules\/[^/]+\/classes\/[^/]+/.test(pathname);
  }

  return null;
}

function getEvaluatorCourseNavTarget(label, courseNav) {
  const { courseId, moduleId, classId } = courseNav;

  if (label === 'Módulos') {
    return courseId ? `/evaluator/courses/${courseId}` : '/evaluator/courses';
  }

  if (label === 'Clases') {
    if (courseId && moduleId) return `/evaluator/courses/${courseId}/modules/${moduleId}`;
    if (courseId) return `/evaluator/courses/${courseId}`;
    return '/evaluator/courses';
  }

  if (label === 'Tareas') {
    if (courseId && moduleId && classId) {
      return `/evaluator/courses/${courseId}/modules/${moduleId}/classes/${classId}`;
    }
    if (courseId && moduleId) return `/evaluator/courses/${courseId}/modules/${moduleId}`;
    if (courseId) return `/evaluator/courses/${courseId}`;
    return '/evaluator/courses';
  }

  return null;
}

function RoleNav() {
  const user = useAuthStore((state) => state.user);
  const courseNav = useCourseNavStore();
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

  const linkMatchesLocation = (link, { exact = false, includeChildren = true } = {}) => {
    if (role === 'evaluator') {
      const evaluatorCourseMatch = matchesEvaluatorCourseSection(link, location.pathname, location.hash);
      if (evaluatorCourseMatch !== null && (!includeChildren || evaluatorCourseMatch)) {
        return evaluatorCourseMatch;
      }
    }

    const pathname = getPathname(link.to);
    const hash = getHash(link.to);
    const matchesOwnPath =
      location.pathname === pathname ||
      (!exact && !hash && location.pathname.startsWith(`${pathname}/`));
    const matchesOwnHash = !hash || (location.pathname === pathname && location.hash === hash);

    return (
      matchesOwnPath &&
      matchesOwnHash
    ) || (
      includeChildren &&
      link.children?.some((child) => linkMatchesLocation(child, { exact: true, includeChildren: false }))
    );
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
        (link.children?.length
          ? linkMatchesLocation(link, { includeChildren: false })
          : isActive || linkMatchesLocation(link))
          ? 'active'
          : '',
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
              const dynamicTo = role === 'evaluator' ? getEvaluatorCourseNavTarget(child.label, courseNav) : null;
              const childTo = dynamicTo ?? child.to;

              return (
                <NavLink
                  className={() =>
                    `role-nav-submenu-link${
                      linkMatchesLocation(child, { exact: true, includeChildren: false }) ? ' active' : ''
                    }`
                  }
                  end={childTo === link.to}
                  to={childTo}
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
