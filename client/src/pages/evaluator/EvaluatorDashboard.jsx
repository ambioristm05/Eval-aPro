import {
  ClipboardCheck,
  FileText,
  GraduationCap,
  NotebookTabs,
  Printer,
  Users,
} from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';

function EvaluatorDashboard() {
  return (
    <DashboardShell
      eyebrow="Panel del evaluador"
      title="Gestion académica"
      description="Organiza grupos, tareas, instrumentos y evaluaciones desde un espacio preparado para el flujo del profesor."
      stats={[
        { label: 'Grupos', value: '0', icon: GraduationCap },
        { label: 'Estudiantes', value: '0', icon: Users },
        { label: 'Instrumentos', value: '0', icon: ClipboardCheck },
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
