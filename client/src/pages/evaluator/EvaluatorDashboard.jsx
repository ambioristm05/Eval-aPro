import {
  ClipboardCheck,
  FileText,
  GraduationCap,
  NotebookTabs,
  Printer,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';
import { listResource } from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

const defaultTotals = {
  groups: 0,
  students: 0,
  instruments: 0,
  publishedEvaluations: 0,
};

function getTotal(data, key) {
  return data.pagination?.total ?? data[key]?.length ?? 0;
}

function EvaluatorDashboard() {
  const [totals, setTotals] = useState(defaultTotals);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardTotals() {
      setIsLoading(true);
      setError('');

      const [groupsResult, studentsResult, instrumentsResult, evaluationsResult] = await Promise.allSettled([
        listResource('groups', { limit: 100 }),
        listResource('students', { limit: 100 }),
        listResource('instruments', { limit: 100 }),
        listResource('evaluations', { status: 'published', limit: 100 }),
      ]);

      if (!isMounted) return;

      setTotals({
        groups: groupsResult.status === 'fulfilled' ? getTotal(groupsResult.value, 'groups') : 0,
        students: studentsResult.status === 'fulfilled' ? getTotal(studentsResult.value, 'students') : 0,
        instruments: instrumentsResult.status === 'fulfilled' ? getTotal(instrumentsResult.value, 'instruments') : 0,
        publishedEvaluations:
          evaluationsResult.status === 'fulfilled' ? getTotal(evaluationsResult.value, 'evaluations') : 0,
      });

      const failedResult = [groupsResult, studentsResult, instrumentsResult, evaluationsResult].find(
        (result) => result.status === 'rejected'
      );

      if (failedResult) {
        setError(getErrorMessage(failedResult.reason));
      }

      setIsLoading(false);
    }

    fetchDashboardTotals();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <DashboardShell
      eyebrow="Panel del evaluador"
      title="Gestión académica"
      description="Organiza grupos, tareas, instrumentos y evaluaciones desde un espacio diseñado para el flujo del profesor."
      stats={[
        { label: 'Grupos', value: isLoading ? '...' : String(totals.groups), icon: GraduationCap },
        { label: 'Estudiantes', value: isLoading ? '...' : String(totals.students), icon: Users },
        { label: 'Instrumentos', value: isLoading ? '...' : String(totals.instruments), icon: ClipboardCheck },
      ]}
      actions={[
        {
          title: 'Gestionar grupos',
          description: 'Crear clases y vincular estudiantes a cada grupo.',
          icon: GraduationCap,
          href: '/evaluator/groups',
        },
        {
          title: 'Crear tareas',
          description: 'Entrar a una clase para definir actividades evaluables con fechas y ponderación.',
          icon: NotebookTabs,
          href: '/evaluator/courses',
        },
        {
          title: 'Diseñar instrumentos',
          description: 'Crear rúbricas, listas de cotejo y escalas.',
          icon: ClipboardCheck,
          href: '/evaluator/instruments',
        },
        {
          title: 'Aplicar evaluaciones',
          description: 'Calcular notas, guardar feedback y publicar resultados.',
          icon: FileText,
          href: '/evaluator/evaluations',
        },
        {
          title: 'Imprimir reportes',
          description: 'Generar reportes individuales, por grupo, tarea o instrumento.',
          icon: Printer,
          href: '/evaluator/reports',
        },
      ]}
    >
      <aside className="dashboard-panel">
        {error ? <p className="form-message form-message-error">{error}</p> : null}
        <div className="panel-heading">
          <h2>Reportes imprimibles</h2>
          <p>Accesos directos para revisar e imprimir resultados publicados.</p>
        </div>
        <div className="progress-list">
          <div>
            <span>Evaluaciones publicadas</span>
            <strong>{isLoading ? '...' : totals.publishedEvaluations}</strong>
          </div>
          <div>
            <span>Reporte individual</span>
            <strong>Disponible</strong>
          </div>
          <div>
            <span>Reporte por grupo</span>
            <strong>Disponible</strong>
          </div>
          <div>
            <span>Reporte final de notas</span>
            <strong>Disponible</strong>
          </div>
        </div>
        <div className="report-preview">
          <Printer size={28} aria-hidden="true" />
          <p>
            {totals.publishedEvaluations
              ? 'Ya puedes generar reportes imprimibles con los resultados publicados.'
              : 'Publica una evaluación para habilitar reportes con datos reales.'}
          </p>
          <Link className="button button-secondary" to="/evaluator/reports">
            Abrir reportes
          </Link>
        </div>
      </aside>
    </DashboardShell>
  );
}

export default EvaluatorDashboard;
