import ModulePage from '../../components/dashboard/ModulePage.jsx';
import { moduleIcons } from '../../utils/navigation.jsx';

export function AdminEvaluatorsPage() {
  return (
    <ModulePage
      eyebrow="Administracion"
      title="Gestionar evaluadores"
      description="Espacio privado para crear, aprobar, suspender y revisar cuentas de profesores."
      icon={moduleIcons.UserCog}
      primaryItems={[
        {
          title: 'Crear cuenta',
          description: 'Alta manual de evaluadores con rol protegido.',
        },
        {
          title: 'Cambiar estado',
          description: 'Suspender o reactivar profesores segun las reglas del sistema.',
        },
        {
          title: 'Auditoria basica',
          description: 'Registrar quien crea o modifica cuentas sensibles.',
        },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Formulario real', value: 'Pendiente' },
        { label: 'API requerida', value: 'Pendiente' },
      ]}
    />
  );
}

export function AdminInvitationsPage() {
  return (
    <ModulePage
      eyebrow="Administracion"
      title="Invitaciones"
      description="Modulo para generar enlaces o codigos de registro de evaluadores sin exponer un registro publico."
      icon={moduleIcons.KeyRound}
      primaryItems={[
        {
          title: 'Generar token',
          description: 'Crear invitaciones de un solo uso asociadas a un correo.',
        },
        {
          title: 'Validar expiracion',
          description: 'Controlar vigencia y estado de uso de cada invitacion.',
        },
        {
          title: 'Revocar acceso',
          description: 'Invalidar invitaciones antes de que sean usadas.',
        },
      ]}
      statusItems={[
        { label: 'Registro publico profesor', value: 'Oculto' },
        { label: 'Pantalla base', value: 'Lista' },
        { label: 'API requerida', value: 'Pendiente' },
      ]}
    />
  );
}

export function AdminStatisticsPage() {
  return (
    <ModulePage
      eyebrow="Administracion"
      title="Estadisticas generales"
      description="Resumen global para monitorear usuarios, evaluaciones, instrumentos y actividad del sistema."
      icon={moduleIcons.BarChart3}
      primaryItems={[
        {
          title: 'Usuarios por rol',
          description: 'Distribucion entre administradores, evaluadores y estudiantes.',
        },
        {
          title: 'Actividad academica',
          description: 'Cantidad de tareas, instrumentos y evaluaciones publicadas.',
        },
        {
          title: 'Estados de cuenta',
          description: 'Cuentas activas, suspendidas, eliminadas y pendientes.',
        },
      ]}
      statusItems={[
        { label: 'Vista base', value: 'Lista' },
        { label: 'Graficas', value: 'Pendiente' },
        { label: 'Datos reales', value: 'Pendiente' },
      ]}
    />
  );
}

export function AdminSettingsPage() {
  return (
    <ModulePage
      eyebrow="Administracion"
      title="Configuracion"
      description="Ajustes generales de seguridad, permisos y comportamiento del sistema."
      icon={moduleIcons.Settings}
      primaryItems={[
        {
          title: 'Politicas de acceso',
          description: 'Definir reglas para invitaciones y estados bloqueados.',
        },
        {
          title: 'Preferencias de reportes',
          description: 'Preparar opciones de impresion y exportacion.',
        },
        {
          title: 'Parametros academicos',
          description: 'Base para criterios comunes del centro o institucion.',
        },
      ]}
      statusItems={[
        { label: 'Ruta privada', value: 'Lista' },
        { label: 'Controles', value: 'Pendiente' },
        { label: 'Persistencia', value: 'Pendiente' },
      ]}
    />
  );
}
