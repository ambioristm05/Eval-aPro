import {
  ClipboardCheck,
  Copy,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { createResource, getResource, updateResource } from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

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

function getId(resource, fallback) {
  return resource?.id ?? resource?._id ?? fallback;
}

function buildRubricPayload(rubric, criteria, levels) {
  return {
    title: rubric.title,
    description: rubric.description,
    type: 'rubric',
    status: rubric.status,
    criteria: criteria.map((criterion) => ({
      name: criterion.name,
      description: '',
      maxScore: Number(criterion.maxScore) || 0,
      levels: levels.map((level) => ({
        name: level.name,
        description: criterion.descriptions[level.id] ?? '',
        score: Number(level.score) || 0,
      })),
    })),
    indicators: [],
  };
}

function normalizeRubricInstrument(instrument) {
  const sourceCriteria = instrument.criteria?.length ? instrument.criteria : initialCriteria;
  const sourceLevels = sourceCriteria.find((criterion) => criterion.levels?.length)?.levels;
  const normalizedLevels = sourceLevels?.length
    ? sourceLevels.map((level, index) => ({
        id: `level-${index}`,
        name: level.name,
        score: Number(level.score) || 0,
      }))
    : initialLevels;

  const normalizedCriteria = sourceCriteria.map((criterion, criterionIndex) => ({
    id: getId(criterion, `criterion-${criterionIndex}`),
    name: criterion.name,
    maxScore: Number(criterion.maxScore) || 0,
    descriptions: normalizedLevels.reduce((descriptions, level, levelIndex) => {
      descriptions[level.id] = criterion.levels?.[levelIndex]?.description ?? criterion.descriptions?.[level.id] ?? '';
      return descriptions;
    }, {}),
  }));

  return {
    rubric: {
      title: instrument.title ?? '',
      description: instrument.description ?? '',
      status: instrument.status ?? 'draft',
    },
    levels: normalizedLevels,
    criteria: normalizedCriteria,
  };
}

function RubricBuilderPage() {
  const { id: instrumentId } = useParams();
  const [rubric, setRubric] = useState({
    title: 'Rúbrica analítica de lectura',
    description: 'Instrumento para valorar comprensión, organización y argumentación.',
    status: 'draft',
  });
  const [levels, setLevels] = useState(initialLevels);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(instrumentId));
  const [isSaving, setIsSaving] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const isEditing = Boolean(instrumentId);

  const maxScore = useMemo(
    () => criteria.reduce((total, criterion) => total + Number(criterion.maxScore || 0), 0),
    [criteria],
  );

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

        if (instrument.type !== 'rubric') {
          setError('Este instrumento no es una rúbrica.');
          return;
        }

        const nextState = normalizeRubricInstrument(instrument);
        setRubric(nextState.rubric);
        setLevels(nextState.levels);
        setCriteria(nextState.criteria);
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

  const handleRubricChange = (event) => {
    const { name, value } = event.target;
    setRubric((current) => ({ ...current, [name]: value }));
  };

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

  const handleSave = async () => {
    setError('');
    setSavedMessage('');
    setIsSaving(true);

    try {
      const payload = buildRubricPayload(rubric, criteria, levels);

      if (isEditing) {
        await updateResource('instruments', instrumentId, payload);
      } else {
        await createResource('instruments', payload);
      }

      setSavedMessage(isEditing ? 'Rúbrica actualizada correctamente.' : 'Rúbrica guardada correctamente.');
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
          <ClipboardCheck size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Instrumentos</p>
          <h1>{isEditing ? 'Editar rúbrica' : 'Constructor de rúbricas'}</h1>
          <p className="dashboard-description">
            Define criterios, niveles de desempeño, puntajes y descripciones para una
            rúbrica analítica reutilizable.
          </p>
        </div>
      </div>

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
            <h2>Ficha de la rúbrica</h2>
            <p>Datos generales del instrumento.</p>
          </div>

          <form className="stacked-form compact-form">
            <label>
              Título
              <input name="title" value={rubric.title} onChange={handleRubricChange} />
            </label>
            <label>
              Descripción
              <textarea
                name="description"
                value={rubric.description}
                rows="4"
                onChange={handleRubricChange}
              />
            </label>
            <label>
              Estado
              <select name="status" value={rubric.status} onChange={handleRubricChange}>
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
              {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar rúbrica'}
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
