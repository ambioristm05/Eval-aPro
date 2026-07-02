import {
  Archive,
  CheckSquare,
  ClipboardCheck,
  FileQuestion,
  Gauge,
  ListChecks,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  createResource,
  deleteResource,
  listResource,
  updateResource,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

const emptyForm = {
  title: '',
  description: '',
  type: 'rubric',
  status: 'draft',
  maxScore: 10,
  criteriaCount: 1,
};

const typeLabels = {
  rubric: 'Rúbrica',
  checklist: 'Lista de cotejo',
  rating_scale: 'Escala',
  observation_guide: 'Guía',
  questionnaire: 'Cuestionario',
};

const statusLabels = {
  draft: 'Borrador',
  active: 'Activo',
  archived: 'Archivado',
};

const typeIcons = {
  rubric: ClipboardCheck,
  checklist: CheckSquare,
  rating_scale: Gauge,
  observation_guide: ListChecks,
  questionnaire: FileQuestion,
};

function getId(resource) {
  return resource.id ?? resource._id;
}

function getCriteriaCount(instrument) {
  return (instrument.criteria?.length ?? 0) + (instrument.indicators?.length ?? 0);
}

function buildInstrumentPayload(formData) {
  const count = Math.max(Number(formData.criteriaCount) || 1, 1);
  const maxScore = Math.max(Number(formData.maxScore) || 0, 0);
  const score = count > 0 ? Number((maxScore / count).toFixed(2)) : 0;
  const basePayload = {
    title: formData.title.trim(),
    description: formData.description.trim(),
    type: formData.type,
    status: formData.status,
    criteria: [],
    indicators: [],
  };

  if (formData.type === 'checklist') {
    return {
      ...basePayload,
      indicators: Array.from({ length: count }, (_, index) => ({
        text: `Indicador ${index + 1}`,
        score,
      })),
    };
  }

  return {
    ...basePayload,
    criteria: Array.from({ length: count }, (_, index) => ({
      name: `Criterio ${index + 1}`,
      description: '',
      maxScore: score,
      levels: [],
    })),
  };
}

function EvaluatorInstrumentsPage() {
  const [instruments, setInstruments] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredInstruments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return instruments.filter((instrument) => {
      const matchesType = typeFilter === 'all' || instrument.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || instrument.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        instrument.title.toLowerCase().includes(normalizedSearch) ||
        (instrument.description ?? '').toLowerCase().includes(normalizedSearch) ||
        typeLabels[instrument.type].toLowerCase().includes(normalizedSearch);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [instruments, searchTerm, typeFilter, statusFilter]);

  const activeCount = instruments.filter((instrument) => instrument.status === 'active').length;
  const draftCount = instruments.filter((instrument) => instrument.status === 'draft').length;
  const totalCriteria = instruments.reduce((total, instrument) => total + getCriteriaCount(instrument), 0);

  const loadInstruments = async () => {
    const data = await listResource('instruments', { limit: 100 });
    setInstruments(data.instruments ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchInstruments() {
      setIsLoading(true);
      setError('');

      try {
        const data = await listResource('instruments', { limit: 100 });
        if (!isMounted) return;
        setInstruments(data.instruments ?? []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInstruments();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedTitle = formData.title.trim();
    if (!normalizedTitle) return;

    setIsSubmitting(true);

    try {
      const payload = buildInstrumentPayload(formData);

      if (editingId) {
        await updateResource('instruments', editingId, payload);
        setMessage('Instrumento actualizado correctamente.');
      } else {
        await createResource('instruments', payload);
        setMessage('Instrumento creado correctamente.');
      }

      resetForm();
      await loadInstruments();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (instrument) => {
    setEditingId(getId(instrument));
    setFormData({
      title: instrument.title,
      description: instrument.description ?? '',
      type: instrument.type,
      status: instrument.status,
      maxScore: instrument.maxScore ?? 0,
      criteriaCount: getCriteriaCount(instrument) || 1,
    });
  };

  const updateInstrumentStatus = async (instrumentId, status) => {
    setError('');
    setMessage('');

    try {
      await updateResource('instruments', instrumentId, { status });
      setMessage('Estado de instrumento actualizado.');
      await loadInstruments();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleDeleteInstrument = async (instrumentId) => {
    setError('');
    setMessage('');

    try {
      await deleteResource('instruments', instrumentId);
      setMessage('Instrumento archivado correctamente.');
      if (editingId === instrumentId) resetForm();
      await loadInstruments();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <ClipboardCheck size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>Instrumentos</h1>
          <p className="dashboard-description">
            Organiza rúbricas, listas de cotejo, escalas y guias antes de construir sus
            criterios detallados.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      <div className="metric-grid" aria-label="Resumen de instrumentos">
        <article className="metric-card">
          <span className="metric-icon">
            <ClipboardCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{activeCount}</strong>
            <span>Activos</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Pencil size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{draftCount}</strong>
            <span>Borradores</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <ListChecks size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{totalCriteria}</strong>
            <span>Criterios</span>
          </div>
        </article>
      </div>

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>{editingId ? 'Editar instrumento' : 'Crear instrumento'}</h2>
            <p>Define la ficha general antes del constructor especifico.</p>
          </div>

          <form className="stacked-form compact-form" onSubmit={handleSubmit}>
            <label>
              Título
              <input
                type="text"
                name="title"
                value={formData.title}
                placeholder="Ej. Rúbrica de presentación"
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Descripción
              <textarea
                name="description"
                value={formData.description}
                placeholder="Uso o alcance del instrumento"
                rows="4"
                onChange={handleChange}
              />
            </label>
            <div className="form-two-columns">
              <label>
                Tipo
                <select name="type" value={formData.type} onChange={handleChange}>
                  <option value="rubric">Rúbrica</option>
                  <option value="checklist">Lista de cotejo</option>
                  <option value="rating_scale">Escala de valoración</option>
                  <option value="observation_guide">Guía de observación</option>
                  <option value="questionnaire">Cuestionario</option>
                </select>
              </label>
              <label>
                Estado
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="draft">Borrador</option>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
            </div>
            <div className="form-two-columns">
              <label>
                Puntuación máxima
                <input
                  type="number"
                  name="maxScore"
                  min="0"
                  value={formData.maxScore}
                  onChange={handleChange}
                />
              </label>
              <label>
                Criterios o indicadores
                <input
                  type="number"
                  name="criteriaCount"
                  min="1"
                  value={formData.criteriaCount}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {editingId ? <Save size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear instrumento'}
              </button>
              {editingId ? (
                <button className="button button-secondary" type="button" onClick={resetForm}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <div className="builder-shortcut">
            <ClipboardCheck size={22} aria-hidden="true" />
            <div>
              <h3>Constructor de rúbricas</h3>
              <p>Crea criterios, niveles y descripciones por desempeño.</p>
            </div>
            <Link className="button button-secondary" to="/evaluator/instruments/rubric-builder">
              Abrir
            </Link>
          </div>

          <div className="builder-shortcut">
            <CheckSquare size={22} aria-hidden="true" />
            <div>
              <h3>Constructor de listas</h3>
              <p>Crea indicadores, opciones y puntajes de cotejo.</p>
            </div>
            <Link className="button button-secondary" to="/evaluator/instruments/checklist-builder">
              Abrir
            </Link>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Listado</h2>
              <p>Busca por nombre, descripción o tipo y filtra el estado.</p>
            </div>
            <span className="count-pill">{filteredInstruments.length}</span>
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
              <option value="observation_guide">Guias</option>
              <option value="questionnaire">Cuestionarios</option>
            </select>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Estados</option>
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="archived">Archivado</option>
            </select>
          </div>

          <div className="resource-list">
            {filteredInstruments.map((instrument) => {
              const TypeIcon = typeIcons[instrument.type];

              return (
                <article className="resource-item" key={getId(instrument)}>
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
                      className="icon-button"
                      type="button"
                      onClick={() => handleEdit(instrument)}
                      title="Editar"
                      aria-label={`Editar ${instrument.title}`}
                    >
                      <Pencil size={17} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => updateInstrumentStatus(getId(instrument), 'archived')}
                      title="Archivar"
                      aria-label={`Archivar ${instrument.title}`}
                      disabled={instrument.status === 'archived'}
                    >
                      <Archive size={17} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => handleDeleteInstrument(getId(instrument))}
                      title="Eliminar"
                      aria-label={`Eliminar ${instrument.title}`}
                    >
                      <Trash2 size={17} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}

            {filteredInstruments.length === 0 ? (
              <div className="inline-empty">
                <h3>{isLoading ? 'Cargando instrumentos...' : 'No hay instrumentos'}</h3>
                <p>{isLoading ? 'Espera un momento.' : 'Ajusta los filtros o crea un instrumento nuevo.'}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorInstrumentsPage;
