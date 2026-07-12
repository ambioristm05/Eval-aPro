import { BarChart3, BookOpenCheck, ClipboardCheck, FileText, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import ScoreBarChart from '../../components/stats/ScoreBarChart.jsx';
import { useTimedState } from '../../hooks/useTimedState.js';
import { getOverviewStatistics } from '../../services/statisticsService.js';
import { getErrorMessage } from '../../utils/errors.js';

const STATUS_LABELS = {
  active: 'Activo',
  suspended: 'Suspendido',
  deleted: 'Eliminado',
  pending: 'Pendiente',
  draft: 'Borrador',
  published: 'Publicado',
  archived: 'Archivado',
  closed: 'Cerrado',
  completed: 'Completado',
};

function DistributionList({ data = {} }) {
  const entries = Object.entries(data);
  if (!entries.length) return <p className="stats-empty">Sin datos.</p>;
  return (
    <ul className="distribution-list">
      {entries.map(([key, count]) => (
        <li key={key}>
          <span>{STATUS_LABELS[key] ?? key}</span>
          <strong>{count}</strong>
        </li>
      ))}
    </ul>
  );
}

function AdminStatisticsPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useTimedState();

  useEffect(() => {
    let isMounted = true;

    async function fetchStats() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getOverviewStatistics();
        if (isMounted) setStats(data);
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchStats();
    return () => { isMounted = false; };
  }, []);

  const totals = stats?.totals ?? {};
  const distributions = stats?.distributions ?? {};
  const performance = stats?.performance ?? {};

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <BarChart3 size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Estadísticas</h1>
          <p className="dashboard-description">
            Resumen global del sistema: usuarios, actividad académica y rendimiento en evaluaciones.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      {isLoading ? (
        <div className="skeleton-list" aria-label="Cargando estadísticas">
          {[0, 1, 2, 3, 4].map((i) => (
            <div className="skeleton-card" key={i}>
              <span className="skeleton-line skeleton-line-title" />
              <span className="skeleton-line" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="stats-metric-grid">
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><Users size={20} aria-hidden="true" /></span>
              <div>
                <strong>{totals.students ?? 0}</strong>
                <span>Estudiantes</span>
              </div>
            </div>
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><BookOpenCheck size={20} aria-hidden="true" /></span>
              <div>
                <strong>{totals.groups ?? 0}</strong>
                <span>Grupos</span>
              </div>
            </div>
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><ClipboardCheck size={20} aria-hidden="true" /></span>
              <div>
                <strong>{totals.tasks ?? 0}</strong>
                <span>Tareas</span>
              </div>
            </div>
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><ClipboardCheck size={20} aria-hidden="true" /></span>
              <div>
                <strong>{totals.instruments ?? 0}</strong>
                <span>Instrumentos</span>
              </div>
            </div>
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><FileText size={20} aria-hidden="true" /></span>
              <div>
                <strong>{totals.evaluations ?? 0}</strong>
                <span>Evaluaciones</span>
              </div>
            </div>
          </div>

          <div className="stats-grid">
            <section className="dashboard-panel">
              <div className="panel-heading">
                <h2>Distribución de notas</h2>
                <p>Evaluaciones publicadas agrupadas por rango de porcentaje.</p>
              </div>
              <ScoreBarChart distribution={distributions.scores} />

              <div className="panel-heading" style={{ marginTop: '1.5rem' }}>
                <h2>Rendimiento general</h2>
                <p>Sobre evaluaciones publicadas.</p>
              </div>
              <ul className="distribution-list">
                <li><span>Total evaluadas</span><strong>{performance.count ?? 0}</strong></li>
                <li><span>Promedio</span><strong>{performance.average ?? 0}%</strong></li>
                <li><span>Más alta</span><strong>{performance.highest ?? 0}%</strong></li>
                <li><span>Más baja</span><strong>{performance.lowest ?? 0}%</strong></li>
              </ul>
            </section>

            <div className="stats-side">
              <section className="dashboard-panel">
                <div className="panel-heading">
                  <h2>Estudiantes por estado</h2>
                </div>
                <DistributionList data={distributions.studentsByStatus} />
              </section>

              <section className="dashboard-panel">
                <div className="panel-heading">
                  <h2>Tareas por estado</h2>
                </div>
                <DistributionList data={distributions.tasksByStatus} />
              </section>

              <section className="dashboard-panel">
                <div className="panel-heading">
                  <h2>Instrumentos por estado</h2>
                </div>
                <DistributionList data={distributions.instrumentsByStatus} />
              </section>

              <section className="dashboard-panel">
                <div className="panel-heading">
                  <h2>Evaluaciones por estado</h2>
                </div>
                <DistributionList data={distributions.evaluationsByStatus} />
              </section>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default AdminStatisticsPage;
