import { CalendarClock, ClipboardList, Search, Users, Weight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getStudentTasks } from '../../services/studentService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const statusLabels = {
  pending: 'Por evaluar',
  completed: 'Evaluada',
};

function formatDate(value) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-DO', { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value)
  );
}

function getGroupName(task) {
  const names = (task.groups ?? []).map((group) => group.name).filter(Boolean);
  return names.length ? names.join(', ') : 'Sin grupo';
}

function getInstrumentName(task) {
  return task.instrument?.title ?? 'Sin instrumento';
}

function normalizeTaskStatus(status) {
  return status === 'completed' ? 'completed' : 'pending';
}

export function StudentTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchTasks = async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await getStudentTasks();
      setTasks(data.tasks ?? []);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialTasks() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getStudentTasks();
        if (!isMounted) return;
        setTasks(data.tasks ?? []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInitialTasks();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || normalizeTaskStatus(task.status) === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        (task.description ?? '').toLowerCase().includes(normalizedSearch) ||
        getGroupName(task).toLowerCase().includes(normalizedSearch) ||
        getInstrumentName(task).toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, searchTerm, statusFilter]);

  const pendingTasks = tasks.filter((task) => normalizeTaskStatus(task.status) === 'pending').length;
  const evaluatedTasks = tasks.filter((task) => normalizeTaskStatus(task.status) === 'completed').length;
  const totalWeight = tasks.reduce((total, task) => total + Number(task.weight || 0), 0);

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <ClipboardList size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Estudiante</p>
          <h1>Mis tareas</h1>
          <p className="dashboard-description">
            Actividades asignadas por tu evaluador con fechas, estado e instrumento asociado.
          </p>
        </div>
      </div>

      {error ? (
        <div className="form-message form-message-error">
          <span>{error}</span>
          <button className="button button-secondary" type="button" onClick={fetchTasks} disabled={isLoading}>
            Reintentar
          </button>
        </div>
      ) : null}

      <div className="metric-grid" aria-label="Resumen de tareas">
        <article className="metric-card">
          <span className="metric-icon">
            <CalendarClock size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : pendingTasks}</strong>
            <span>Por evaluar</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <ClipboardList size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : evaluatedTasks}</strong>
            <span>Evaluadas</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Weight size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : `${totalWeight}%`}</strong>
            <span>Ponderación</span>
          </div>
        </article>
      </div>

      <section className="dashboard-panel">
        <div className="panel-heading panel-heading-row">
          <div>
            <h2>Listado</h2>
            <p>Busca por tarea, grupo o instrumento y filtra por estado.</p>
          </div>
          <span className="count-pill">{filteredTasks.length}</span>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Buscar tarea"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="all">Todas</option>
            <option value="pending">Por evaluar</option>
            <option value="completed">Evaluadas</option>
          </select>
        </div>

        <div className="resource-list">
          {isLoading ? (
            <div className="skeleton-list" aria-label="Cargando tareas asignadas">
              {[0, 1, 2].map((item) => (
                <div className="skeleton-card" key={item}>
                  <span className="skeleton-line skeleton-line-title" />
                  <span className="skeleton-line" />
                  <div className="skeleton-chip-row">
                    <span className="skeleton-chip" />
                    <span className="skeleton-chip" />
                    <span className="skeleton-chip" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTasks.map((task) => (
            <article className="resource-item" key={getId(task)}>
              <div className="resource-main">
                <div className="resource-title-row">
                  <h3>{task.title}</h3>
                  <span className={`status-badge status-${normalizeTaskStatus(task.status)}`}>
                    {statusLabels[normalizeTaskStatus(task.status)]}
                  </span>
                </div>
                <p>{task.description || 'Sin descripción registrada.'}</p>
                <div className="resource-meta">
                  <span>{getGroupName(task)}</span>
                  <span>{getInstrumentName(task)}</span>
                  <span>
                    <Users size={14} aria-hidden="true" />
                    {task.evaluator?.name ?? 'Evaluador'}
                  </span>
                  <span>{task.weight ?? 0}%</span>
                  <span>{formatDate(task.dueDate)}</span>
                </div>
              </div>
            </article>
          ))}

          {!isLoading && filteredTasks.length === 0 ? (
            <div className="inline-empty">
              <h3>No hay tareas</h3>
              <p>Ajusta los filtros o espera nuevas asignaciones.</p>
            </div>
          ) : null}
        </div>
      </section>
    </section>
  );
}
