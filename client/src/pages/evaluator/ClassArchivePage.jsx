import { Archive, BookOpenCheck, FolderOpen, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import HierarchyBreadcrumb from '../../components/common/HierarchyBreadcrumb.jsx';
import { listModuleClasses, updateResource } from '../../services/resourceService.js';
import { useTimedState } from '../../hooks/useTimedState.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const statusLabels = {
  archived: 'Archivada',
  deleted: 'Eliminada',
};

function ClassArchivePage() {
  const { courseId, moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useTimedState();
  const [message, setMessage] = useTimedState();
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState('');

  const filteredClasses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return classes.filter((academicClass) => {
      const matchesStatus = statusFilter === 'all' || academicClass.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        academicClass.name.toLowerCase().includes(normalizedSearch) ||
        (academicClass.description ?? '').toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [classes, searchTerm, statusFilter]);

  const archivedCount = classes.filter((academicClass) => academicClass.status === 'archived').length;
  const deletedCount = classes.filter((academicClass) => academicClass.status === 'deleted').length;

  const loadArchivedClasses = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [archivedData, deletedData] = await Promise.all([
        listModuleClasses(moduleId, { status: 'archived', limit: 100 }),
        listModuleClasses(moduleId, { status: 'deleted', limit: 100 }),
      ]);

      setModule(archivedData.module ?? deletedData.module);
      setClasses([...(archivedData.classes ?? []), ...(deletedData.classes ?? [])]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedClasses();
  }, [moduleId]);

  const restoreClass = async (academicClass) => {
    const classId = getId(academicClass);
    setIsRestoring(classId);
    setError('');
    setMessage('');

    try {
      await updateResource('classes', classId, { status: 'active' });
      setMessage('Clase restaurada correctamente.');
      await loadArchivedClasses();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsRestoring('');
    }
  };

  return (
    <section className="management-page">
      <HierarchyBreadcrumb
        items={[
          { label: 'Módulos', to: `/evaluator/courses/${getId(module?.course) || courseId}` },
          { label: 'Clases', to: `/evaluator/courses/${courseId}/modules/${getId(module) || moduleId}` },
          { label: 'Clases archivadas y eliminadas' },
        ]}
      />

      <div className="module-hero">
        <span className="module-hero-icon">
          <Archive size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Módulo</p>
          <h1>Clases archivadas y eliminadas</h1>
          <p className="dashboard-description">
            Consulta las clases que salieron del listado activo sin perder su historial.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      <div className="metric-grid" aria-label="Resumen de clases archivadas y eliminadas">
        <article className="metric-card">
          <span className="metric-icon">
            <BookOpenCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(classes.length)}</strong>
            <span>Total</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Archive size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(archivedCount)}</strong>
            <span>Archivadas</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Trash2 size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(deletedCount)}</strong>
            <span>Eliminadas</span>
          </div>
        </article>
      </div>

      <section className="dashboard-panel">
        <div className="panel-heading panel-heading-row">
          <div>
            <h2>Archivo de clases</h2>
            <p>Busca por nombre o fecha y filtra por estado.</p>
          </div>
          <Link className="button button-secondary" to={`/evaluator/courses/${courseId}/modules/${moduleId}`}>
            Volver a clases
          </Link>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Buscar clase"
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
            <option value="archived">Archivadas</option>
            <option value="deleted">Eliminadas</option>
          </select>
        </div>

        <div className="resource-list">
          {isLoading ? (
            <div className="skeleton-list" aria-label="Cargando clases archivadas y eliminadas">
              {[0, 1, 2].map((item) => (
                <div className="skeleton-card" key={item}>
                  <span className="skeleton-line skeleton-line-title" />
                  <span className="skeleton-line" />
                  <div className="skeleton-chip-row">
                    <span className="skeleton-chip" />
                    <span className="skeleton-chip" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredClasses.map((academicClass) => (
            <article className="resource-item" key={getId(academicClass)}>
              <div className="resource-main">
                <div className="resource-title-row">
                  <h3>{academicClass.name}</h3>
                  <span className={`status-badge status-${academicClass.status}`}>
                    {statusLabels[academicClass.status]}
                  </span>
                </div>
                <p>{academicClass.description || 'Sin fecha registrada.'}</p>
              </div>

              <div className="resource-actions" aria-label={`Acciones para ${academicClass.name}`}>
                <Link
                  className="icon-button labeled"
                  to={`/evaluator/courses/${courseId}/modules/${moduleId}/classes/${getId(academicClass)}`}
                  title="Ver tareas"
                  aria-label={`Ver tareas de ${academicClass.name}`}
                >
                  <FolderOpen size={17} aria-hidden="true" />
                  <span>Tareas</span>
                </Link>
                <button
                  className="icon-button labeled"
                  type="button"
                  onClick={() => restoreClass(academicClass)}
                  disabled={isRestoring === getId(academicClass)}
                >
                  <RotateCcw size={17} aria-hidden="true" />
                  <span>{isRestoring === getId(academicClass) ? 'Restaurando...' : 'Restaurar'}</span>
                </button>
              </div>
            </article>
          ))}

          {!isLoading && filteredClasses.length === 0 ? (
            <EmptyState
              title="No hay clases archivadas o eliminadas"
              description="Cuando archives o elimines clases, aparecerán aquí."
            />
          ) : null}
        </div>
      </section>
    </section>
  );
}

export default ClassArchivePage;
