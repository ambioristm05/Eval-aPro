import {
  CheckSquare,
  Copy,
  ListChecks,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { getResource } from '../../services/resourceService.js';
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

function normalizeIndicators(sourceIndicators) {
  const indicators = sourceIndicators?.length ? sourceIndicators : initialIndicators;
  return indicators.map((indicator, index) => ({
    id: getId(indicator, `indicator-${index}`),
    text: indicator.text ?? '',
    score: Number(indicator.score) || 0,
    required: Boolean(indicator.required),
    observation: indicator.observation ?? '',
  }));
}

function normalizeOptions(sourceOptions) {
  const options = sourceOptions?.length ? sourceOptions : initialOptions;
  return options.map((option, index) => ({
    id: getId(option, `option-${index}`),
    label: option.label ?? '',
    scoreFactor: Number(option.scoreFactor) || 0,
  }));
}

function buildIndicatorsStructure(indicators) {
  return indicators.map((indicator) => ({
    text: indicator.text,
    score: Number(indicator.score) || 0,
    required: Boolean(indicator.required),
    observation: indicator.observation,
  }));
}

function buildOptionsStructure(options) {
  return options.map((option) => ({
    label: option.label,
    scoreFactor: Number(option.scoreFactor) || 0,
  }));
}

function ChecklistBuilderPage() {
  const { id: instrumentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = location.state;
  const [options, setOptions] = useState(initialOptions);
  const [indicators, setIndicators] = useState(initialIndicators);
  const [fichaTitle, setFichaTitle] = useState(incomingState?.ficha?.title ?? '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(!incomingState?.structure && Boolean(instrumentId));
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const maxScore = useMemo(
    () => indicators.reduce((total, indicator) => total + Number(indicator.score || 0), 0),
    [indicators],
  );

  const requiredCount = indicators.filter((indicator) => indicator.required).length;

  useEffect(() => {
    if (incomingState?.structure) {
      setIndicators(normalizeIndicators(incomingState.structure.indicators));
      setOptions(normalizeOptions(incomingState.structure.options));
      return;
    }

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

        setIndicators(normalizeIndicators(instrument.indicators));
        setOptions(normalizeOptions(instrument.options));
        setFichaTitle(instrument.title ?? '');
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

  const goBackToInstruments = (structureOverride) => {
    navigate('/evaluator/instruments', {
      state: {
        restoreFicha: incomingState?.ficha,
        restoreEditingId: incomingState?.editingId ?? null,
        restoreStructure: {
          criteria: [],
          indicators: structureOverride.indicators,
          options: structureOverride.options,
        },
      },
    });
  };

  const handleUseStructure = () => {
    goBackToInstruments({
      indicators: buildIndicatorsStructure(indicators),
      options: buildOptionsStructure(options),
    });
  };

  const handleCancel = () => {
    goBackToInstruments({
      indicators: incomingState?.structure?.indicators ?? [],
      options: incomingState?.structure?.options ?? [],
    });
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
            {fichaTitle
              ? `Define indicadores y opciones para "${fichaTitle}".`
              : 'Define indicadores observables, opciones de respuesta y puntajes. El título y el guardado se manejan desde Instrumentos.'}
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

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
            <h2>Estructura de la lista</h2>
            <p>Estos cambios se aplican al volver a Instrumentos; ahí se guardan definitivamente.</p>
          </div>

          <div className="builder-actions">
            <button className="button button-primary" type="button" onClick={handleUseStructure} disabled={isLoading}>
              <Save size={18} aria-hidden="true" />
              Usar esta estructura
            </button>
            <button className="button button-secondary" type="button" onClick={handleCancel}>
              Volver sin guardar cambios
            </button>
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
