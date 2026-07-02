import { Award, BookOpenCheck, FileDown, MessageSquareText, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';
import {
  getStudentFinalGrade,
  getStudentResults,
  getStudentTasks,
} from '../../services/studentService.js';
import { getErrorMessage } from '../../utils/errors.js';

function formatGrade(grade) {
  if (!grade || grade.count === 0) return '--';
  return `${grade.grade}%`;
}

function StudentDashboard() {
  const [tasks, setTasks] = useState([]);
  const [results, setResults] = useState([]);
  const [finalGrade, setFinalGrade] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboard() {
      setIsLoading(true);
      setError('');

      try {
        const [tasksData, resultsData, finalGradeData] = await Promise.all([
          getStudentTasks(),
          getStudentResults(),
          getStudentFinalGrade(),
        ]);

        if (!isMounted) return;
        setTasks(tasksData.tasks ?? []);
        setResults(resultsData.results ?? []);
        setFinalGrade(finalGradeData);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const suggestionsCount = results.reduce(
    (total, result) => total + (result.suggestions?.length ?? 0) + (result.improvements?.length ?? 0),
    0
  );

  return (
    <DashboardShell
      eyebrow="Panel del estudiante"
      title="Mi avance"
      description="Consulta tareas asignadas, resultados publicados, sugerencias de mejora y la nota acumulada cuando estén disponibles."
      stats={[
        { label: 'Tareas asignadas', value: isLoading ? '...' : String(tasks.length), icon: BookOpenCheck },
        { label: 'Evaluaciones', value: isLoading ? '...' : String(results.length), icon: Target },
        { label: 'Nota final', value: isLoading ? '...' : formatGrade(finalGrade), icon: Award },
      ]}
      actions={[
        {
          title: 'Ver mis tareas',
          description: 'Listado de actividades pendientes y completadas.',
          icon: BookOpenCheck,
          href: '/student/tasks',
        },
        {
          title: 'Revisar resultados',
          description: 'Notas, criterios evaluados y porcentaje obtenido.',
          icon: Target,
          href: '/student/results',
        },
        {
          title: 'Leer sugerencias',
          description: 'Retroalimentación personalizada para mejorar.',
          icon: MessageSquareText,
          href: '/student/suggestions',
        },
        {
          title: 'Descargar reporte',
          description: 'Vista imprimible cuando el evaluador lo permita.',
          icon: FileDown,
          href: '/student/results',
        },
      ]}
    >
      <aside className="dashboard-panel">
        <div className="panel-heading">
          <h2>Resumen personal</h2>
          <p>{error || 'Datos actualizados desde tus tareas y resultados publicados.'}</p>
        </div>
        <div className="student-score">
          <span>Nota acumulada</span>
          <strong>{isLoading ? 'Cargando...' : formatGrade(finalGrade)}</strong>
        </div>
        <div className="progress-list">
          <div>
            <span>Cuenta</span>
            <strong>Activa</strong>
          </div>
          <div>
            <span>Resultados publicados</span>
            <strong>{results.length}</strong>
          </div>
          <div>
            <span>Sugerencias recibidas</span>
            <strong>{suggestionsCount}</strong>
          </div>
        </div>
      </aside>
    </DashboardShell>
  );
}

export default StudentDashboard;
