import { FileText, Save, Search, Send, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { mockEvaluations, mockInstruments, mockStudents, mockTasks } from '../../data/mockAcademicData.js';

const defaultDraft = {
  studentId: 'student-ana',
  taskId: 'task-reading-analysis',
  instrumentId: 'instrument-reading-rubric',
  feedback: '',
  suggestions: '',
  status: 'draft',
};

function EvaluatorEvaluationsPage() {
  const [evaluations, setEvaluations] = useState(mockEvaluations);
  const [draft, setDraft] = useState(defaultDraft);
  const [scores, setScores] = useState({ c1: 4, c2: 4, c3: 4, c4: 4 });
  const [query, setQuery] = useState('');

  const selectedStudent = mockStudents.find((student) => student.id === draft.studentId);
  const selectedTask = mockTasks.find((task) => task.id === draft.taskId);
  const selectedInstrument = mockInstruments.find((instrument) => instrument.id === draft.instrumentId);

  const maxScore = selectedInstrument.criteria.reduce((total, criterion) => total + criterion.maxScore, 0);
  const score = selectedInstrument.criteria.reduce(
    (total, criterion) => total + Number(scores[criterion.id] || 0),
    0,
  );
  const percentage = maxScore ? Math.round((score / maxScore) * 100) : 0;

  const filteredEvaluations = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return evaluations;

    return evaluations.filter(
      (evaluation) =>
        evaluation.student.toLowerCase().includes(term) ||
        evaluation.task.toLowerCase().includes(term) ||
        evaluation.instrument.toLowerCase().includes(term),
    );
  }, [evaluations, query]);

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraft((current) => ({ ...current, [name]: value }));

    if (name === 'instrumentId') {
      const instrument = mockInstruments.find((item) => item.id === value);
      const nextScores = Object.fromEntries(instrument.criteria.map((criterion) => [criterion.id, 0]));
      setScores(nextScores);
    }
  };

  const handleScoreChange = (criterionId, value) => {
    setScores((current) => ({ ...current, [criterionId]: Number(value) }));
  };

  const saveEvaluation = (status) => {
    const nextEvaluation = {
      id: `evaluation-${Date.now()}`,
      student: selectedStudent.name,
      group: selectedStudent.group,
      task: selectedTask.title,
      instrument: selectedInstrument.title,
      score,
      maxScore,
      percentage,
      status,
      evaluatedAt: new Date().toISOString().slice(0, 10),
      feedback: draft.feedback || 'Sin retroalimentacion registrada.',
      strengths: ['Registro generado desde el formulario de evaluacion.'],
      improvements: ['Revisar comentarios del evaluador.'],
      suggestions: draft.suggestions
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      criteria: selectedInstrument.criteria.map((criterion) => ({
        name: criterion.name,
        score: Number(scores[criterion.id] || 0),
        maxScore: criterion.maxScore,
      })),
    };

    setEvaluations((current) => [nextEvaluation, ...current]);
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

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon"><FileText size={20} aria-hidden="true" /></span>
          <div><strong>{evaluations.length}</strong><span>Evaluaciones</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><Send size={20} aria-hidden="true" /></span>
          <div><strong>{evaluations.filter((item) => item.status === 'published').length}</strong><span>Publicadas</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><Star size={20} aria-hidden="true" /></span>
          <div><strong>{percentage}%</strong><span>Nota actual</span></div>
        </article>
      </div>

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Aplicar evaluacion</h2>
            <p>Selecciona estudiante, tarea e instrumento.</p>
          </div>

          <form className="stacked-form compact-form">
            <label>
              Estudiante
              <select name="studentId" value={draft.studentId} onChange={handleDraftChange}>
                {mockStudents.map((student) => (
                  <option value={student.id} key={student.id}>{student.name}</option>
                ))}
              </select>
            </label>
            <label>
              Tarea
              <select name="taskId" value={draft.taskId} onChange={handleDraftChange}>
                {mockTasks.map((task) => (
                  <option value={task.id} key={task.id}>{task.title}</option>
                ))}
              </select>
            </label>
            <label>
              Instrumento
              <select name="instrumentId" value={draft.instrumentId} onChange={handleDraftChange}>
                {mockInstruments.map((instrument) => (
                  <option value={instrument.id} key={instrument.id}>{instrument.title}</option>
                ))}
              </select>
            </label>

            <div className="score-list">
              {selectedInstrument.criteria.map((criterion) => (
                <label key={criterion.id}>
                  {criterion.name}
                  <input
                    type="number"
                    min="0"
                    max={criterion.maxScore}
                    value={scores[criterion.id] ?? 0}
                    onChange={(event) => handleScoreChange(criterion.id, event.target.value)}
                  />
                  <span>{criterion.maxScore} pts max.</span>
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

          <div className="form-actions">
            <button className="button button-secondary" type="button" onClick={() => saveEvaluation('draft')}>
              <Save size={18} aria-hidden="true" />
              Guardar borrador
            </button>
            <button className="button button-primary" type="button" onClick={() => saveEvaluation('published')}>
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
              <article className="resource-item" key={evaluation.id}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{evaluation.student}</h3>
                    <span className={`status-badge status-${evaluation.status}`}>{evaluation.status}</span>
                  </div>
                  <p>{evaluation.task}</p>
                  <div className="resource-meta">
                    <span>{evaluation.instrument}</span>
                    <span>{evaluation.score}/{evaluation.maxScore}</span>
                    <span>{evaluation.percentage}%</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorEvaluationsPage;
