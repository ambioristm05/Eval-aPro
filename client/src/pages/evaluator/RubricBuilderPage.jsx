import {
  ClipboardCheck,
  Copy,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useTimedState } from '../../hooks/useTimedState.js';
import { getResource } from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const initialLevels = [
  { id: 'level-excellent', name: 'Excelente', score: 5 },
  { id: 'level-good', name: 'Bueno', score: 4 },
  { id: 'level-acceptable', name: 'Aceptable', score: 3 },
  { id: 'level-improve', name: 'Debe mejorar', score: 2 },
];

const initialCriteria = [
  {
    id: 'criterion-comprehension',
    name: 'Comprensión del tema',
    maxScore: 5,
    descriptions: {
      'level-excellent': 'Comprende el tema con profundidad y conecta ideas clave.',
      'level-good': 'Comprende el tema y explica la mayoría de ideas relevantes.',
      'level-acceptable': 'Comprende aspectos básicos, pero le falta desarrollo.',
      'level-improve': 'Presenta confusiones importantes sobre el tema.',
    },
  },
  {
    id: 'criterion-organization',
    name: 'Organización',
    maxScore: 5,
    descriptions: {
      'level-excellent': 'Ordena ideas con secuencia clara y transiciones efectivas.',
      'level-good': 'Mantiene una estructura comprensible durante la entrega.',
      'level-acceptable': 'La organización es irregular, aunque se entiende la idea central.',
      'level-improve': 'No presenta una estructura clara para seguir el contenido.',
    },
  },
];

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function normalizeCriteria(sourceCriteria) {
  const criteria = sourceCriteria?.length ? sourceCriteria : initialCriteria;
  const sourceLevels = criteria.find((criterion) => criterion.levels?.length)?.levels;
  const normalizedLevels = sourceLevels?.length
    ? sourceLevels.map((level, index) => ({
        id: `level-${index}`,
        name: level.name,
        score: Number(level.score) || 0,
      }))
    : initialLevels;

  const normalizedCriteria = criteria.map((criterion, criterionIndex) => ({
    id: getId(criterion, `criterion-${criterionIndex}`),
    name: criterion.name,
    maxScore: Number(criterion.maxScore) || 0,
    descriptions: normalizedLevels.reduce((descriptions, level, levelIndex) => {
      descriptions[level.id] = criterion.levels?.[levelIndex]?.description ?? criterion.descriptions?.[level.id] ?? '';
      return descriptions;
    }, {}),
  }));

  return { levels: normalizedLevels, criteria: normalizedCriteria };
}

function buildCriteriaStructure(criteria, levels) {
  return criteria.map((criterion) => ({
    name: criterion.name,
    description: '',
    maxScore: Number(criterion.maxScore) || 0,
    levels: levels.map((level) => ({
      name: level.name,
      description: criterion.descriptions[level.id] ?? '',
      score: Number(level.score) || 0,
    })),
  }));
}

function RubricBuilderPage() {
  const { id: instrumentId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const incomingState = location.state;
  const [levels, setLevels] = useState(initialLevels);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [fichaTitle, setFichaTitle] = useState(incomingState?.ficha?.title ?? '');
  const [error, setError] = useTimedState();
  const [isLoading, setIsLoading] = useState(!incomingState?.structure && Boolean(instrumentId));
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const maxScore = useMemo(
    () => criteria.reduce((total, criterion) => total + Number(criterion.maxScore || 0), 0),
    [criteria],
  );

  useEffect(() => {
    if (incomingState?.structure) {
      const nextState = normalizeCriteria(incomingState.structure.criteria);
      setLevels(nextState.levels);
      setCriteria(nextState.criteria);
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

        if (instrument.type !== 'rubric') {
          setError('Este instrumento no es una rúbrica.');
          return;
        }

        const nextState = normalizeCriteria(instrument.criteria);
        setLevels(nextState.levels);
        setCriteria(nextState.criteria);
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

  const updateLevel = (levelId, field, value) => {
    setLevels((current) =>
      current.map((level) =>
        level.id === levelId
          ? {
              ...level,
              [field]: field === 'score' ? Number(value) : value,
            }
          : level,
      ),
    );
  };

  const addLevel = () => {
    const levelId = createId('level');
    setLevels((current) => [...current, { id: levelId, name: 'Nuevo nivel', score: 1 }]);
    setCriteria((current) =>
      current.map((criterion) => ({
        ...criterion,
        descriptions: { ...criterion.descriptions, [levelId]: '' },
      })),
    );
  };

  const removeLevel = (levelId) => {
    if (levels.length <= 2) return;

    const level = levels.find((item) => item.id === levelId);
    setConfirmAction({
      title: `Eliminar nivel ${level?.name ?? 'seleccionado'}`,
      description: 'Se quitará este nivel de todos los criterios de la rúbrica.',
      confirmLabel: 'Eliminar nivel',
      onConfirm: () => deleteLevel(levelId),
    });
  };

  const deleteLevel = (levelId) => {
    setLevels((current) => current.filter((level) => level.id !== levelId));
    setCriteria((current) =>
      current.map((criterion) => {
        const nextDescriptions = { ...criterion.descriptions };
        delete nextDescriptions[levelId];
        return { ...criterion, descriptions: nextDescriptions };
      }),
    );
  };

  const updateCriterion = (criterionId, field, value) => {
    setCriteria((current) =>
      current.map((criterion) =>
        criterion.id === criterionId
          ? {
              ...criterion,
              [field]: field === 'maxScore' ? Number(value) : value,
            }
          : criterion,
      ),
    );
  };

  const updateDescription = (criterionId, levelId, value) => {
    setCriteria((current) =>
      current.map((criterion) =>
        criterion.id === criterionId
          ? {
              ...criterion,
              descriptions: { ...criterion.descriptions, [levelId]: value },
            }
          : criterion,
      ),
    );
  };

  const addCriterion = () => {
    const descriptions = levels.reduce((result, level) => {
      result[level.id] = '';
      return result;
    }, {});

    setCriteria((current) => [
      ...current,
      {
        id: createId('criterion'),
        name: 'Nuevo criterio',
        maxScore: levels[0]?.score ?? 1,
        descriptions,
      },
    ]);
  };

  const duplicateCriterion = (criterion) => {
    setCriteria((current) => [
      ...current,
      {
        ...criterion,
        id: createId('criterion'),
        name: `${criterion.name} copia`,
      },
    ]);
  };

  const removeCriterion = (criterionId) => {
    if (criteria.length <= 1) return;
    const criterion = criteria.find((item) => item.id === criterionId);

    setConfirmAction({
      title: `Eliminar criterio ${criterion?.name ?? 'seleccionado'}`,
      description: 'Se quitarán sus descripciones y puntaje de esta rúbrica.',
      confirmLabel: 'Eliminar criterio',
      onConfirm: () => deleteCriterion(criterionId),
    });
  };

  const deleteCriterion = (criterionId) => {
    setCriteria((current) => current.filter((criterion) => criterion.id !== criterionId));
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
          criteria: structureOverride,
          indicators: [],
          options: [],
        },
      },
    });
  };

  const handleUseStructure = () => {
    goBackToInstruments(buildCriteriaStructure(criteria, levels));
  };

  const handleCancel = () => {
    goBackToInstruments(incomingState?.structure?.criteria ?? []);
  };

  return (
    <section className="builder-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <ClipboardCheck size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Instrumentos</p>
          <h1>Constructor de rúbricas</h1>
          <p className="dashboard-description">
            {fichaTitle
              ? `Define criterios, niveles y descripciones para "${fichaTitle}".`
              : 'Define criterios, niveles de desempeño, puntajes y descripciones. El título y el guardado se manejan desde Instrumentos.'}
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      <div className="metric-grid" aria-label="Resumen de rúbrica">
        <article className="metric-card">
          <span className="metric-icon">
            <ClipboardCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{criteria.length}</strong>
            <span>Criterios</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Plus size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{levels.length}</strong>
            <span>Niveles</span>
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
            <h2>Estructura de la rúbrica</h2>
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
              <h2>Niveles de desempeño</h2>
              <p>Define nombres y puntajes disponibles para cada criterio.</p>
            </div>
            <button className="button button-secondary" type="button" onClick={addLevel}>
              <Plus size={18} aria-hidden="true" />
              Nivel
            </button>
          </div>

          <div className="level-list">
            {levels.map((level) => (
              <article className="level-item" key={level.id}>
                <label>
                  Nombre
                  <input
                    value={level.name}
                    onChange={(event) => updateLevel(level.id, 'name', event.target.value)}
                  />
                </label>
                <label>
                  Puntos
                  <input
                    type="number"
                    min="0"
                    value={level.score}
                    onChange={(event) => updateLevel(level.id, 'score', event.target.value)}
                  />
                </label>
                <button
                  className="icon-button danger"
                  type="button"
                  onClick={() => removeLevel(level.id)}
                  disabled={levels.length <= 2}
                  title="Eliminar nivel"
                  aria-label={`Eliminar nivel ${level.name}`}
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
            <h2>Criterios y descripciones</h2>
            <p>Completa la matriz de evaluación por nivel de desempeño.</p>
          </div>
          <button className="button button-primary" type="button" onClick={addCriterion}>
            <Plus size={18} aria-hidden="true" />
            Criterio
          </button>
        </div>

        <div className="rubric-matrix">
          {criteria.map((criterion) => (
            <article className="rubric-criterion-card" key={criterion.id}>
              <div className="rubric-criterion-header">
                <label>
                  Criterio
                  <input
                    value={criterion.name}
                    onChange={(event) => updateCriterion(criterion.id, 'name', event.target.value)}
                  />
                </label>
                <label>
                  Puntuación máxima
                  <input
                    type="number"
                    min="0"
                    value={criterion.maxScore}
                    onChange={(event) => updateCriterion(criterion.id, 'maxScore', event.target.value)}
                  />
                </label>
                <div className="resource-actions">
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => duplicateCriterion(criterion)}
                    title="Duplicar criterio"
                    aria-label={`Duplicar ${criterion.name}`}
                  >
                    <Copy size={17} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => removeCriterion(criterion.id)}
                    disabled={criteria.length <= 1}
                    title="Eliminar criterio"
                    aria-label={`Eliminar ${criterion.name}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="rubric-level-grid">
                {levels.map((level) => (
                  <label className="rubric-level-cell" key={level.id}>
                    <span>
                      {level.name}
                      <strong>{level.score} pts</strong>
                    </span>
                    <textarea
                      value={criterion.descriptions[level.id] ?? ''}
                      rows="3"
                      aria-label={`${criterion.name} en nivel ${level.name}`}
                      onChange={(event) => updateDescription(criterion.id, level.id, event.target.value)}
                    />
                  </label>
                ))}
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

export default RubricBuilderPage;
