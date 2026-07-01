import ModulePage from '../../components/dashboard/ModulePage.jsx';
import { moduleIcons } from '../../utils/navigation.jsx';

export function EvaluatorGroupsPage() {
  return (
    <ModulePage
      eyebrow="Evaluador"
      title="Mis grupos"
      description="Base para crear clases, organizar estudiantes y segmentar evaluaciones por grupo."
      icon={moduleIcons.GraduationCap}
      primaryItems={[
        { title: 'Crear grupo', description: 'Registrar nombre, descripcion y estado de la clase.' },
        { title: 'Vincular estudiantes', description: 'Agregar participantes al grupo correspondiente.' },
        { title: 'Filtrar grupos', description: 'Buscar clases activas, archivadas o pendientes.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'CRUD', value: 'Pendiente' },
        { label: 'API requerida', value: 'Pendiente' },
      ]}
    />
  );
}

export function EvaluatorStudentsPage() {
  return (
    <ModulePage
      eyebrow="Evaluador"
      title="Estudiantes"
      description="Modulo para revisar perfiles academicos, estados de cuenta y vinculacion con grupos."
      icon={moduleIcons.Users}
      primaryItems={[
        { title: 'Listado filtrable', description: 'Buscar por nombre, correo, grupo o estado.' },
        { title: 'Suspender estudiante', description: 'Bloquear acceso sin borrar historial academico.' },
        { title: 'Eliminar logicamente', description: 'Marcar como eliminado conservando evaluaciones.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Acciones de estado', value: 'Pendiente' },
        { label: 'Confirmaciones', value: 'Pendiente' },
      ]}
    />
  );
}

export function EvaluatorTasksPage() {
  return (
    <ModulePage
      eyebrow="Evaluador"
      title="Tareas"
      description="Base para gestionar actividades evaluables con fechas, estados, grupos y ponderacion."
      icon={moduleIcons.NotebookTabs}
      primaryItems={[
        { title: 'Crear tarea', description: 'Definir titulo, descripcion, fechas y peso.' },
        { title: 'Asignar participantes', description: 'Seleccionar grupos o estudiantes especificos.' },
        { title: 'Cambiar estado', description: 'Pendiente, en progreso, completada o cancelada.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Formulario', value: 'Pendiente' },
        { label: 'Filtros', value: 'Pendiente' },
      ]}
    />
  );
}

export function EvaluatorInstrumentsPage() {
  return (
    <ModulePage
      eyebrow="Evaluador"
      title="Instrumentos"
      description="Modulo para crear rubricas, listas de cotejo, escalas y otros formularios evaluativos."
      icon={moduleIcons.ClipboardCheck}
      primaryItems={[
        { title: 'Rubrica analitica', description: 'Criterios, niveles de desempeno y puntuaciones.' },
        { title: 'Lista de cotejo', description: 'Indicadores con opciones si, no o parcial.' },
        { title: 'Estados', description: 'Borrador, activo o archivado segun el uso.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Constructor', value: 'Pendiente' },
        { label: 'Plantillas', value: 'Pendiente' },
      ]}
    />
  );
}

export function EvaluatorEvaluationsPage() {
  return (
    <ModulePage
      eyebrow="Evaluador"
      title="Evaluaciones"
      description="Base para aplicar instrumentos, calcular notas, guardar feedback y publicar resultados."
      icon={moduleIcons.FileText}
      primaryItems={[
        { title: 'Aplicar instrumento', description: 'Evaluar estudiante por criterios o indicadores.' },
        { title: 'Guardar borrador', description: 'Continuar una evaluacion antes de finalizarla.' },
        { title: 'Publicar resultado', description: 'Mostrar nota y sugerencias al estudiante.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Calculo de nota', value: 'Pendiente' },
        { label: 'Publicacion', value: 'Pendiente' },
      ]}
    />
  );
}

export function EvaluatorReportsPage() {
  return (
    <ModulePage
      eyebrow="Evaluador"
      title="Reportes"
      description="Modulo para imprimir o exportar instrumentos, resultados individuales, grupos y notas finales."
      icon={moduleIcons.Printer}
      primaryItems={[
        { title: 'Reporte individual', description: 'Historial y resultados de un estudiante.' },
        { title: 'Reporte por grupo', description: 'Resumen de notas y tareas completadas.' },
        { title: 'Vista imprimible', description: 'Componentes optimizados para navegador y PDF.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'CSS print', value: 'Pendiente' },
        { label: 'Exportacion', value: 'Pendiente' },
      ]}
    />
  );
}

export function EvaluatorProfilePage() {
  return (
    <ModulePage
      eyebrow="Evaluador"
      title="Perfil"
      description="Vista preparada para datos personales, especialidad, cambio de contrasena e instrumentos creados."
      icon={moduleIcons.UserRound}
      primaryItems={[
        { title: 'Datos basicos', description: 'Nombre, correo, foto opcional y especialidad.' },
        { title: 'Seguridad', description: 'Cambio de contrasena y gestion de sesion.' },
        { title: 'Resumen academico', description: 'Grupos e instrumentos creados por el evaluador.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Edicion', value: 'Pendiente' },
        { label: 'Validacion', value: 'Pendiente' },
      ]}
    />
  );
}
