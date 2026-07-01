import {
  CheckSquare,
  Copy,
  ListChecks,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { createResource } from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

const initialIndicators = [
  {
    id: 'indicator-introduction',
    text: 'Presenta una introduccion clara al tema.',
    score: 2,
    required: true,
    observation: 'Verificar que contextualice el proposito de la actividad.',
  },
  {
    id: 'indicator-evidence',
    text: 'Incluye evidencias o ejemplos pertinentes.',
    score: 3,
    required: true,
    observation: 'Puede validarse con citas, datos o demostraciones.',
  },
  {
    id: 'indicator-delivery',
    text: 'Entrega el trabajo dentro del plazo indicado.',
    score: 1,
    required: false,
    observation: '',
  },
];

const initialOptions = [
  { id: 'option-yes', label: 'Si', scoreFactor: 1 },
  { id: 'option-partial', label: 'Parcial', scoreFactor: 0.5 },
  { id: 'option-no', label: 'No', scoreFactor: 0 },
];

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function ChecklistBuilderPage() {
  const [checklist, setChecklist] = useState({
    title: 'Lista de cotejo para exposicion',
    description: 'Indicadores observables para revisar entregas y presentaciones.',
    status: 'draft',
  });
  const [options, setOptions] = useState(initialOptions);
  const [indicators, setIndicators] = useState(initialIndicators);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const maxScore = useMemo(
    () => indicators.reduce((total, indicator) => total + Number(indicator.score || 0), 0),
    [indicators],
  );

  const requiredCount = indicators.filter((indicator) => indicator.required).length;

  const handleChecklistChange = (event) => {
    const { name, value } = event.target;
    setChecklist((current) => ({ ...current, [name]: value }));
  };

  const updateOption = (optionId, field, value) => {
    setOptions((current) =>
      current.map((option) =>
        option.id === optionId
          ? {
              ...option,
              [field]: field === 'scoreFactor' ? Number(value) : value,
            }
          : option,
      ),
    );
  };

  const addOption = () => {
    setOptions((current) => [
      ...current,
      { id: createId('option'), label: 'Nueva opcion', scoreFactor: 0 },
    ]);
  };

  const removeOption = (optionId) => {
    if (options.length <= 2) return;
    setOptions((current) => current.filter((option) => option.id !== optionId));
  };

  const updateIndicator = (indicatorId, field, value) => {
    setIndicators((current) =>
      current.map((indicator) =>
        indicator.id === indicatorId
          ? {
              ...indicator,
              [field]:
                field === 'score'
                  ? Number(value)
                  : field === 'required'
                    ? value === 'true'
                    : value,
            }
          : indicator,
      ),
    );
  };

  const addIndicator = () => {
    setIndicators((current) => [
      ...current,
      {
        id: createId('indicator'),
        text: 'Nuevo indicador observable.',
        score: 1,
        required: false,
        observation: '',
      },
    ]);
  };

  const duplicateIndicator = (indicator) => {
    setIndicators((current) => [
      ...current,
      {
        ...indicator,
        id: createId('indicator'),
        text: `${indicator.text} copia`,
      },
    ]);
  };

  const removeIndicator = (indicatorId) => {
    if (indicators.length <= 1) return;
    setIndicators((current) => current.filter((indicator) => indicator.id !== indicatorId));
  };

  const handleSave = async () => {
    setError('');
    setSavedMessage('');
    setIsSaving(true);

    try {
      await createResource('instruments', {
        title: checklist.title,
        description: checklist.description,
        type: 'checklist',
        status: checklist.status,
        criteria: [],
        indicators: indicators.map((indicator) => ({
          text: indicator.text,
          score: Number(indicator.score) || 0,
        })),
      });

      setSavedMessage('Lista de cotejo guardada en la base de datos.');
      window.setTimeout(() => setSavedMessage(''), 2600);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="builder-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <CheckSquare size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Instrumentos</p>
          <h1>Constructor de listas</h1>
          <p className="dashboard-description">
            Define indicadores observables, opciones de respuesta y puntajes para una
            lista de cotejo reutilizable.
          </p>
        </div>
      </div>

      <div className="metric-grid" aria-label="Resumen de lista de cotejo">
        <article className="metric-card">
          <span className="metric-icon">
            <ListChecks size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{indicators.length}</strong>
            <span>Indicadores</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <CheckSquare size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{options.length}</strong>
            <span>Opciones</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Save size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{maxScore}</strong>
            <span>Puntos maximos</span>
          </div>
        </article>
      </div>

      <div className="builder-layout">
        <aside className="dashboard-panel">
          <div className="panel-heading">
            <h2>Ficha de la lista</h2>
            <p>Datos generales del instrumento.</p>
          </div>

          <form className="stacked-form compact-form">
            <label>
              Titulo
              <input name="title" value={checklist.title} onChange={handleChecklistChange} />
            </label>
            <label>
              Descripcion
              <textarea
                name="description"
                value={checklist.description}
                rows="4"
                onChange={handleChecklistChange}
              />
            </label>
            <label>
              Estado
              <select name="status" value={checklist.status} onChange={handleChecklistChange}>
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="archived">Archivado</option>
              </select>
            </label>
          </form>

          <div className="builder-actions">
            <button className="button button-primary" type="button" onClick={handleSave} disabled={isSaving}>
              <Save size={18} aria-hidden="true" />
              {isSaving ? 'Guardando...' : 'Guardar borrador'}
            </button>
            {error ? <p className="form-message form-message-error">{error}</p> : null}
            {savedMessage ? <p className="form-message form-message-success">{savedMessage}</p> : null}
          </div>
        </aside>

        <section className="dashboard-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Opciones de respuesta</h2>
              <p>Configura etiquetas y factor de puntaje por opcion.</p>
            </div>
            <button className="button button-secondary" type="button" onClick={addOption}>
              <Plus size={18} aria-hidden="true" />
              Opcion
            </button>
          </div>

          <div className="level-list">
            {options.map((option) => (
              <article className="option-item" key={option.id}>
                <label>
                  Etiqueta
                  <input
                    value={option.label}
                    onChange={(event) => updateOption(option.id, 'label', event.target.value)}
                  />
                </label>
                <label>
                  Factor
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.25"
                    value={option.scoreFactor}
                    onChange={(event) => updateOption(option.id, 'scoreFactor', event.target.value)}
                  />
                </label>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => removeOption(option.id)}
                  disabled={options.length <= 2}
                  title="Eliminar opcion"
                  aria-label={`Eliminar opcion ${option.label}`}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-panel">
        <div className="panel-heading panel-heading-row">
          <div>
            <h2>Indicadores</h2>
            <p>{requiredCount} indicadores obligatorios marcados para esta lista.</p>
          </div>
          <button className="button button-primary" type="button" onClick={addIndicator}>
            <Plus size={18} aria-hidden="true" />
            Indicador
          </button>
        </div>

        <div className="checklist-list">
          {indicators.map((indicator) => (
            <article className="checklist-item" key={indicator.id}>
              <div className="checklist-item-main">
                <label>
                  Indicador
                  <textarea
                    value={indicator.text}
                    rows="3"
                    onChange={(event) => updateIndicator(indicator.id, 'text', event.target.value)}
                  />
                </label>
                <div className="form-two-columns">
                  <label>
                    Puntos
                    <input
                      type="number"
                      min="0"
                      value={indicator.score}
                      onChange={(event) =>
                        updateIndicator(indicator.id, 'score', event.target.value)
                      }
                    />
                  </label>
                  <label>
                    Obligatorio
                    <select
                      value={String(indicator.required)}
                      onChange={(event) =>
                        updateIndicator(indicator.id, 'required', event.target.value)
                      }
                    >
                      <option value="true">Si</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                </div>
                <label>
                  Observacion
                  <input
                    value={indicator.observation}
                    placeholder="Nota interna para el evaluador"
                    onChange={(event) =>
                      updateIndicator(indicator.id, 'observation', event.target.value)
                    }
                  />
                </label>
              </div>

              <aside className="option-preview">
                <h3>Opciones</h3>
                {options.map((option) => (
                  <span key={option.id}>
                    {option.label}: {Number(indicator.score * option.scoreFactor).toFixed(1)}
                  </span>
                ))}
              </aside>

              <div className="resource-actions">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => duplicateIndicator(indicator)}
                  title="Duplicar indicador"
                  aria-label={`Duplicar ${indicator.text}`}
                >
                  <Copy size={17} aria-hidden="true" />
                </button>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => removeIndicator(indicator.id)}
                  disabled={indicators.length <= 1}
                  title="Eliminar indicador"
                  aria-label={`Eliminar ${indicator.text}`}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default ChecklistBuilderPage;
