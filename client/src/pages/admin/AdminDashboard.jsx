import { BarChart3, KeyRound, ShieldCheck, UserCog, Users } from 'lucide-react';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';

function AdminDashboard() {
  return (
    <DashboardShell
      eyebrow="Panel administrativo"
      title="Control del sistema"
      description="Gestiona la entrada de evaluadores, supervisa estados de cuenta y configura la operación general de EvalúaPro."
      stats={[
        { label: 'Evaluadores', value: '0', icon: UserCog },
        { label: 'Invitaciones', value: '0', icon: KeyRound },
        { label: 'Usuarios activos', value: '0', icon: Users },
      ]}
      actions={[
        {
          title: 'Crear evaluador',
          description: 'Alta manual de evaluadores desde un espacio privado.',
          icon: UserCog,
          href: '/admin/evaluators',
        },
        {
          title: 'Generar invitación',
          description: 'Código o enlace protegido para registrar evaluadores.',
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
          <p>Resumen de accesos, registro protegido y actividad administrativa.</p>
        </div>
        <div className="progress-list">
          <div>
            <span>Autenticación base</span>
            <strong>Lista</strong>
          </div>
          <div>
            <span>Registro público de evaluador</span>
            <strong>Oculto</strong>
          </div>
          <div>
            <span>Estadísticas generales</span>
            <strong>En seguimiento</strong>
          </div>
        </div>
        <div className="report-preview">
          <BarChart3 size={28} aria-hidden="true" />
          <p>Consulta el estado operativo de usuarios, invitaciones y seguridad.</p>
        </div>
      </aside>
    </DashboardShell>
  );
}

export default AdminDashboard;
