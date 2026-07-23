import { ArrowRight, FileText, GraduationCap, Printer } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { getDashboardPath } from '../../utils/auth.js';

const moduleCards = [
  {
    icon: GraduationCap,
    title: 'Panel por rol',
    text: 'Admins, evaluadores y estudiantes entran a espacios separados.',
  },
  {
    icon: FileText,
    title: 'Instrumentos',
    text: 'Crea rúbricas, listas de cotejo y escalas para cada actividad.',
  },
  {
    icon: Printer,
    title: 'Reportes',
    text: 'Genera vistas imprimibles y archivos PDF para compartir resultados.',
  },
];

function PublicHomePage() {
  const user = useAuthStore((state) => state.user);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  if (isBootstrapping) {
    return <div className="route-loader">Cargando sesión...</div>;
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return (
    <section className="home-grid">
      <div className="intro-panel">
        <p className="eyebrow">Gestión académica digital</p>
        <h1>EvaluaPro</h1>
        <p className="lead">
          Organiza tareas, instrumentos de evaluación, resultados y reportes en
          un flujo pensado para evaluadores y participantes.
        </p>
        <div className="action-row">
          <Link className="button button-primary" to="/login">
            Entrar
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="button button-secondary" to="/register/student">
            Crear cuenta
          </Link>
        </div>
      </div>

      <div className="module-list" aria-label="Módulos iniciales">
        {moduleCards.map((item) => {
          const Icon = item.icon;

          return (
            <article className="module-card" key={item.title}>
              <span className="module-icon">
                <Icon size={22} aria-hidden="true" />
              </span>
              <div>
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
            </article>
          );
        })}
      </div>
      <p className="home-legal-link">
        <Link to="/legal">Políticas de uso y privacidad</Link>
      </p>
    </section>
  );
}

export default PublicHomePage;
