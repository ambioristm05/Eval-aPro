import { Search, Trash2, UserCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../../components/common/EmptyState.jsx';
import PermanentDeleteDialog from '../../components/common/PermanentDeleteDialog.jsx';
import { deleteUserPermanent, getEvaluators } from '../../services/adminService.js';
import { useTimedState } from '../../hooks/useTimedState.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const statusLabels = {
  active: 'Activo',
  suspended: 'Suspendido',
  deleted: 'Eliminado',
  pending: 'Pendiente',
};

function AdminEvaluatorsPage() {
  const [evaluators, setEvaluators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useTimedState();
  const [message, setMessage] = useTimedState();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cascadeWarning, setCascadeWarning] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredEvaluators = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return evaluators.filter((evaluator) => {
      const matchesStatus = statusFilter === 'all' || evaluator.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        evaluator.name.toLowerCase().includes(normalizedSearch) ||
        evaluator.email.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [evaluators, searchTerm, statusFilter]);

  const loadEvaluators = async () => {
    const data = await getEvaluators({ limit: 100 });
    setEvaluators(data.evaluators ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchEvaluators() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getEvaluators({ limit: 100 });
        if (!isMounted) return;
        setEvaluators(data.evaluators ?? []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchEvaluators();

    return () => {
      isMounted = false;
    };
  }, []);

  const runPermanentDelete = async (evaluator, password, cascade = false) => {
    setIsDeleting(true);
    setError('');
    setMessage('');

    try {
      const data = await deleteUserPermanent(getId(evaluator), {
        password,
        reason: 'Eliminación definitiva por administrador',
        cascade,
      });
      const cascadeCounts = data.cascade ?? {};
      const cascadeSummary = Object.entries(cascadeCounts)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => `${count} ${key}`)
        .join(', ');

      setMessage(
        cascadeSummary
          ? `Evaluador eliminado de forma definitiva junto con ${cascadeSummary}.`
          : 'Evaluador eliminado de forma definitiva.'
      );
      setDeleteTarget(null);
      setCascadeWarning(null);
      await loadEvaluators();
    } catch (requestError) {
      if (requestError?.response?.status === 409 && !cascade) {
        setCascadeWarning({ evaluator, password });
        setDeleteTarget(null);
        return;
      }
      setError(getErrorMessage(requestError));
      setCascadeWarning(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <UserCog size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Administración</p>
          <h1>Evaluadores</h1>
          <p className="dashboard-description">
            Consulta las cuentas de evaluadores registradas y elimínalas de forma definitiva cuando sea necesario.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      <section className="dashboard-panel">
        <div className="panel-heading panel-heading-row">
          <div>
            <h2>Listado</h2>
            <p>Busca por nombre o correo y filtra por estado de la cuenta.</p>
          </div>
          <span className="count-pill">{filteredEvaluators.length}</span>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Buscar evaluador"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="suspended">Suspendidos</option>
            <option value="deleted">Eliminados</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>

        <div className="resource-list resource-list-inline">
          {isLoading ? (
            <div className="skeleton-list" aria-label="Cargando evaluadores">
              {[0, 1, 2].map((item) => (
                <div className="skeleton-card" key={item}>
                  <span className="skeleton-line skeleton-line-title" />
                  <span className="skeleton-line" />
                  <div className="skeleton-chip-row">
                    <span className="skeleton-chip" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            filteredEvaluators.map((evaluator) => (
              <article className="resource-item" key={getId(evaluator)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{evaluator.name}</h3>
                    <span className={`status-badge status-${evaluator.status}`}>
                      {statusLabels[evaluator.status] ?? evaluator.status}
                    </span>
                  </div>
                  <p>{evaluator.email}</p>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${evaluator.name}`}>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => setDeleteTarget(evaluator)}
                    title="Eliminar definitivamente"
                    aria-label={`Eliminar definitivamente a ${evaluator.name}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))
          )}

          {!isLoading && filteredEvaluators.length === 0 ? (
            <EmptyState title="No hay evaluadores" description="Genera una invitación para dar de alta al primer evaluador." />
          ) : null}
        </div>
      </section>

      <PermanentDeleteDialog
        open={Boolean(deleteTarget)}
        title={`Eliminar definitivamente a ${deleteTarget?.name ?? ''}`}
        description="Esta acción borra la cuenta de la base de datos y no se puede deshacer. Si el evaluador tiene cursos, módulos, clases o tareas, te pediremos confirmación adicional para borrarlos en cascada."
        requirePassword
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={({ password }) => runPermanentDelete(deleteTarget, password, false)}
      />

      <PermanentDeleteDialog
        open={Boolean(cascadeWarning)}
        title={`${cascadeWarning?.evaluator?.name ?? ''} tiene contenido asociado`}
        description="Este evaluador tiene cursos, módulos, clases o tareas propias. Al continuar se eliminarán también de forma permanente junto con la cuenta."
        requirePassword={false}
        isBusy={isDeleting}
        onCancel={() => setCascadeWarning(null)}
        onConfirm={() => runPermanentDelete(cascadeWarning.evaluator, cascadeWarning.password, true)}
      />
    </section>
  );
}

export default AdminEvaluatorsPage;
