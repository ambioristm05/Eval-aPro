import {
  ClipboardCheck,
  FileText,
  GraduationCap,
  NotebookTabs,
  Printer,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';
import { listResource } from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

const defaultTotals = {
  groups: 0,
  students: 0,
  instruments: 0,
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

      const [groupsResult, studentsResult, instrumentsResult] = await Promise.allSettled([
        listResource('groups', { limit: 100 }),
        listResource('students', { limit: 100 }),
        listResource('instruments', { limit: 100 }),
      ]);

      if (!isMounted) return;

      setTotals({
        groups: groupsResult.status === 'fulfilled' ? getTotal(groupsResult.value, 'groups') : 0,
        students: studentsResult.status === 'fulfilled' ? getTotal(studentsResult.value, 'students') : 0,
        instruments: instrumentsResult.status === 'fulfilled' ? getTotal(instrumentsResult.value, 'instruments') : 0,
      });

      const failedResult = [groupsResult, studentsResult, instrumentsResult].find(
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
      title="Gestion académica"
      description="Organiza grupos, tareas, instrumentos y evaluaciones desde un espacio preparado para el flujo del profesor."
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
          description: 'Definir actividades evaluables con fechas y ponderacion.',
          icon: NotebookTabs,
          href: '/evaluator/tasks',
        },
        {
          title: 'Disenar instrumentos',
          description: 'Preparar rúbricas, listas de cotejo y escalas.',
          icon: ClipboardCheck,
          href: '/evaluator/instruments',
        },
        {
          title: 'Aplicar evaluaciones',
          description: 'Calcular notas, guardar feedback y publicar resultados.',
          icon: FileText,
          href: '/evaluator/evaluations',
        },
      ]}
    >
      <aside className="dashboard-panel">
        {error ? <p className="form-message form-message-error">{error}</p> : null}
        <div className="panel-heading">
          <h2>Proximo flujo</h2>
          <p>Orden recomendado para construir el módulo académico.</p>
        </div>
        <ol className="timeline-list">
          <li>Crear grupo o clase.</li>
          <li>Agregar o vincular estudiantes.</li>
          <li>Crear tarea e instrumento asociado.</li>
          <li>Aplicar evaluación y publicar resultados.</li>
        </ol>
        <div className="report-preview">
          <Printer size={28} aria-hidden="true" />
          <p>Los reportes imprimibles se conectaran cuando existan resultados.</p>
        </div>
      </aside>
    </DashboardShell>
  );
}

export default EvaluatorDashboard;
