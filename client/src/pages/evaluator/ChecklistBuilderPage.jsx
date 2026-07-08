import {
  CheckSquare,
  Copy,
  ListChecks,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { createResource, getResource, updateResource } from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const initialIndicators = [
  {
    id: 'indicator-introduction',
    text: 'Presenta una introducción clara al tema.',
    score: 2,
    required: true,
    observation: 'Verificar que contextualice el propósito de la actividad.',
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
  { id: 'option-yes', label: 'Sí', scoreFactor: 1 },
  { id: 'option-partial', label: 'Parcial', scoreFactor: 0.5 },
  { id: 'option-no', label: 'No', scoreFactor: 0 },
];

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function buildChecklistPayload(checklist, indicators, options) {
  return {
    title: checklist.title,
    description: checklist.description,
    type: 'checklist',
    status: checklist.status,
    criteria: [],
    options: options.map((option) => ({
      label: option.label,
      scoreFactor: Number(option.scoreFactor) || 0,
    })),
    indicators: indicators.map((indicator) => ({
      text: indicator.text,
      score: Number(indicator.score) || 0,
      required: Boolean(indicator.required),
      observation: indicator.observation,
    })),
  };
}

function normalizeChecklistInstrument(instrument) {
  const sourceIndicators = instrument.indicators?.length ? instrument.indicators : initialIndicators;

  return {
    checklist: {
      title: instrument.title ?? '',
      description: instrument.description ?? '',
      status: instrument.status ?? 'draft',
    },
    indicators: sourceIndicators.map((indicator, index) => ({
      id: getId(indicator, `indicator-${index}`),
      text: indicator.text ?? '',
      score: Number(indicator.score) || 0,
      required: Boolean(indicator.required),
      observation: indicator.observation ?? '',
    })),
    options: instrument.options?.length
      ? instrument.options.map((option, index) => ({
          id: getId(option, `option-${index}`),
          label: option.label ?? '',
          scoreFactor: Number(option.scoreFactor) || 0,
        }))
      : initialOptions,
  };
}

function ChecklistBuilderPage() {
  const { id: instrumentId } = useParams();
  const [checklist, setChecklist] = useState({
    title: 'Lista de cotejo para exposición',
    description: 'Indicadores observables para revisar entregas y presentaciones.',
    status: 'draft',
  });
  const [options, setOptions] = useState(initialOptions);
  const [indicators, setIndicators] = useState(initialIndicators);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(instrumentId));
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const isEditing = Boolean(instrumentId);

  const maxScore = useMemo(
    () => indicators.reduce((total, indicator) => total + Number(indicator.score || 0), 0),
    [indicators],
  );

  const requiredCount = indicators.filter((indicator) => indicator.required).length;

  useEffect(() => {
    if (!instrumentId) return undefined;

    let isMounted = true;

    async function fetchInstrument() {
      setIsLoading(true);
      setError('');

      try {
        const data = await getResource('instruments', instrumentId);
        const instrument = data.instrument;

        if (!isMounted) return;

        if (instrument.type !== 'checklist') {
          setError('Este instrumento no es una lista de cotejo.');
          return;
        }

        const nextState = normalizeChecklistInstrument(instrument);
        setChecklist(nextState.checklist);
        setIndicators(nextState.indicators);
        setOptions(nextState.options);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInstrument();

    return () => {
      isMounted = false;
    };
  }, [instrumentId]);

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
      { id: createId('option'), label: 'Nueva opción', scoreFactor: 0 },
    ]);
  };

  const removeOption = (optionId) => {
    if (options.length <= 2) return;
    const option = options.find((item) => item.id === optionId);

    setConfirmAction({
      title: `Eliminar opción ${option?.label ?? 'seleccionada'}`,
      description: 'Se quitará esta opción de respuesta de la lista.',
      confirmLabel: 'Eliminar opción',
      onConfirm: () => deleteOption(optionId),
    });
  };

  const deleteOption = (optionId) => {
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
    const indicator = indicators.find((item) => item.id === indicatorId);

    setConfirmAction({
      title: 'Eliminar indicador',
      description: indicator?.text ?? 'Se quitará el indicador seleccionado de esta lista.',
      confirmLabel: 'Eliminar indicador',
      onConfirm: () => deleteIndicator(indicatorId),
    });
  };

  const deleteIndicator = (indicatorId) => {
    setIndicators((current) => current.filter((indicator) => indicator.id !== indicatorId));
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setIsConfirming(true);
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleSave = async () => {
    setError('');
    setSavedMessage('');
    setIsSaving(true);

    try {
      const payload = buildChecklistPayload(checklist, indicators, options);

      if (isEditing) {
        await updateResource('instruments', instrumentId, payload);
      } else {
        await createResource('instruments', payload);
      }

      setSavedMessage(
        isEditing ? 'Lista de cotejo actualizada correctamente.' : 'Lista de cotejo guardada correctamente.'
      );
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
          <h1>{isEditing ? 'Editar lista de cotejo' : 'Constructor de listas'}</h1>
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
            <span>Puntos máximos</span>
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
              Título
              <input name="title" value={checklist.title} onChange={handleChecklistChange} />
            </label>
            <label>
              Descripción
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
            <button
              className="button button-primary"
              type="button"
              onClick={handleSave}
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <span className="button-spinner-ring" aria-hidden="true" />
              ) : (
                <Save size={18} aria-hidden="true" />
              )}
              {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar lista'}
            </button>
            <Link className="button button-secondary" to="/evaluator/instruments">
              Volver a instrumentos
            </Link>
            {error ? <p className="form-message form-message-error">{error}</p> : null}
            {savedMessage ? <p className="form-message form-message-success">{savedMessage}</p> : null}
          </div>
        </aside>

        <section className="dashboard-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Opciones de respuesta</h2>
              <p>Configura etiquetas y factor de puntaje por opción.</p>
            </div>
            <button className="button button-secondary" type="button" onClick={addOption}>
              <Plus size={18} aria-hidden="true" />
              Opción
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
                  title="Eliminar opción"
                  aria-label={`Eliminar opción ${option.label}`}
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
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  </label>
                </div>
                <label>
                  Observación
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

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmLabel={confirmAction?.confirmLabel}
        isBusy={isConfirming}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </section>
  );
}

export default ChecklistBuilderPage;
