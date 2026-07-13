import { BarChart3, BookOpenCheck, ChevronDown, ClipboardCheck, FileText, GraduationCap, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import ScoreBarChart from '../../components/stats/ScoreBarChart.jsx';
import { useTimedState } from '../../hooks/useTimedState.js';
import { getOverviewStatistics, getStatsByEvaluator } from '../../services/statisticsService.js';
import { getErrorMessage } from '../../utils/errors.js';

const STATUS_LABELS = {
  active: 'Activo', suspended: 'Suspendido', deleted: 'Eliminado',
  pending: 'Pendiente', draft: 'Borrador', published: 'Publicado',
  archived: 'Archivado', closed: 'Cerrado', completed: 'Completado',
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

function EvaluatorRow({ row }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr
        className={`evaluator-drill-row${open ? ' evaluator-drill-row-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <td>
          <span className="evaluator-drill-name">
            <ChevronDown
              size={14}
              aria-hidden="true"
              className={`evaluator-drill-chevron${open ? ' evaluator-drill-chevron-open' : ''}`}
            />
            {row.evaluator.name}
          </span>
          <span className="evaluator-drill-email">{row.evaluator.email}</span>
        </td>
        <td className="num-cell">{row.groupCount}</td>
        <td className="num-cell">{row.studentCount}</td>
        <td className="num-cell">{row.evaluationCount}</td>
        <td className="num-cell">{row.avgScore > 0 ? `${row.avgScore}%` : '—'}</td>
      </tr>
      {open && row.groups.length > 0 ? (
        <tr className="evaluator-drill-detail">
          <td colSpan={5}>
            <ul className="evaluator-groups-list">
              {row.groups.map((g) => (
                <li key={g.id}>
                  <GraduationCap size={13} aria-hidden="true" />
                  <span>{g.name}</span>
                  <strong>{g.studentCount} estudiante{g.studentCount !== 1 ? 's' : ''}</strong>
                </li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function AdminStatisticsPage() {
  const [stats, setStats] = useState(null);
  const [byEvaluator, setByEvaluator] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDrill, setIsLoadingDrill] = useState(true);
  const [error, setError] = useTimedState();

  useEffect(() => {
    let isMounted = true;

    async function fetchAll() {
      setIsLoading(true);
      setIsLoadingDrill(true);
      setError('');

      try {
        const [overview, drill] = await Promise.all([
          getOverviewStatistics(),
          getStatsByEvaluator(),
        ]);
        if (isMounted) {
          setStats(overview);
          setByEvaluator(drill);
        }
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsLoadingDrill(false);
        }
      }
    }

    fetchAll();
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
          {/* Métricas globales */}
          <div className="stats-metric-grid">
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><Users size={20} aria-hidden="true" /></span>
              <div><strong>{totals.students ?? 0}</strong><span>Estudiantes</span></div>
            </div>
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><BookOpenCheck size={20} aria-hidden="true" /></span>
              <div><strong>{totals.groups ?? 0}</strong><span>Grupos</span></div>
            </div>
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><ClipboardCheck size={20} aria-hidden="true" /></span>
              <div><strong>{totals.tasks ?? 0}</strong><span>Tareas</span></div>
            </div>
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><ClipboardCheck size={20} aria-hidden="true" /></span>
              <div><strong>{totals.instruments ?? 0}</strong><span>Instrumentos</span></div>
            </div>
            <div className="metric-card dashboard-panel">
              <span className="metric-icon"><FileText size={20} aria-hidden="true" /></span>
              <div><strong>{totals.evaluations ?? 0}</strong><span>Evaluaciones</span></div>
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
                <div className="panel-heading"><h2>Estudiantes por estado</h2></div>
                <DistributionList data={distributions.studentsByStatus} />
              </section>
              <section className="dashboard-panel">
                <div className="panel-heading"><h2>Tareas por estado</h2></div>
                <DistributionList data={distributions.tasksByStatus} />
              </section>
              <section className="dashboard-panel">
                <div className="panel-heading"><h2>Instrumentos por estado</h2></div>
                <DistributionList data={distributions.instrumentsByStatus} />
              </section>
              <section className="dashboard-panel">
                <div className="panel-heading"><h2>Evaluaciones por estado</h2></div>
                <DistributionList data={distributions.evaluationsByStatus} />
              </section>
            </div>
          </div>

          {/* Desglose por evaluador */}
          <section className="dashboard-panel" style={{ marginTop: '1.5rem' }}>
            <div className="panel-heading">
              <h2>Desglose por evaluador</h2>
              <p>Haz clic en una fila para ver los grupos de ese evaluador.</p>
            </div>

            {isLoadingDrill ? (
              <p className="stats-empty">Cargando…</p>
            ) : byEvaluator.length === 0 ? (
              <p className="stats-empty">No hay evaluadores registrados todavía.</p>
            ) : (
              <div className="table-scroll">
                <table className="data-table evaluator-drill-table">
                  <thead>
                    <tr>
                      <th>Evaluador</th>
                      <th className="num-cell">Grupos</th>
                      <th className="num-cell">Estudiantes</th>
                      <th className="num-cell">Evaluaciones</th>
                      <th className="num-cell">Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byEvaluator.map((row) => (
                      <EvaluatorRow key={row.evaluator.id} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}

export default AdminStatisticsPage;
