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
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const initialInstruments = [
  {
    id: 'instrument-reading-rubric',
    title: 'Rubrica analitica de lectura',
    description: 'Criterios de comprension, estructura, evidencia y argumentacion.',
    type: 'rubric',
    status: 'active',
    maxScore: 25,
    criteriaCount: 5,
  },
  {
    id: 'instrument-presentation-scale',
    title: 'Escala de presentacion oral',
    description: 'Valoracion de dominio, claridad, recursos y manejo del tiempo.',
    type: 'rating_scale',
    status: 'draft',
    maxScore: 20,
    criteriaCount: 4,
  },
  {
    id: 'instrument-observation-guide',
    title: 'Guia de observacion',
    description: 'Registro de desempeno durante practicas supervisadas.',
    type: 'observation_guide',
    status: 'archived',
    maxScore: 15,
    criteriaCount: 6,
  },
];

const emptyForm = {
  title: '',
  description: '',
  type: 'rubric',
  status: 'draft',
  maxScore: 10,
  criteriaCount: 1,
};

const typeLabels = {
  rubric: 'Rubrica',
  checklist: 'Lista de cotejo',
  rating_scale: 'Escala',
  observation_guide: 'Guia',
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

function EvaluatorInstrumentsPage() {
  const [instruments, setInstruments] = useState(initialInstruments);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredInstruments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return instruments.filter((instrument) => {
      const matchesType = typeFilter === 'all' || instrument.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || instrument.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        instrument.title.toLowerCase().includes(normalizedSearch) ||
        instrument.description.toLowerCase().includes(normalizedSearch) ||
        typeLabels[instrument.type].toLowerCase().includes(normalizedSearch);

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [instruments, searchTerm, typeFilter, statusFilter]);

  const activeCount = instruments.filter((instrument) => instrument.status === 'active').length;
  const draftCount = instruments.filter((instrument) => instrument.status === 'draft').length;
  const totalCriteria = instruments.reduce((total, instrument) => total + instrument.criteriaCount, 0);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedTitle = formData.title.trim();

    if (!normalizedTitle) return;

    const instrumentPayload = {
      title: normalizedTitle,
      description: formData.description.trim(),
      type: formData.type,
      status: formData.status,
      maxScore: Number(formData.maxScore) || 0,
      criteriaCount: Number(formData.criteriaCount) || 0,
    };

    if (editingId) {
      setInstruments((current) =>
        current.map((instrument) =>
          instrument.id === editingId ? { ...instrument, ...instrumentPayload } : instrument,
        ),
      );
      resetForm();
      return;
    }

    setInstruments((current) => [
      { id: `instrument-${Date.now()}`, ...instrumentPayload },
      ...current,
    ]);
    resetForm();
  };

  const handleEdit = (instrument) => {
    setEditingId(instrument.id);
    setFormData({
      title: instrument.title,
      description: instrument.description,
      type: instrument.type,
      status: instrument.status,
      maxScore: instrument.maxScore,
      criteriaCount: instrument.criteriaCount,
    });
  };

  const updateInstrumentStatus = (instrumentId, status) => {
    setInstruments((current) =>
      current.map((instrument) =>
        instrument.id === instrumentId ? { ...instrument, status } : instrument,
      ),
    );
  };

  const deleteInstrument = (instrumentId) => {
    setInstruments((current) => current.filter((instrument) => instrument.id !== instrumentId));

    if (editingId === instrumentId) {
      resetForm();
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
            Organiza rubricas, listas de cotejo, escalas y guias antes de construir sus
            criterios detallados.
          </p>
        </div>
      </div>

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
              Titulo
              <input
                type="text"
                name="title"
                value={formData.title}
                placeholder="Ej. Rubrica de presentacion"
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Descripcion
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
                  <option value="rubric">Rubrica</option>
                  <option value="checklist">Lista de cotejo</option>
                  <option value="rating_scale">Escala de valoracion</option>
                  <option value="observation_guide">Guia de observacion</option>
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
                Puntuacion maxima
                <input
                  type="number"
                  name="maxScore"
                  min="0"
                  value={formData.maxScore}
                  onChange={handleChange}
                />
              </label>
              <label>
                Criterios
                <input
                  type="number"
                  name="criteriaCount"
                  min="0"
                  value={formData.criteriaCount}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="submit">
                {editingId ? <Save size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                {editingId ? 'Guardar cambios' : 'Crear instrumento'}
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
              <h3>Constructor de rubricas</h3>
              <p>Crea criterios, niveles y descripciones por desempeno.</p>
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
              <p>Busca por nombre, descripcion o tipo y filtra el estado.</p>
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
              <option value="rubric">Rubricas</option>
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
                <article className="resource-item" key={instrument.id}>
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
                    <p>{instrument.description || 'Sin descripcion registrada.'}</p>
                    <div className="resource-meta">
                      <span>{typeLabels[instrument.type]}</span>
                      <span>{instrument.criteriaCount} criterios</span>
                      <span>{instrument.maxScore} puntos</span>
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
                      onClick={() => updateInstrumentStatus(instrument.id, 'archived')}
                      title="Archivar"
                      aria-label={`Archivar ${instrument.title}`}
                      disabled={instrument.status === 'archived'}
                    >
                      <Archive size={17} aria-hidden="true" />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      onClick={() => deleteInstrument(instrument.id)}
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
                <h3>No hay instrumentos</h3>
                <p>Ajusta los filtros o crea un instrumento nuevo.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorInstrumentsPage;
