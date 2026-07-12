import { BarChart3, BookOpenCheck, ClipboardCheck, FileText, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import ScoreBarChart from '../../components/stats/ScoreBarChart.jsx';
import { useTimedState } from '../../hooks/useTimedState.js';
import {
  getGroupStatistics,
  getInstrumentStatistics,
  getOverviewStatistics,
  getTaskStatistics,
} from '../../services/statisticsService.js';
import { listResource } from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

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

const DETAIL_TYPES = [
  { value: 'group', label: 'Por grupo' },
  { value: 'task', label: 'Por tarea' },
  { value: 'instrument', label: 'Por instrumento' },
];

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

function PerformanceSummary({ performance = {}, extra = null }) {
  return (
    <ul className="distribution-list">
      <li><span>Total evaluadas</span><strong>{performance.count ?? 0}</strong></li>
      <li><span>Promedio</span><strong>{performance.average ?? 0}%</strong></li>
      <li><span>Más alta</span><strong>{performance.highest ?? 0}%</strong></li>
      <li><span>Más baja</span><strong>{performance.lowest ?? 0}%</strong></li>
      {extra}
    </ul>
  );
}

function EvaluatorStatisticsPage() {
  const [overview, setOverview] = useState(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [error, setError] = useTimedState();

  const [detailType, setDetailType] = useState('group');
  const [groups, setGroups] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useTimedState();

  useEffect(() => {
    let isMounted = true;

    async function fetchOverview() {
      setIsLoadingOverview(true);
      setError('');
      try {
        const data = await getOverviewStatistics();
        if (isMounted) setOverview(data);
      } catch (requestError) {
        if (isMounted) setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoadingOverview(false);
      }
    }

    fetchOverview();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchCatalogs() {
      try {
        const [groupsData, tasksData, instrumentsData] = await Promise.all([
          listResource('groups', { limit: 100 }),
          listResource('tasks', { limit: 100 }),
          listResource('instruments', { limit: 100 }),
        ]);
        if (!isMounted) return;
        setGroups(groupsData.groups ?? []);
        setTasks(tasksData.tasks ?? []);
        setInstruments(instrumentsData.instruments ?? []);
      } catch {
        // catalogs are best-effort
      }
    }

    fetchCatalogs();
    return () => { isMounted = false; };
  }, []);

  const activeOptions =
    detailType === 'group' ? groups :
    detailType === 'task' ? tasks :
    instruments;

  useEffect(() => {
    const first = activeOptions[0];
    setSelectedId(first ? getId(first) : '');
    setDetail(null);
  }, [detailType, activeOptions]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }

    let isMounted = true;

    async function fetchDetail() {
      setIsLoadingDetail(true);
      setDetailError('');
      try {
        let data;
        if (detailType === 'group') data = await getGroupStatistics(selectedId);
        else if (detailType === 'task') data = await getTaskStatistics(selectedId);
        else data = await getInstrumentStatistics(selectedId);
        if (isMounted) setDetail(data);
      } catch (requestError) {
        if (isMounted) setDetailError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoadingDetail(false);
      }
    }

    fetchDetail();
    return () => { isMounted = false; };
  }, [detailType, selectedId]);

  const totals = overview?.totals ?? {};
  const distributions = overview?.distributions ?? {};
  const performance = overview?.performance ?? {};

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <BarChart3 size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>Estadísticas</h1>
          <p className="dashboard-description">
            Métricas de tu actividad académica: grupos, tareas, instrumentos y rendimiento de evaluaciones.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      {isLoadingOverview ? (
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
              <PerformanceSummary performance={performance} />
            </section>

            <div className="stats-side">
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

          <section className="dashboard-panel">
            <div className="panel-heading panel-heading-row">
              <div>
                <h2>Detalle</h2>
                <p>Consulta el rendimiento de un grupo, tarea o instrumento específico.</p>
              </div>
            </div>

            <div className="toolbar">
              <select
                className="filter-select"
                value={detailType}
                onChange={(e) => setDetailType(e.target.value)}
              >
                {DETAIL_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select
                className="filter-select"
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setDetail(null); }}
                disabled={!activeOptions.length}
              >
                {activeOptions.length === 0 ? (
                  <option value="">Sin {DETAIL_TYPES.find((t) => t.value === detailType)?.label.toLowerCase()}</option>
                ) : (
                  activeOptions.map((option) => (
                    <option key={getId(option)} value={getId(option)}>
                      {option.name ?? option.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            {detailError ? <p className="form-message form-message-error">{detailError}</p> : null}

            {isLoadingDetail ? (
              <div className="skeleton-list" aria-label="Cargando detalle">
                {[0, 1].map((i) => (
                  <div className="skeleton-card" key={i}>
                    <span className="skeleton-line skeleton-line-title" />
                    <span className="skeleton-line" />
                  </div>
                ))}
              </div>
            ) : detail ? (
              <div className="stats-detail-grid">
                <div>
                  <h3 className="stats-detail-heading">Rendimiento</h3>
                  <PerformanceSummary
                    performance={detail.performance}
                    extra={
                      detail.completion ? (
                        <>
                          <li><span>Asignados</span><strong>{detail.completion.assigned}</strong></li>
                          <li><span>Evaluados</span><strong>{detail.completion.evaluated}</strong></li>
                          <li><span>Tasa de completitud</span><strong>{detail.completion.rate}%</strong></li>
                        </>
                      ) : null
                    }
                  />
                </div>
                <div>
                  <h3 className="stats-detail-heading">Distribución de notas</h3>
                  <ScoreBarChart distribution={detail.distribution} />
                </div>
                {detail.topStudents?.length > 0 ? (
                  <div className="stats-detail-full">
                    <h3 className="stats-detail-heading">Top estudiantes</h3>
                    <ul className="distribution-list">
                      {detail.topStudents.map((entry) => (
                        <li key={getId(entry.student)}>
                          <span>{entry.student.name}</span>
                          <strong>{entry.average}%</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {detail.usageByTask?.length > 0 ? (
                  <div className="stats-detail-full">
                    <h3 className="stats-detail-heading">Uso por tarea</h3>
                    <ul className="distribution-list">
                      {detail.usageByTask.map((entry) => (
                        <li key={getId(entry.task)}>
                          <span>{entry.task.title}</span>
                          <strong>{entry.evaluations} eval · {entry.average}%</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : !selectedId ? (
              <p className="stats-empty">Selecciona un elemento para ver su detalle.</p>
            ) : null}
          </section>
        </>
      )}
    </section>
  );
}

export default EvaluatorStatisticsPage;
