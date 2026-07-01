import ModulePage from '../../components/dashboard/ModulePage.jsx';
import { moduleIcons } from '../../utils/navigation.jsx';

export function StudentTasksPage() {
  return (
    <ModulePage
      eyebrow="Estudiante"
      title="Mis tareas"
      description="Listado de actividades asignadas por el evaluador con fechas, estado e instrumento asociado."
      icon={moduleIcons.BookOpenCheck}
      primaryItems={[
        { title: 'Tareas pendientes', description: 'Actividades por completar o revisar.' },
        { title: 'Tareas completadas', description: 'Historial de entregas evaluadas.' },
        { title: 'Detalle de actividad', description: 'Descripcion, fecha de entrega e instrumento.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Datos reales', value: 'Pendiente' },
        { label: 'Filtros', value: 'Pendiente' },
      ]}
    />
  );
}

export function StudentEvaluationsPage() {
  return (
    <ModulePage
      eyebrow="Estudiante"
      title="Mis evaluaciones"
      description="Historial de evaluaciones aplicadas, estados de publicacion y detalles por criterio."
      icon={moduleIcons.Target}
      primaryItems={[
        { title: 'Evaluaciones publicadas', description: 'Notas disponibles para consulta.' },
        { title: 'Detalle por criterio', description: 'Puntuacion obtenida en cada parte del instrumento.' },
        { title: 'Historial', description: 'Registro cronologico de evaluaciones.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Detalle', value: 'Pendiente' },
        { label: 'Privacidad', value: 'Pendiente' },
      ]}
    />
  );
}

export function StudentResultsPage() {
  return (
    <ModulePage
      eyebrow="Estudiante"
      title="Resultados"
      description="Vista para consultar notas, porcentajes, puntos fuertes, mejoras y promedio acumulado."
      icon={moduleIcons.Award}
      primaryItems={[
        { title: 'Nota obtenida', description: 'Puntuacion, maxima y porcentaje final.' },
        { title: 'Nota acumulada', description: 'Promedio simple o ponderado segun configuracion.' },
        { title: 'Reporte descargable', description: 'Opcion de impresion cuando este habilitada.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Calculo final', value: 'Pendiente' },
        { label: 'Impresion', value: 'Pendiente' },
      ]}
    />
  );
}

export function StudentSuggestionsPage() {
  return (
    <ModulePage
      eyebrow="Estudiante"
      title="Sugerencias de mejora"
      description="Retroalimentacion personalizada publicada por el evaluador para orientar el progreso."
      icon={moduleIcons.MessageSquareText}
      primaryItems={[
        { title: 'Aspectos por mejorar', description: 'Comentarios vinculados a resultados concretos.' },
        { title: 'Puntos fuertes', description: 'Observaciones positivas del desempeno.' },
        { title: 'Seguimiento', description: 'Historial de recomendaciones recibidas.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Comentarios reales', value: 'Pendiente' },
        { label: 'Historial', value: 'Pendiente' },
      ]}
    />
  );
}

export function StudentProfilePage() {
  return (
    <ModulePage
      eyebrow="Estudiante"
      title="Perfil"
      description="Modulo para editar datos basicos, cambiar contrasena y solicitar eliminacion logica de la cuenta."
      icon={moduleIcons.UserRound}
      primaryItems={[
        { title: 'Datos personales', description: 'Nombre, correo, foto opcional y grupo asignado.' },
        { title: 'Seguridad', description: 'Cambio de contrasena desde el perfil.' },
        { title: 'Eliminar cuenta', description: 'Confirmacion con contrasena y cierre automatico de sesion.' },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Edicion', value: 'Pendiente' },
        { label: 'Eliminacion logica', value: 'Pendiente' },
      ]}
    />
  );
}
