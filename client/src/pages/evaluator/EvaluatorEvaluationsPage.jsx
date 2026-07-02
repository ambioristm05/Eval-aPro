import { FileText, Save, Search, Send, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  createResource,
  listResource,
  publishEvaluation,
  updateResource,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

const defaultDraft = {
  studentId: '',
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
  return evaluation.task?.title ?? 'Tarea';
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
    }));
  }

  return (instrument.indicators ?? []).map((indicator) => ({
    id: getId(indicator),
    label: indicator.text,
    maxScore: Number(indicator.score || 0),
    answerKey: 'indicator',
  }));
}

function findExistingEvaluation(evaluations, studentId, taskId) {
  return evaluations.find(
    (evaluation) => getId(evaluation.student) === studentId && getId(evaluation.task) === taskId,
  );
}

function EvaluatorEvaluationsPage() {
  const [evaluations, setEvaluations] = useState([]);
  const [students, setStudents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState(defaultDraft);
  const [scores, setScores] = useState({});
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const selectedTask = tasks.find((task) => getId(task) === draft.taskId);
  const selectedInstrument = selectedTask?.instrument ?? null;
  const instrumentItems = useMemo(() => getInstrumentItems(selectedInstrument), [selectedInstrument]);
  const eligibleStudents = useMemo(
    () => students.filter((student) => studentCanBeEvaluatedForTask(student, selectedTask)),
    [students, selectedTask]
  );

  const maxScore = instrumentItems.reduce((total, item) => total + item.maxScore, 0);
  const score = instrumentItems.reduce((total, item) => total + Number(scores[item.id] || 0), 0);
  const percentage = maxScore ? Math.round((score / maxScore) * 100) : 0;

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
          studentId: current.studentId || (nextStudents[0] ? getId(nextStudents[0]) : ''),
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
    if (!eligibleStudents.length) return;

    const currentStudentIsEligible = eligibleStudents.some((student) => getId(student) === draft.studentId);
    if (!currentStudentIsEligible) {
      setDraft((current) => ({ ...current, studentId: getId(eligibleStudents[0]) }));
    }
  }, [draft.studentId, eligibleStudents]);

  useEffect(() => {
    const existingEvaluation = findExistingEvaluation(evaluations, draft.studentId, draft.taskId);
    const scoreByItem = new Map(
      (existingEvaluation?.answers ?? []).map((answer) => [
        getId(answer.criterion) || getId(answer.indicator),
        Number(answer.score || 0),
      ])
    );
    const nextScores = Object.fromEntries(
      instrumentItems.map((item) => [item.id, scoreByItem.get(item.id) ?? 0])
    );

    setScores(nextScores);

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
  }, [draft.studentId, draft.taskId, evaluations, instrumentItems]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const handleScoreChange = (itemId, value) => {
    setScores((current) => ({ ...current, [itemId]: Number(value) }));
  };

  const saveEvaluation = async (targetStatus) => {
    setError('');
    setMessage('');

    if (!draft.studentId || !draft.taskId) {
      setError('Selecciona un estudiante y una tarea.');
      return;
    }

    if (!selectedInstrument) {
      setError('La tarea seleccionada no tiene instrumento asignado.');
      return;
    }

    const selectedStudent = students.find((student) => getId(student) === draft.studentId);
    if (!selectedStudent || !studentCanBeEvaluatedForTask(selectedStudent, selectedTask)) {
      setError('Selecciona un estudiante asignado a esta tarea o a su grupo.');
      return;
    }

    setIsSaving(true);

    try {
      const answers = instrumentItems.map((item) => ({
        [item.answerKey]: item.id,
        score: Number(scores[item.id] || 0),
        observation: '',
      }));
      const suggestions = draft.suggestions
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean);
      const payload = {
        student: draft.studentId,
        task: draft.taskId,
        answers,
        feedback: draft.feedback,
        suggestions,
        status: targetStatus === 'published' ? 'completed' : targetStatus,
      };
      const existingEvaluation = findExistingEvaluation(evaluations, draft.studentId, draft.taskId);
      const saved = existingEvaluation
        ? await updateResource('evaluations', getId(existingEvaluation), {
            answers: payload.answers,
            feedback: payload.feedback,
            suggestions: payload.suggestions,
            status: payload.status,
          })
        : await createResource('evaluations', payload);
      const evaluationId = getId(saved.evaluation);

      if (targetStatus === 'published') {
        await publishEvaluation(evaluationId);
      }

      setMessage(
        targetStatus === 'published'
          ? 'Resultado publicado correctamente.'
          : existingEvaluation
            ? 'Evaluacion actualizada.'
            : 'Evaluacion guardada.'
      );
      setDraft((current) => ({ ...current, feedback: '', suggestions: '' }));
      await loadEvaluations();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
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
        setMessage('Estado de evaluacion actualizado.');
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
            <strong>{percentage}%</strong>
            <span>Nota actual</span>
          </div>
        </article>
      </div>

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Aplicar evaluacion</h2>
            <p>Selecciona estudiante y tarea. El instrumento se toma de la tarea.</p>
          </div>

          <form className="stacked-form compact-form">
            <label>
              Estudiante
              <select name="studentId" value={draft.studentId} onChange={handleDraftChange}>
                {eligibleStudents.map((student) => (
                  <option value={getId(student)} key={getId(student)}>
                    {student.name}
                  </option>
                ))}
              </select>
            </label>
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

            <div className="score-list">
              {instrumentItems.map((item) => (
                <label key={item.id}>
                  {item.label}
                  <input
                    type="number"
                    min="0"
                    max={item.maxScore}
                    value={scores[item.id] ?? 0}
                    onChange={(event) => handleScoreChange(item.id, event.target.value)}
                  />
                  <span>{item.maxScore} pts max.</span>
                </label>
              ))}
            </div>

            <label>
              Retroalimentacion
              <textarea name="feedback" value={draft.feedback} rows="4" onChange={handleDraftChange} />
            </label>
            <label>
              Sugerencias
              <textarea
                name="suggestions"
                value={draft.suggestions}
                rows="3"
                placeholder="Una sugerencia por linea"
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
            <input value={query} placeholder="Buscar evaluacion" onChange={(event) => setQuery(event.target.value)} />
          </label>
          <div className="resource-list spaced-list">
            {filteredEvaluations.map((evaluation) => (
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

            {filteredEvaluations.length === 0 ? (
              <div className="inline-empty">
                <h3>{isLoading ? 'Cargando evaluaciones...' : 'No hay evaluaciones'}</h3>
                <p>{isLoading ? 'Espera un momento.' : 'Crea una evaluacion para verla en el historial.'}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorEvaluationsPage;
