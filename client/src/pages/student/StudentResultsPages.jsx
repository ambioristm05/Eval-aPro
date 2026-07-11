import { Award, FileText, MessageSquareText, Printer, Target } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getPrintableReport } from '../../services/resourceService.js';
import {
  getStudentFinalGrade,
  getStudentResults,
} from '../../services/studentService.js';
import { useTimedState } from '../../hooks/useTimedState.js';
import { useAuthStore } from '../../stores/authStore.js';
import { getErrorMessage } from '../../utils/errors.js';
import { openPrintableHtml } from '../../utils/printReport.js';

function useStudentResults() {
  const [results, setResults] = useState([]);
  const [finalGrade, setFinalGrade] = useState(null);
  const [error, setError] = useTimedState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchResults() {
      setIsLoading(true);
      setError('');

      try {
        const [resultsData, finalGradeData] = await Promise.all([
          getStudentResults(),
          getStudentFinalGrade(),
        ]);

        if (!isMounted) return;
        setResults(resultsData.results ?? []);
        setFinalGrade(finalGradeData);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchResults();

    return () => {
      isMounted = false;
    };
  }, []);

  return { results, finalGrade, error, isLoading };
}

function formatGrade(finalGrade) {
  if (!finalGrade || finalGrade.count === 0) return '--';
  return `${finalGrade.grade}%`;
}

function getTaskTitle(result) {
  return result.task?.title ?? 'Tarea sin título';
}

function getInstrumentTitle(result) {
  return result.instrument?.title ?? 'Sin instrumento';
}

function getAnswerLabel(answer) {
  return answer.criterion?.name ?? answer.indicator?.text ?? 'Criterio evaluado';
}

function getAnswerText(answer) {
  return answer.observation || `${answer.score}/${answer.maxScore} puntos`;
}

function EmptyResults({ isLoading, title, text }) {
  return (
    <div className="inline-empty">
      <h3>{isLoading ? 'Cargando resultados...' : title}</h3>
      <p>{isLoading ? 'Espera un momento.' : text}</p>
    </div>
  );
}

export function StudentEvaluationsRealPage() {
  const { results, error, isLoading } = useStudentResults();

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon"><Target size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Estudiante</p>
          <h1>Mis evaluaciones</h1>
          <p className="dashboard-description">Consulta cada evaluación publicada y su detalle por criterio.</p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      <div className="resource-list">
        {results.map((result) => (
          <article className="dashboard-panel" key={result.id}>
            <div className="panel-heading panel-heading-row">
              <div>
                <h2>{getTaskTitle(result)}</h2>
                <p>{getInstrumentTitle(result)}</p>
              </div>
              <span className="count-pill">{result.percentage}%</span>
            </div>
            <div className="criteria-grid">
              {(result.answers ?? []).map((answer) => (
                <div className="criterion-score" key={answer.id}>
                  <span>{getAnswerLabel(answer)}</span>
                  <strong>{answer.score}/{answer.maxScore}</strong>
                  {answer.observation ? <p>{answer.observation}</p> : null}
                </div>
              ))}
            </div>
          </article>
        ))}

        {results.length === 0 ? (
          <EmptyResults
            isLoading={isLoading}
            title="No hay evaluaciones publicadas"
            text="Cuando tu evaluador publique resultados aparecerán aquí."
          />
        ) : null}
      </div>
    </section>
  );
}

export function StudentResultsRealPage() {
  const { results, finalGrade, error, isLoading } = useStudentResults();
  const user = useAuthStore((state) => state.user);
  const [printError, setPrintError] = useTimedState();
  const [isPrinting, setIsPrinting] = useState(false);
  const suggestionsCount = results.reduce(
    (total, result) => total + (result.suggestions?.length ?? 0) + (result.improvements?.length ?? 0),
    0
  );
  const canPrintReport = results.some((result) => result.studentReportEnabled);

  const handlePrintReport = async () => {
    if (!user?.id && !user?._id) return;

    setPrintError('');
    setIsPrinting(true);

    try {
      const html = await getPrintableReport('student', user.id ?? user._id);
      openPrintableHtml(html);
    } catch (requestError) {
      setPrintError(getErrorMessage(requestError));
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon"><Award size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Estudiante</p>
          <h1>Resultados</h1>
          <p className="dashboard-description">Revisa notas publicadas, progreso acumulado y retroalimentación.</p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {printError ? <p className="form-message form-message-error">{printError}</p> : null}

      <div className="metric-grid">
        <article className="metric-card">
          <span className="metric-icon"><Award size={20} aria-hidden="true" /></span>
          <div><strong>{isLoading ? '...' : formatGrade(finalGrade)}</strong><span>Nota acumulada</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><FileText size={20} aria-hidden="true" /></span>
          <div><strong>{isLoading ? '...' : results.length}</strong><span>Resultados</span></div>
        </article>
        <article className="metric-card">
          <span className="metric-icon"><MessageSquareText size={20} aria-hidden="true" /></span>
          <div><strong>{isLoading ? '...' : suggestionsCount}</strong><span>Sugerencias</span></div>
        </article>
      </div>

      <section className="dashboard-panel">
        <div className="panel-heading panel-heading-row">
          <div>
            <h2>Reporte imprimible</h2>
            <p>
              {canPrintReport
                ? 'El evaluador habilitó la impresión de tu reporte.'
                : 'Disponible cuando el evaluador habilite la impresión.'}
            </p>
          </div>
          <button
            className="button button-primary"
            type="button"
            onClick={handlePrintReport}
            disabled={!canPrintReport || isPrinting}
          >
            <Printer size={18} aria-hidden="true" />
            {isPrinting ? 'Abriendo...' : 'Imprimir reporte'}
          </button>
        </div>
      </section>

      <div className="result-timeline">
        {results.map((result) => (
          <article className="dashboard-panel" key={result.id}>
            <div className="panel-heading panel-heading-row">
              <div>
                <h2>{getTaskTitle(result)}</h2>
                <p>{result.feedback || 'Sin retroalimentación general registrada.'}</p>
              </div>
              <span className="count-pill">{result.score}/{result.maxScore}</span>
            </div>
            <div className="progress-bar" aria-label={`Resultado ${result.percentage}%`}>
              <span style={{ width: `${result.percentage}%` }} />
            </div>
          </article>
        ))}

        {results.length === 0 ? (
          <EmptyResults
            isLoading={isLoading}
            title="No hay resultados publicados"
            text="Tus calificaciones aparecerán después de que el evaluador las publique."
          />
        ) : null}
      </div>
    </section>
  );
}

export function StudentSuggestionsRealPage() {
  const { results, error, isLoading } = useStudentResults();
  const strengths = useMemo(
    () =>
      results.flatMap((result) =>
        (result.strengths ?? []).map((strength) => ({
          id: `${result.id}-${strength.id}`,
          task: getTaskTitle(result),
          text: getAnswerText(strength),
        }))
      ),
    [results]
  );
  const improvements = useMemo(
    () =>
      results.flatMap((result) => [
        ...(result.improvements ?? []).map((improvement) => ({
          id: `${result.id}-${improvement.id}`,
          task: getTaskTitle(result),
          text: getAnswerText(improvement),
        })),
        ...(result.suggestions ?? []).map((suggestion) => ({
          id: `${result.id}-${suggestion}`,
          task: getTaskTitle(result),
          text: suggestion,
        })),
      ]),
    [results]
  );

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon"><MessageSquareText size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Estudiante</p>
          <h1>Sugerencias de mejora</h1>
          <p className="dashboard-description">Retroalimentación accionable para reforzar tu avance.</p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading"><h2>Puntos fuertes</h2><p>Aspectos destacados por el evaluador.</p></div>
          <div className="feature-list">
            {strengths.map((strength) => (
              <article className="feature-item" key={strength.id}>
                <h3>{strength.task}</h3>
                <p>{strength.text}</p>
              </article>
            ))}
            {strengths.length === 0 ? (
              <EmptyResults
                isLoading={isLoading}
                title="Sin puntos fuertes publicados"
                text="Aún no hay criterios destacados en tus resultados."
              />
            ) : null}
          </div>
        </section>
        <section className="dashboard-panel">
          <div className="panel-heading"><h2>Por mejorar</h2><p>Acciones sugeridas para próximas entregas.</p></div>
          <div className="feature-list">
            {improvements.map((improvement) => (
              <article className="feature-item" key={improvement.id}>
                <h3>{improvement.task}</h3>
                <p>{improvement.text}</p>
              </article>
            ))}
            {improvements.length === 0 ? (
              <EmptyResults
                isLoading={isLoading}
                title="Sin sugerencias publicadas"
                text="Cuando haya retroalimentación de mejora se mostrará aquí."
              />
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
