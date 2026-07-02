import { ArrowRight, FileText, GraduationCap, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

const moduleCards = [
  {
    icon: GraduationCap,
    title: 'Panel por rol',
    text: 'Admins, evaluadores y estudiantes entran a espacios separados.',
  },
  {
    icon: FileText,
    title: 'Instrumentos',
    text: 'Base preparada para rúbricas, listas de cotejo y escalas.',
  },
  {
    icon: Printer,
    title: 'Reportes',
    text: 'La estructura deja listo el camino para impresión y PDF.',
  },
];

function PublicHomePage() {
  return (
    <section className="home-grid">
      <div className="intro-panel">
        <p className="eyebrow">Gestion académica digital</p>
        <h1>EvalúaPro</h1>
        <p className="lead">
          Organiza tareas, instrumentos de evaluación, resultados y reportes en
          un flujo pensado para profesores y participantes.
        </p>
        <div className="action-row">
          <Link className="button button-primary" to="/login">
            Entrar
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="button button-secondary" to="/register/student">
            Crear cuenta estudiante
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
    </section>
  );
}

export default PublicHomePage;
