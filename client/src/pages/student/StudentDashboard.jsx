import { Award, BookOpenCheck, FileDown, MessageSquareText, Target } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';

function StudentDashboard() {
  return (
    <DashboardShell
      eyebrow="Panel del estudiante"
      title="Mi avance"
      description="Consulta tareas asignadas, resultados publicados, sugerencias de mejora y la nota acumulada cuando esten disponibles."
      stats={[
        { label: 'Tareas asignadas', value: '0', icon: BookOpenCheck },
        { label: 'Evaluaciones', value: '0', icon: Target },
        { label: 'Nota final', value: '--', icon: Award },
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
          description: 'Retroalimentacion personalizada para mejorar.',
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
          <p>El historial aparecera aqui despues de publicar evaluaciones.</p>
        </div>
        <div className="student-score">
          <span>Nota acumulada</span>
          <strong>Sin datos</strong>
        </div>
        <div className="progress-list">
          <div>
            <span>Cuenta</span>
            <strong>Activa</strong>
          </div>
          <div>
            <span>Resultados publicados</span>
            <strong>0</strong>
          </div>
          <div>
            <span>Sugerencias recibidas</span>
            <strong>0</strong>
          </div>
        </div>
      </aside>
    </DashboardShell>
  );
}

export default StudentDashboard;
