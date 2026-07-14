import { BarChart3, KeyRound, ShieldCheck, UserCog, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import DashboardShell from '../../components/dashboard/DashboardShell.jsx';
import { getEvaluators } from '../../services/adminService.js';
import { getInvitations } from '../../services/authService.js';
import { getOverviewStatistics } from '../../services/statisticsService.js';

function AdminDashboard() {
  const [stats, setStats] = useState({ evaluators: '—', invitations: '—', active: '—' });

  useEffect(() => {
    let isMounted = true;
    Promise.all([getEvaluators(), getInvitations(), getOverviewStatistics()])
      .then(([evData, invData, overview]) => {
        if (!isMounted) return;
        const activeStudents = overview?.distributions?.studentsByStatus?.active ?? 0;
        const pendingInv = Array.isArray(invData)
          ? invData.filter((i) => i.status === 'pending').length
          : 0;
        setStats({
          evaluators: evData?.evaluators?.length ?? evData?.total ?? 0,
          invitations: pendingInv,
          active: activeStudents,
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
