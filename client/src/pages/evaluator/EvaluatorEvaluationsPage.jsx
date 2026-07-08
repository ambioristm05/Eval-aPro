import { CheckCircle2, FileText, Save, Search, Send, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import EmptyState from '../../components/common/EmptyState.jsx';
import {
  createResource,
  listResource,
  publishEvaluation,
  updateResource,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

const defaultDraft = {
  studentIds: [],
  taskId: '',
  feedback: '',
  suggestions: '',
};

const statusLabels = {
  draft: 'Borrador',
  completed: 'Completada',
  published: 'Publicada',
};

function getId(resource) {
  if (typeof resource === 'string') return resource;
  return resource?.id ?? resource?._id ?? '';
}

function getStudentName(evaluation) {
  return evaluation.student?.name ?? 'Estudiante';
}

function getTaskTitle(evaluation) {
  return evaluation.task?.title ?? 'Tarea sin título';
}

function getInstrumentTitle(evaluation) {
  return evaluation.instrument?.title ?? 'Instrumento';
}

function getStudentGroupIds(student) {
  return (student.groups ?? []).map(getId).filter(Boolean);
}

function studentCanBeEvaluatedForTask(student, task) {
  if (!task) return true;

  const studentId = getId(student);
  const directStudentIds = (task.students ?? []).map(getId).filter(Boolean);
  const taskGroupId = getId(task.group);

  return directStudentIds.includes(studentId) || (taskGroupId && getStudentGroupIds(student).includes(taskGroupId));
}

function getInstrumentItems(instrument) {
  if (!instrument) return [];

  if (instrument.criteria?.length) {
    return instrument.criteria.map((criterion) => ({
      id: getId(criterion),
      label: criterion.name,
      maxScore: Number(criterion.maxScore || 0),
      answerKey: 'criterion',
      levels: criterion.levels ?? [],
    }));
  }

  return (instrument.indicators ?? []).map((indicator) => ({
    id: getId(indicator),
    label: indicator.text,
    maxScore: Number(indicator.score || 0),
    answerKey: 'indicator',
    options: instrument.options ?? [],
    required: Boolean(indicator.required),
    helperText: indicator.observation ?? '',
  }));
}

function formatPoints(value) {
  return new Intl.NumberFormat('es-DO', { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function getRubricLevels(instrument) {
  return instrument?.criteria?.find((criterion) => criterion.levels?.length)?.levels ?? [];
}

function getRubricCriteria(instrument) {
  return instrument?.criteria ?? [];
}

function getRubricLevelForCriterion(criterion, referenceLevel) {
  return criterion.levels?.find((level) => level.name === referenceLevel.name) ?? referenceLevel;
}

function getRubricMaxScore(instrument, criteria) {
  const instrumentMaxScore = Number(instrument?.maxScore || 0);
  if (instrumentMaxScore) return instrumentMaxScore;

  return criteria.reduce((total, criterion) => total + Number(criterion.maxScore || 0), 0);
}

function findExistingEvaluation(evaluations, studentId, taskId) {
  return evaluations.find(
    (evaluation) => getId(evaluation.student) === studentId && getId(evaluation.task) === taskId,
  );
}

function formatToday() {
  return new Intl.DateTimeFormat('es-DO', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
}

function EvaluatorEvaluationsPage() {
  const studentSearchInputRef = useRef(null);
  const studentBannerRef = useRef(null);
  const previousTaskIdRef = useRef(null);
  const [evaluations, setEvaluations] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState(defaultDraft);
  const [scores, setScores] = useState({});
  const [choices, setChoices] = useState({});
  const [query, setQuery] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTask = tasks.find((task) => getId(task) === draft.taskId);
  const selectedInstrument = selectedTask?.instrument ?? null;
  const instrumentItems = useMemo(() => getInstrumentItems(selectedInstrument), [selectedInstrument]);
  const isRubricEvaluation = selectedInstrument?.type === 'rubric' && Boolean(selectedInstrument.criteria?.length);
  const isChecklistEvaluation =
    selectedInstrument?.type === 'checklist' && Boolean(selectedInstrument.indicators?.length);
  const rubricLevels = useMemo(() => getRubricLevels(selectedInstrument), [selectedInstrument]);
  const rubricCriteria = useMemo(() => getRubricCriteria(selectedInstrument), [selectedInstrument]);
  const rubricTotalScore = rubricCriteria.reduce(
    (total, criterion) => total + Number(scores[getId(criterion)] || 0),
    0
  );
  const rubricMaxScore = getRubricMaxScore(selectedInstrument, rubricCriteria);
  const checklistTotalScore = instrumentItems.reduce((total, item) => total + Number(scores[item.id] || 0), 0);
  const checklistMaxScore = instrumentItems.reduce((total, item) => total + Number(item.maxScore || 0), 0);
  const isGroupTask = Boolean(selectedTask?.group);
  const eligibleStudents = useMemo(
    () => students.filter((student) => studentCanBeEvaluatedForTask(student, selectedTask)),
    [students, selectedTask]
  );
  const filteredEligibleStudents = useMemo(() => {
    const normalizedSearch = studentSearchTerm.trim().toLowerCase();
    if (!normalizedSearch) return eligibleStudents;

    return eligibleStudents.filter(
      (student) =>
        student.name.toLowerCase().includes(normalizedSearch) ||
        (student.email ?? '').toLowerCase().includes(normalizedSearch)
    );
  }, [eligibleStudents, studentSearchTerm]);
  const selectedStudents = useMemo(
    () => students.filter((student) => draft.studentIds.includes(getId(student))),
    [draft.studentIds, students],
  );
  const primaryStudentId = draft.studentIds[0] ?? '';

  const publishedEvaluations = evaluations.filter((evaluation) => evaluation.status === 'published');
  const publishedGrade = publishedEvaluations.length
    ? Math.round(
        publishedEvaluations.reduce((total, evaluation) => total + Number(evaluation.percentage || 0), 0) /
          publishedEvaluations.length
      )
    : 0;

  const filteredEvaluations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return evaluations;

    return evaluations.filter(
      (evaluation) =>
        getStudentName(evaluation).toLowerCase().includes(term) ||
        getTaskTitle(evaluation).toLowerCase().includes(term) ||
        getInstrumentTitle(evaluation).toLowerCase().includes(term),
    );
  }, [evaluations, query]);

  const loadEvaluations = async () => {
    const data = await listResource('evaluations', { limit: 100 });
    setEvaluations(data.evaluations ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      setIsLoading(true);
      setError('');

      try {
        const [evaluationsData, studentsData, tasksData] = await Promise.all([
          listResource('evaluations', { limit: 100 }),
          listResource('students', { limit: 100 }),
          listResource('tasks', { limit: 100 }),
        ]);

        if (!isMounted) return;

        const nextStudents = studentsData.students ?? [];
        const nextTasks = tasksData.tasks ?? [];

        setEvaluations(evaluationsData.evaluations ?? []);
        setStudents(nextStudents);
        setTasks(nextTasks);
        setDraft((current) => ({
          ...current,
          taskId: current.taskId || (nextTasks[0] ? getId(nextTasks[0]) : ''),
        }));
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const eligibleIds = eligibleStudents.map(getId);
    const taskChanged = previousTaskIdRef.current !== draft.taskId;
    previousTaskIdRef.current = draft.taskId;

    if (!eligibleIds.length) {
      setDraft((current) => (current.studentIds.length ? { ...current, studentIds: [] } : current));
      return;
    }

    if (taskChanged) {
      const defaultIds = isGroupTask ? eligibleIds : [eligibleIds[0]];
      setDraft((current) => ({ ...current, studentIds: defaultIds }));
      return;
    }

    const eligibleIdSet = new Set(eligibleIds);
    setDraft((current) => {
      const stillEligible = current.studentIds.filter((id) => eligibleIdSet.has(id));
      if (stillEligible.length === current.studentIds.length) return current;
      return { ...current, studentIds: stillEligible.length ? stillEligible : [eligibleIds[0]] };
    });
  }, [eligibleStudents, draft.taskId, isGroupTask]);

  useEffect(() => {
    const existingEvaluation = findExistingEvaluation(evaluations, primaryStudentId, draft.taskId);
    const scoreByItem = new Map(
      (existingEvaluation?.answers ?? []).map((answer) => [
        getId(answer.criterion) || getId(answer.indicator),
        Number(answer.score || 0),
      ])
    );
    const choiceByItem = new Map(
      (existingEvaluation?.answers ?? []).map((answer) => {
        const itemId = getId(answer.criterion) || getId(answer.indicator);
        const value = answer.value;
        const label = typeof value === 'object' && value !== null ? value.label : value;
        return [itemId, answer.levelName ?? label ?? ''];
      })
    );
    const nextChoices = Object.fromEntries(
      instrumentItems.map((item) => {
        const savedChoice = choiceByItem.get(item.id);
        const savedScore = scoreByItem.get(item.id);

        if (item.levels?.length) {
          const matchedLevel =
            item.levels.find((level) => level.name === savedChoice) ??
            item.levels.find((level) => Number(level.score || 0) === savedScore);

          return [item.id, matchedLevel?.name ?? ''];
        }

        return [item.id, savedChoice ?? item.options?.[0]?.label ?? ''];
      })
    );
    const nextScores = Object.fromEntries(
      instrumentItems.map((item) => {
        const savedScore = scoreByItem.get(item.id);
        const selectedOption = item.options?.find((option) => option.label === nextChoices[item.id]);
        const selectedLevel = item.levels?.find((level) => level.name === nextChoices[item.id]);
        const optionScore = selectedOption
          ? Number((item.maxScore * Number(selectedOption.scoreFactor || 0)).toFixed(2))
          : 0;
        const levelScore = selectedLevel ? Number(selectedLevel.score || 0) : 0;

        return [item.id, savedScore ?? (levelScore || optionScore)];
      })
    );

    setScores(nextScores);
    setChoices(nextChoices);

    if (existingEvaluation) {
      setDraft((current) => ({
        ...current,
        feedback: existingEvaluation.feedback ?? '',
        suggestions: (existingEvaluation.suggestions ?? []).join('\n'),
      }));
    } else {
      setDraft((current) => ({
        ...current,
        feedback: '',
        suggestions: '',
      }));
    }
  }, [primaryStudentId, draft.taskId, evaluations, instrumentItems]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleStudentToggle = (studentId) => {
    setDraft((current) => {
      const isSelected = current.studentIds.includes(studentId);
      return {
        ...current,
        studentIds: isSelected
          ? current.studentIds.filter((id) => id !== studentId)
          : [...current.studentIds, studentId],
      };
    });
  };

  const handleStudentSelectSingle = (studentId) => {
    setDraft((current) => ({ ...current, studentIds: [studentId] }));
  };

  const handleScoreChange = (itemId, value) => {
    setScores((current) => ({ ...current, [itemId]: Number(value) }));
  };

  const handleChoiceChange = (item, selectedLabel) => {
    const option = item.options.find((currentOption) => currentOption.label === selectedLabel);
    const scoreFactor = Number(option?.scoreFactor || 0);

    setChoices((current) => ({ ...current, [item.id]: selectedLabel }));
    setScores((current) => ({
      ...current,
      [item.id]: Number((item.maxScore * scoreFactor).toFixed(2)),
    }));
  };

  const handleRubricLevelSelect = (criterion, level) => {
    const criterionId = getId(criterion);

    setChoices((current) => ({ ...current, [criterionId]: level.name }));
    setScores((current) => ({ ...current, [criterionId]: Number(level.score || 0) }));
  };

  const saveEvaluation = async (targetStatus) => {
    setError('');
    setMessage('');

    if (!draft.studentIds.length || !draft.taskId) {
      setError('Selecciona al menos un estudiante y una tarea.');
      return;
    }

    if (!selectedInstrument) {
      setError('La tarea seleccionada no tiene instrumento asignado.');
      return;
    }

    const targetStudents = draft.studentIds
      .map((studentId) => students.find((student) => getId(student) === studentId))
      .filter((student) => student && studentCanBeEvaluatedForTask(student, selectedTask));

    if (!targetStudents.length) {
      setError('Selecciona estudiantes asignados a esta tarea o a su grupo.');
      return;
    }

    setIsSaving(true);

    try {
      const answers = instrumentItems.map((item) => {
        const selectedOption = item.options?.find((option) => option.label === choices[item.id]);
        const selectedLevel = item.levels?.find((level) => level.name === choices[item.id]);

        return {
          [item.answerKey]: item.id,
          levelName: selectedLevel?.name,
          value: selectedOption
            ? {
                label: selectedOption.label,
                scoreFactor: Number(selectedOption.scoreFactor || 0),
              }
            : undefined,
          score: Number(scores[item.id] || 0),
          observation: '',
        };
      });
      const suggestions = draft.suggestions
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      const status = targetStatus === 'published' ? 'completed' : targetStatus;

      const succeeded = [];
      const failed = [];

      for (const student of targetStudents) {
        const studentId = getId(student);

        try {
          const existingEvaluation = findExistingEvaluation(evaluations, studentId, draft.taskId);
          const saved = existingEvaluation
            ? await updateResource('evaluations', getId(existingEvaluation), {
                answers,
                feedback: draft.feedback,
                suggestions,
                status,
              })
            : await createResource('evaluations', {
                student: studentId,
                task: draft.taskId,
                answers,
                feedback: draft.feedback,
                suggestions,
                status,
              });

          if (targetStatus === 'published') {
            await publishEvaluation(getId(saved.evaluation));
          }

          succeeded.push(student.name);
        } catch (studentError) {
          failed.push(`${student.name}: ${getErrorMessage(studentError)}`);
        }
      }

      const verb = targetStatus === 'published' ? 'publicada(s)' : 'guardada(s)';

      if (succeeded.length && !failed.length) {
        setMessage(`Evaluación ${verb} para ${succeeded.length} estudiante(s).`);
        setDraft((current) => ({ ...current, feedback: '', suggestions: '' }));
      } else if (succeeded.length && failed.length) {
        setMessage(
          `Evaluación ${verb} para ${succeeded.length} estudiante(s). No se pudo para: ${failed.join('; ')}.`
        );
        setDraft((current) => ({ ...current, feedback: '', suggestions: '' }));
      } else {
        setError(`No se pudo guardar la evaluación. ${failed.join('; ')}`);
      }

      await loadEvaluations();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const focusEvaluationForm = () => {
    setQuery('');
    if (studentBannerRef.current) studentBannerRef.current.open = true;
    studentSearchInputRef.current?.focus();
    studentSearchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const changeEvaluationStatus = async (evaluationId, targetStatus) => {
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      if (targetStatus === 'published') {
        await publishEvaluation(evaluationId);
        setMessage('Resultado publicado correctamente.');
      } else {
        await updateResource('evaluations', evaluationId, { status: targetStatus });
        setMessage('Estado de evaluación actualizado.');
      }

      await loadEvaluations();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <FileText size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>Evaluaciones</h1>
          <p className="dashboard-description">
            Aplica instrumentos, calcula notas, guarda borradores y publica resultados.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon">
            <FileText size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{evaluations.length}</strong>
            <span>Evaluaciones</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Send size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{evaluations.filter((item) => item.status === 'published').length}</strong>
            <span>Publicadas</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Star size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{publishedGrade}</strong>
            <span>Nota publicada</span>
          </div>
        </article>
      </div>

      <div className={`management-grid${isRubricEvaluation || isChecklistEvaluation ? ' evaluation-rubric-layout' : ''}`}>
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Aplicar evaluación</h2>
            <p>Selecciona estudiante y tarea. El instrumento se toma de la tarea.</p>
          </div>

          <form className="stacked-form compact-form">
            <details className="form-section" ref={studentBannerRef}>
              <summary>
                Estudiantes ({selectedStudents.length} de {eligibleStudents.length} seleccionado(s))
              </summary>
              <div className="form-section-body">
                {selectedStudents.length ? (
                  <div className="selected-student-chips" aria-label="Estudiantes seleccionados">
                    {selectedStudents.map((student) => (
                      <span className="student-chip" key={getId(student)}>
                        {student.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="assignment-empty">Ningún estudiante seleccionado todavía.</p>
                )}

                <label className="search-field assignment-search">
                  <Search size={18} aria-hidden="true" />
                  <input
                    ref={studentSearchInputRef}
                    type="search"
                    value={studentSearchTerm}
                    placeholder="Buscar estudiante"
                    onChange={(event) => setStudentSearchTerm(event.target.value)}
                  />
                </label>

                <div
                  className="assignment-list"
                  aria-label={isGroupTask ? 'Seleccionar integrantes del grupo' : 'Seleccionar estudiante para evaluar'}
                >
                  {filteredEligibleStudents.map((student) => {
                    const studentId = getId(student);
                    const isSelected = draft.studentIds.includes(studentId);

                    return (
                      <label className={`assignment-option${isSelected ? ' assignment-option-selected' : ''}`} key={studentId}>
                        <input
                          type={isGroupTask ? 'checkbox' : 'radio'}
                          name={isGroupTask ? undefined : 'studentId'}
                          checked={isSelected}
                          onChange={() =>
                            isGroupTask ? handleStudentToggle(studentId) : handleStudentSelectSingle(studentId)
                          }
                        />
                        <span className="assignment-check" aria-hidden="true">
                          <CheckCircle2 size={15} />
                        </span>
                        <span className="assignment-student">
                          <strong>{student.name}</strong>
                          <small>{student.email ?? 'Sin correo'}</small>
                        </span>
                      </label>
                    );
                  })}

                  {eligibleStudents.length > 0 && filteredEligibleStudents.length === 0 ? (
                    <p className="assignment-empty">No hay estudiantes que coincidan con la búsqueda.</p>
                  ) : null}
                </div>
              </div>
            </details>
            <label>
              Tarea
              <select name="taskId" value={draft.taskId} onChange={handleDraftChange}>
                {tasks.map((task) => (
                  <option value={getId(task)} key={getId(task)}>
                    {task.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Instrumento
              <input value={selectedInstrument?.title ?? 'Sin instrumento'} readOnly />
            </label>

            {eligibleStudents.length === 0 ? (
              <p className="form-message form-message-error">
                La tarea seleccionada no tiene estudiantes asignados directamente ni por grupo.
              </p>
            ) : null}

            {isRubricEvaluation ? (
              <section className="rubric-sheet" aria-label="Rúbrica de evaluación">
                <div className="rubric-sheet-header">
                  <div className="rubric-sheet-brand">
                    <img src="/icono-plano.svg" alt="EvalúaPro" />
                  </div>
                  <div className="rubric-sheet-heading">
                    <h2>{selectedInstrument.title}</h2>
                    <p>
                      <strong>Facilitador:</strong> {selectedTask?.evaluator?.name ?? 'Evaluador'}
                      <span> </span>
                      <strong>Tema:</strong> {selectedTask?.description || selectedTask?.title || 'Sin tema'}
                    </p>
                    <p>
                      <strong>Rúbrica Módulo:</strong> {selectedInstrument.description || selectedInstrument.title}
                      <span> </span>
                      <strong>Práctica:</strong> {selectedTask?.title ?? 'Sin práctica'}
                      <span> </span>
                      <strong>Alumno(s):</strong>{' '}
                      {selectedStudents.length ? selectedStudents.map((student) => student.name).join(', ') : 'Sin estudiante'}
                    </p>
                  </div>
                </div>

                <div className="rubric-sheet-table-wrap">
                  <table className="rubric-sheet-table">
                    <thead>
                      <tr>
                        <th>Criterio</th>
                        {rubricLevels.map((level, index) => (
                          <th key={`${level.name}-${index}`}>
                            {level.name} ({formatPoints(level.score)} pts)
                          </th>
                        ))}
                        <th>Ponderación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rubricCriteria.map((criterion, criterionIndex) => {
                        const criterionId = getId(criterion);

                        return (
                          <tr key={criterionId}>
                            <th scope="row">
                              <span>{criterionIndex + 1}. {criterion.name}</span>
                              {criterion.description ? <small>{criterion.description}</small> : null}
                            </th>
                            {rubricLevels.map((referenceLevel, levelIndex) => {
                              const level = getRubricLevelForCriterion(criterion, referenceLevel);
                              const isSelected = choices[criterionId] === level.name;

                              return (
                                <td key={`${criterionId}-${referenceLevel.name}-${levelIndex}`}>
                                  <button
                                    className={`rubric-sheet-cell-button${isSelected ? ' rubric-sheet-cell-selected' : ''}`}
                                    type="button"
                                    onClick={() => handleRubricLevelSelect(criterion, level)}
                                    aria-pressed={isSelected}
                                  >
                                    {level.description || referenceLevel.description || 'Sin descripción registrada.'}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="rubric-sheet-weight">
                              <strong>{formatPoints(scores[criterionId])}</strong>
                              <span>/ {formatPoints(criterion.maxScore)} pts</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="rubric-sheet-summary">
                  <p>
                    <strong>Total:</strong> {formatPoints(rubricTotalScore)} / {formatPoints(rubricMaxScore)} pts
                  </p>
                  <p>
                    <strong>Sugerencia de escala:</strong>{' '}
                    {rubricLevels.map((level) => `${level.name}: ${formatPoints(level.score)} pts`).join('; ')}
                  </p>
                </div>
              </section>
            ) : isChecklistEvaluation ? (
              <section className="checklist-sheet" aria-label="Lista de cotejo">
                <div className="checklist-sheet-header">
                  <div className="checklist-sheet-brand">
                    <img src="/icono-plano.svg" alt="EvalúaPro" />
                  </div>
                  <div className="checklist-sheet-heading">
                    <h2>{selectedInstrument.title}</h2>
                    <p className="checklist-sheet-title-row">
                      <strong>LISTA DE COTEJO</strong> — Valor: {formatPoints(checklistMaxScore)} Puntos
                    </p>
                    <p>
                      <strong>Facilitador:</strong> {selectedTask?.evaluator?.name ?? 'Evaluador'}
                      <span> </span>
                      <strong>Módulo:</strong> {selectedTask?.class?.module?.name ?? 'Sin módulo'}
                    </p>
                    <p>
                      <strong>Práctica:</strong> {selectedTask?.title ?? 'Sin práctica'}
                      <span> </span>
                      <strong>Día:</strong> {formatToday()}
                    </p>
                    {isGroupTask ? (
                      <p>
                        <strong>Evaluación grupal:</strong>{' '}
                        {selectedStudents.length
                          ? selectedStudents.map((student) => student.name).join(', ')
                          : 'Selecciona los integrantes en "Estudiantes".'}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="checklist-sheet-items">
                  {instrumentItems.map((item) => {
                    const hasChoice = Boolean(choices[item.id]);

                    return (
                      <div className="checklist-sheet-item" key={item.id}>
                        <h3>
                          {item.label} <span>({formatPoints(item.maxScore)} puntos)</span>
                        </h3>
                        <table className="checklist-sheet-table">
                          <thead>
                            <tr>
                              <th>Calificación</th>
                              {(item.options ?? []).map((option) => (
                                <th key={option.id ?? option._id ?? option.label}>{option.label}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="checklist-sheet-result">
                                {hasChoice ? (
                                  <>
                                    <strong>{choices[item.id]}</strong>
                                    <span>
                                      {formatPoints(scores[item.id])} / {formatPoints(item.maxScore)} pts
                                    </span>
                                  </>
                                ) : (
                                  <span className="checklist-sheet-result-empty">Sin calificar</span>
                                )}
                              </td>
                              {(item.options ?? []).map((option) => {
                                const isSelected = choices[item.id] === option.label;

                                return (
                                  <td key={option.id ?? option._id ?? option.label}>
                                    <button
                                      type="button"
                                      className={`checklist-sheet-cell-button${isSelected ? ' checklist-sheet-cell-selected' : ''}`}
                                      onClick={() => handleChoiceChange(item, option.label)}
                                      aria-pressed={isSelected}
                                      aria-label={`${item.label}: ${option.label}`}
                                    >
                                      {isSelected ? <CheckCircle2 size={18} aria-hidden="true" /> : null}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                </div>

                <div className="checklist-sheet-summary">
                  <p>
                    <strong>Total:</strong> {formatPoints(checklistTotalScore)} / {formatPoints(checklistMaxScore)} pts
                  </p>
                </div>

                <div className="checklist-sheet-legend">
                  <p>
                    <strong>Muy Bien</strong> = Cumple completamente el criterio
                  </p>
                  <p>
                    <strong>Bien</strong> = Cumple parcialmente el criterio
                  </p>
                  <p>
                    <strong>Regular</strong> = No cumple
                  </p>
                </div>
              </section>
            ) : (
              <div className="score-list">
                {instrumentItems.map((item) => (
                  <label key={item.id}>
                    <span>
                      {item.label}
                      {item.required ? <strong>Obligatorio</strong> : null}
                    </span>
                    {item.options?.length ? (
                      <select value={choices[item.id] ?? ''} onChange={(event) => handleChoiceChange(item, event.target.value)}>
                        {item.options.map((option) => (
                          <option value={option.label} key={option.id ?? option._id ?? option.label}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        max={item.maxScore}
                        value={scores[item.id] ?? 0}
                        onChange={(event) => handleScoreChange(item.id, event.target.value)}
                      />
                    )}
                    <span>{item.maxScore} pts max.</span>
                    {item.helperText ? <em>{item.helperText}</em> : null}
                  </label>
                ))}
              </div>
            )}

            <label>
              Retroalimentación
              <textarea name="feedback" value={draft.feedback} rows="4" onChange={handleDraftChange} />
            </label>
            <label>
              Sugerencias
              <textarea
                name="suggestions"
                value={draft.suggestions}
                rows="3"
                placeholder="Una sugerencia por línea"
                onChange={handleDraftChange}
              />
            </label>
          </form>

          <div className="form-actions evaluation-form-actions">
            <button
              className="button button-secondary"
              type="button"
              onClick={() => saveEvaluation('draft')}
              disabled={isSaving}
            >
              <Save size={18} aria-hidden="true" />
              Guardar borrador
            </button>
            <button
              className="button button-primary"
              type="button"
              onClick={() => saveEvaluation('published')}
              disabled={isSaving}
            >
              <Send size={18} aria-hidden="true" />
              Publicar resultado
            </button>
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Historial</h2>
            <p>Evaluaciones recientes generadas o publicadas.</p>
          </div>
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <input value={query} placeholder="Buscar evaluación" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="resource-list spaced-list">
            {isLoading ? (
              <div className="skeleton-list" aria-label="Cargando evaluaciones">
                {[0, 1, 2].map((item) => (
                  <div className="skeleton-card" key={item}>
                    <span className="skeleton-line skeleton-line-title" />
                    <span className="skeleton-line" />
                    <div className="skeleton-chip-row">
                      <span className="skeleton-chip" />
                      <span className="skeleton-chip" />
                      <span className="skeleton-chip" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvaluations.map((evaluation) => (
              <article className="resource-item" key={getId(evaluation)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{getStudentName(evaluation)}</h3>
                    <span className={`status-badge status-${evaluation.status}`}>
                      {statusLabels[evaluation.status] ?? evaluation.status}
                    </span>
                  </div>
                  <p>{getTaskTitle(evaluation)}</p>
                  <div className="resource-meta">
                    <span>{getInstrumentTitle(evaluation)}</span>
                    <span>{evaluation.score}/{evaluation.maxScore}</span>
                    <span>{evaluation.percentage}%</span>
                  </div>
                </div>
                {evaluation.status !== 'published' ? (
                  <div className="resource-actions" aria-label={`Acciones para ${getStudentName(evaluation)}`}>
                    {evaluation.status === 'draft' ? (
                      <button
                        className="button button-secondary"
                        type="button"
                        onClick={() => changeEvaluationStatus(getId(evaluation), 'completed')}
                        disabled={isSaving}
                      >
                        <Save size={17} aria-hidden="true" />
                        Completar
                      </button>
                    ) : null}
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => changeEvaluationStatus(getId(evaluation), 'published')}
                      disabled={isSaving}
                    >
                      <Send size={17} aria-hidden="true" />
                      Publicar
                    </button>
                  </div>
                ) : null}
              </article>
            ))}

            {!isLoading && filteredEvaluations.length === 0 ? (
              <EmptyState
                title="No hay evaluaciones"
                description="Crea una evaluación para verla en el historial."
                action={{
                  label: 'Aplicar evaluación',
                  onClick: focusEvaluationForm,
                }}
              />
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorEvaluationsPage;
