import { ChevronLeft, ChevronRight, ShieldAlert } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { getAuditEntities, getAuditLogs } from '../../services/auditService.js';
import { getErrorMessage } from '../../utils/errors.js';

const ACTION_LABELS = {
  'auth.password_reset': 'Cambio de contraseña',
  'course.deleted': 'Curso eliminado',
  'class.deleted': 'Clase eliminada',
  'module.deleted': 'Módulo eliminado',
  'task.deleted': 'Tarea eliminada',
  'instrument.deleted': 'Instrumento eliminado',
  'evaluation.created': 'Evaluación creada',
  'evaluation.updated': 'Evaluación actualizada',
  'evaluation.published': 'Evaluación publicada',
  'user.suspended': 'Usuario suspendido',
  'user.reactivated': 'Usuario reactivado',
  'user.deleted': 'Usuario eliminado',
  'user.permanent_delete': 'Eliminación permanente',
};

function formatDate(iso) {
  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function AdminAuditPage() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [entities, setEntities] = useState([]);
  const [filters, setFilters] = useState({ entity: '', action: '' });
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getAuditEntities().then(setEntities).catch(() => {});
  }, []);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = { page, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const data = await getAuditLogs(params);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const handleFilterChange = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <ShieldAlert size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Registro de auditoría</h1>
          <p className="dashboard-description">
            Historial de acciones críticas realizadas en el sistema.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      <div className="dashboard-panel">
        <div className="toolbar">
          <select
            className="filter-select"
            value={filters.entity}
            onChange={(e) => handleFilterChange('entity', e.target.value)}
          >
            <option value="">Todas las entidades</option>
            {entities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <input
            className="filter-input"
            type="search"
            placeholder="Buscar acción..."
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="skeleton-list">
            {[0, 1, 2, 3, 4].map((i) => (
              <div className="skeleton-card" key={i}>
                <span className="skeleton-line skeleton-line-title" />
                <span className="skeleton-line" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="stats-empty">No hay registros de auditoría.</p>
        ) : (
          <>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Actor</th>
                    <th>Acción</th>
                    <th>Entidad</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id}>
                      <td className="text-muted">{formatDate(log.createdAt)}</td>
                      <td>
                        <span>{log.actor?.name ?? 'Sistema'}</span>
                        {log.actor?.email ? (
                          <span className="evaluator-drill-email">{log.actor.email}</span>
                        ) : null}
                      </td>
                      <td>{ACTION_LABELS[log.action] ?? log.action}</td>
                      <td><span className="tag">{log.entity}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 ? (
              <div className="pagination">
                <button
                  className="button button-ghost"
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                  Anterior
                </button>
                <span className="pagination-info">
                  Página {pagination.page} de {pagination.pages} · {pagination.total} registros
                </span>
                <button
                  className="button button-ghost"
                  type="button"
                  disabled={page >= pagination.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Siguiente
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

export default AdminAuditPage;
