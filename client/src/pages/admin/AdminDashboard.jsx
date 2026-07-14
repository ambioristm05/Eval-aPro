import { BarChart3, KeyRound, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';
import { getEvaluators } from '../../services/adminService.js';
import { getInvitations } from '../../services/authService.js';
import { getOverviewStatistics } from '../../services/statisticsService.js';

function AdminDashboard() {
  const [stats, setStats] = useState({
    evaluators: '—', invitations: '—', active: '—',
    suspended: '—', groups: '—', evaluations: '—',
  });

  useEffect(() => {
    let isMounted = true;
    Promise.all([getEvaluators(), getInvitations(), getOverviewStatistics()])
      .then(([evData, invData, overview]) => {
        if (!isMounted) return;
        const dist = overview?.distributions ?? {};
        const activeStudents = dist.studentsByStatus?.active ?? 0;
        const suspendedStudents = dist.studentsByStatus?.suspended ?? 0;
        const pendingInv = Array.isArray(invData)
          ? invData.filter((i) => i.status === 'pending').length
          : 0;
        setStats({
          evaluators: evData?.evaluators?.length ?? 0,
          invitations: pendingInv,
          active: activeStudents,
          suspended: suspendedStudents,
          groups: overview?.totals?.groups ?? 0,
          evaluations: overview?.totals?.evaluations ?? 0,
        });
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  return (
    <DashboardShell
      eyebrow="Panel administrativo"
      title="Control del sistema"
      description="Gestiona la entrada de evaluadores, supervisa estados de cuenta y configura la operación general de EvalúaPro."
      stats={[
        { label: 'Evaluadores', value: String(stats.evaluators), icon: UserCog },
        { label: 'Invitaciones pendientes', value: String(stats.invitations), icon: KeyRound },
        { label: 'Estudiantes activos', value: String(stats.active), icon: Users },
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
          <p>Actividad actual del sistema.</p>
        </div>
        <div className="progress-list">
          <div>
            <span>Evaluadores registrados</span>
            <strong>{stats.evaluators}</strong>
          </div>
          <div>
            <span>Estudiantes activos</span>
            <strong>{stats.active}</strong>
          </div>
          <div>
            <span>Estudiantes suspendidos</span>
            <strong>{stats.suspended}</strong>
          </div>
          <div>
            <span>Grupos</span>
            <strong>{stats.groups}</strong>
          </div>
          <div>
            <span>Evaluaciones totales</span>
            <strong>{stats.evaluations}</strong>
          </div>
          <div>
            <span>Invitaciones pendientes</span>
            <strong>{stats.invitations}</strong>
          </div>
        </div>
        <div className="report-preview">
          <BarChart3 size={28} aria-hidden="true" />
          <p>Revisa las estadísticas completas para más detalle.</p>
        </div>
      </aside>
    </DashboardShell>
  );
}

export default AdminDashboard;
