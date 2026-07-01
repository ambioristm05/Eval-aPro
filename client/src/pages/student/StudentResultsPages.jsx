import { Award, FileText, MessageSquareText, Target } from 'lucide-react';
import { calculateAverage, mockEvaluations } from '../../data/mockAcademicData.js';

const publishedEvaluations = mockEvaluations.filter((evaluation) => evaluation.status === 'published');
const finalAverage = calculateAverage(publishedEvaluations);

export function StudentEvaluationsRealPage() {
  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon"><Target size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Estudiante</p>
          <h1>Mis evaluaciones</h1>
          <p className="dashboard-description">Consulta cada evaluacion publicada y su detalle por criterio.</p>
        </div>
      </div>
      <div className="resource-list">
        {publishedEvaluations.map((evaluation) => (
          <article className="dashboard-panel" key={evaluation.id}>
            <div className="panel-heading panel-heading-row">
              <div>
                <h2>{evaluation.task}</h2>
                <p>{evaluation.instrument}</p>
              </div>
              <span className="count-pill">{evaluation.percentage}%</span>
            </div>
            <div className="criteria-grid">
              {evaluation.criteria.map((criterion) => (
                <div className="criterion-score" key={criterion.name}>
                  <span>{criterion.name}</span>
                  <strong>{criterion.score}/{criterion.maxScore}</strong>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StudentResultsRealPage() {
  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon"><Award size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Estudiante</p>
          <h1>Resultados</h1>
          <p className="dashboard-description">Revisa notas publicadas, progreso acumulado y retroalimentacion.</p>
        </div>
      </div>
      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon"><Award size={20} aria-hidden="true" /></span>
          <div><strong>{finalAverage}%</strong><span>Nota acumulada</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><FileText size={20} aria-hidden="true" /></span>
          <div><strong>{publishedEvaluations.length}</strong><span>Resultados</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><MessageSquareText size={20} aria-hidden="true" /></span>
          <div><strong>{publishedEvaluations.flatMap((item) => item.suggestions).length}</strong><span>Sugerencias</span></div>
        </article>
      </div>
      <div className="result-timeline">
        {publishedEvaluations.map((evaluation) => (
          <article className="dashboard-panel" key={evaluation.id}>
            <div className="panel-heading panel-heading-row">
              <div>
                <h2>{evaluation.task}</h2>
                <p>{evaluation.feedback}</p>
              </div>
              <span className="count-pill">{evaluation.score}/{evaluation.maxScore}</span>
            </div>
            <div className="progress-bar" aria-label={`Resultado ${evaluation.percentage}%`}>
              <span style={{ width: `${evaluation.percentage}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function StudentSuggestionsRealPage() {
  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon"><MessageSquareText size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Estudiante</p>
          <h1>Sugerencias de mejora</h1>
          <p className="dashboard-description">Retroalimentacion accionable para reforzar tu avance.</p>
        </div>
      </div>
      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading"><h2>Puntos fuertes</h2><p>Aspectos destacados por el evaluador.</p></div>
          <div className="feature-list">
            {publishedEvaluations.flatMap((evaluation) =>
              evaluation.strengths.map((strength) => (
                <article className="feature-item" key={`${evaluation.id}-${strength}`}>
                  <h3>{evaluation.task}</h3>
                  <p>{strength}</p>
                </article>
              )),
            )}
          </div>
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading"><h2>Por mejorar</h2><p>Acciones sugeridas para proximas entregas.</p></div>
          <div className="feature-list">
            {publishedEvaluations.flatMap((evaluation) =>
              [...evaluation.improvements, ...evaluation.suggestions].map((suggestion) => (
                <article className="feature-item" key={`${evaluation.id}-${suggestion}`}>
                  <h3>{evaluation.task}</h3>
                  <p>{suggestion}</p>
                </article>
              )),
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
