import { ArrowRight, BookOpenCheck, ClipboardCheck, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

const moduleCards = [
  {
    icon: ClipboardCheck,
    title: 'Evaluaciones trazables',
    text: 'Aplica rúbricas y listas de cotejo con criterios claros y resultados consistentes.',
  },
  {
    icon: BookOpenCheck,
    title: 'Seguimiento académico',
    text: 'Consulta tareas, avances, resultados publicados y sugerencias de mejora desde un solo panel.',
  },
  {
    icon: Printer,
    title: 'Reportes imprimibles',
    text: 'Genera reportes listos para revisar, compartir o entregar cuando corresponda.',
  },
];

function PublicHomePage() {
  return (
    <section className="home-grid">
      <div className="intro-panel">
        <p className="eyebrow">Gestión académica digital</p>
        <h1>EvalúaPro</h1>
        <p className="lead">
          Organiza grupos, tareas, instrumentos de evaluación, resultados y reportes
          en una plataforma clara para evaluadores y estudiantes.
        </p>
        <div className="action-row">
          <Link className="button button-primary" to="/login">
            Iniciar sesión
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="button button-secondary" to="/register/student">
            Crear cuenta de estudiante
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
