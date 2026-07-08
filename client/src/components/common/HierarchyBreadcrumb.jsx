import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

function HierarchyBreadcrumb({ items }) {
  const visibleItems = items.filter(Boolean);

  return (
    <nav className="hierarchy-breadcrumb" aria-label="Jerarquía académica">
      <Link to="/evaluator/courses" className="hierarchy-breadcrumb-home" aria-label="Cursos">
        <Home size={16} aria-hidden="true" />
        <span>Cursos</span>
      </Link>
      {visibleItems.map((item) => (
        <span className="hierarchy-breadcrumb-item" key={item.label}>
          <ChevronRight size={15} aria-hidden="true" />
          {item.to ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default HierarchyBreadcrumb;
