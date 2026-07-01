import { BarChart3, KeyRound, ShieldCheck, UserCog, Users } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';

function AdminDashboard() {
  return (
    <DashboardShell
      eyebrow="Panel administrativo"
      title="Control del sistema"
      description="Gestiona la entrada de evaluadores, supervisa estados de cuenta y prepara la configuracion general de EvaluaPro."
      stats={[
        { label: 'Evaluadores', value: '0', icon: UserCog },
        { label: 'Invitaciones', value: '0', icon: KeyRound },
        { label: 'Usuarios activos', value: '0', icon: Users },
      ]}
      actions={[
        {
          title: 'Crear evaluador',
          description: 'Alta manual de profesores desde un espacio privado.',
          icon: UserCog,
          href: '/admin/evaluators',
        },
        {
          title: 'Generar invitacion',
          description: 'Codigo o enlace protegido para registrar evaluadores.',
          icon: KeyRound,
          href: '/admin/invitations',
        },
        {
          title: 'Revisar seguridad',
          description: 'Estados de usuario, accesos y cuentas suspendidas.',
          icon: ShieldCheck,
          href: '/admin/settings',
        },
      ]}
    >
      <aside className="dashboard-panel">
        <div className="panel-heading">
          <h2>Vista general</h2>
          <p>Los indicadores reales llegaran al conectar los modulos administrativos.</p>
        </div>
        <div className="progress-list">
          <div>
            <span>Autenticacion base</span>
            <strong>Lista</strong>
          </div>
          <div>
            <span>Registro publico de profesor</span>
            <strong>Oculto</strong>
          </div>
          <div>
            <span>Estadisticas generales</span>
            <strong>Pendiente</strong>
          </div>
        </div>
        <div className="report-preview">
          <BarChart3 size={28} aria-hidden="true" />
          <p>Panel preparado para graficas y reportes administrativos.</p>
        </div>
      </aside>
    </DashboardShell>
  );
}

export default AdminDashboard;
