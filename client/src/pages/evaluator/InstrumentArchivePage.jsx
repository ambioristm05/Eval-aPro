import {
  Archive,
  CheckSquare,
  ClipboardCheck,
  FileQuestion,
  Gauge,
  ListChecks,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PermanentDeleteDialog from '../../components/common/PermanentDeleteDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import {
  deleteResourcePermanent,
  listResource,
  updateResource,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const typeLabels = {
  rubric: 'Rúbrica',
  checklist: 'Lista de cotejo',
  rating_scale: 'Escala',
  observation_guide: 'Guía',
  questionnaire: 'Cuestionario',
};

const typeIcons = {
  rubric: ClipboardCheck,
  checklist: CheckSquare,
  rating_scale: Gauge,
  observation_guide: ListChecks,
  questionnaire: FileQuestion,
};

const statusLabels = {
  archived: 'Archivado',
  deleted: 'Eliminado',
};

function getCriteriaCount(instrument) {
  return (instrument.criteria?.length ?? 0) + (instrument.indicators?.length ?? 0);
}

function InstrumentArchivePage() {
  const [instruments, setInstruments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState('');
  const [permanentTarget, setPermanentTarget] = useState(null);
  const [isDeletingPermanent, setIsDeletingPermanent] = useState(false);

  const filteredInstruments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return instruments.filter((instrument) => {
      const matchesType = typeFilter === 'all' || instrument.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || instrument.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        instrument.title.toLowerCase().includes(normalizedSearch) ||
        (instrument.description ?? '').toLowerCase().includes(normalizedSearch);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [instruments, searchTerm, typeFilter, statusFilter]);

  const archivedCount = instruments.filter((instrument) => instrument.status === 'archived').length;
  const deletedCount = instruments.filter((instrument) => instrument.status === 'deleted').length;

  const loadInstruments = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [archivedData, deletedData] = await Promise.all([
        listResource('instruments', { status: 'archived', limit: 100 }),
        listResource('instruments', { status: 'deleted', limit: 100 }),
      ]);

      setInstruments([...(archivedData.instruments ?? []), ...(deletedData.instruments ?? [])]);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInstruments();
  }, []);

  const restoreInstrument = async (instrument) => {
    const instrumentId = getId(instrument);
    setRestoringId(instrumentId);
    setError('');
    setMessage('');

    try {
      await updateResource('instruments', instrumentId, { status: 'active' });
      setMessage('Instrumento restaurado correctamente.');
      await loadInstruments();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setRestoringId('');
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentTarget) return;
    const instrumentId = getId(permanentTarget);

    setIsDeletingPermanent(true);
    setError('');
    setMessage('');

    try {
      await deleteResourcePermanent('instruments', instrumentId);
      setMessage('Instrumento eliminado de forma definitiva.');
      setPermanentTarget(null);
      await loadInstruments();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsDeletingPermanent(false);
    }
  };

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <Archive size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Instrumentos</p>
          <h1>Instrumentos archivados y eliminados</h1>
          <p className="dashboard-description">
            Consulta las rúbricas, listas y demás instrumentos que salieron del listado activo,
            restáuralos o elimínalos de forma definitiva.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      <div className="metric-grid" aria-label="Resumen de instrumentos archivados y eliminados">
        <article className="metric-card">
          <span className="metric-icon">
            <ClipboardCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(instruments.length)}</strong>
            <span>Total</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Archive size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(archivedCount)}</strong>
            <span>Archivados</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Trash2 size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(deletedCount)}</strong>
            <span>Eliminados</span>
          </div>
        </article>
      </div>

      <section className="dashboard-panel">
        <div className="panel-heading panel-heading-row">
          <div>
            <h2>Archivo de instrumentos</h2>
            <p>Busca por nombre o descripción y filtra por tipo o estado.</p>
          </div>
          <Link className="button button-secondary" to="/evaluator/instruments">
            Volver a instrumentos
          </Link>
        </div>

        <div className="toolbar toolbar-wide">
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Buscar instrumento"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <select
            className="filter-select"
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filtrar por tipo"
          >
            <option value="all">Tipos</option>
            <option value="rubric">Rúbricas</option>
            <option value="checklist">Listas</option>
            <option value="rating_scale">Escalas</option>
            <option value="observation_guide">Guías</option>
            <option value="questionnaire">Cuestionarios</option>
          </select>
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="all">Todos</option>
            <option value="archived">Archivados</option>
            <option value="deleted">Eliminados</option>
          </select>
        </div>

        <div className="resource-list">
          {isLoading ? (
            <div className="skeleton-list" aria-label="Cargando instrumentos archivados y eliminados">
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
          ) : filteredInstruments.map((instrument) => {
            const TypeIcon = typeIcons[instrument.type];
            const instrumentId = getId(instrument);

            return (
              <article className="resource-item" key={instrumentId}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <span className="small-type-icon">
                      <TypeIcon size={16} aria-hidden="true" />
                    </span>
                    <h3>{instrument.title}</h3>
                    <span className={`status-badge status-${instrument.status}`}>
                      {statusLabels[instrument.status]}
                    </span>
                  </div>
                  <p>{instrument.description || 'Sin descripción registrada.'}</p>
                  <div className="resource-meta">
                    <span>{typeLabels[instrument.type]}</span>
                    <span>{getCriteriaCount(instrument)} criterios</span>
                    <span>{instrument.maxScore ?? 0} puntos</span>
                  </div>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${instrument.title}`}>
                  <button
                    className="icon-button labeled"
                    type="button"
                    onClick={() => restoreInstrument(instrument)}
                    disabled={restoringId === instrumentId}
                  >
                    <RotateCcw size={17} aria-hidden="true" />
                    <span>{restoringId === instrumentId ? 'Restaurando...' : 'Restaurar'}</span>
                  </button>
                  <button
                    className="icon-button danger labeled"
                    type="button"
                    onClick={() => setPermanentTarget(instrument)}
                    title="Eliminar definitivamente"
                    aria-label={`Eliminar ${instrument.title} definitivamente`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                    <span>Eliminar definitivamente</span>
                  </button>
                </div>
              </article>
            );
          })}

          {!isLoading && filteredInstruments.length === 0 ? (
            <EmptyState
              title="No hay instrumentos archivados o eliminados"
              description="Cuando archives o elimines instrumentos, aparecerán aquí."
            />
          ) : null}
        </div>
      </section>

      <PermanentDeleteDialog
        open={Boolean(permanentTarget)}
        title={`Eliminar ${permanentTarget?.title ?? ''} definitivamente`}
        description="Esta acción no se puede deshacer. El instrumento se borrará por completo de la base de datos."
        isBusy={isDeletingPermanent}
        onCancel={() => setPermanentTarget(null)}
        onConfirm={handlePermanentDelete}
      />
    </section>
  );
}

export default InstrumentArchivePage;
