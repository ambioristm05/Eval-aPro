import { GraduationCap, Mail, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getMyGroup } from '../../services/studentService.js';
import { useAuthStore } from '../../stores/authStore.js';

function StudentGroupPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [group, setGroup] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    getMyGroup()
      .then((data) => { if (isMounted) setGroup(data); })
      .catch((err) => { if (isMounted && err?.response?.status === 404) setNotFound(true); })
      .finally(() => { if (isMounted) setIsLoading(false); });

    return () => { isMounted = false; };
  }, []);

  if (isLoading) {
    return (
      <section className="module-page">
        <div className="route-loader">Cargando grupo…</div>
      </section>
    );
  }

  if (notFound || !group) {
    return (
      <section className="module-page">
        <div className="module-hero">
          <span className="module-hero-icon"><Users size={28} aria-hidden="true" /></span>
          <div>
            <p className="eyebrow">Estudiante</p>
            <h1>Mi grupo</h1>
          </div>
        </div>
        <div className="empty-state">
          <Users size={36} aria-hidden="true" className="empty-state-icon" />
          <p>Aún no perteneces a ningún grupo.</p>
          <span className="empty-state-hint">Tu evaluador te asignará a un grupo cuando esté listo.</span>
        </div>
      </section>
    );
  }

  const companions = group.students.filter((s) => s._id !== currentUser?._id && s.id !== currentUser?._id);

  return (
    <section className="module-page">
      <div className="module-hero">
        <span className="module-hero-icon"><Users size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">Estudiante</p>
          <h1>Mi grupo</h1>
          <p className="dashboard-description">Tu grupo de trabajo, evaluador y compañeros.</p>
        </div>
      </div>

      <div className="module-page-grid">
        {/* Info del grupo */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>{group.name}</h2>
            {group.description ? <p>{group.description}</p> : null}
          </div>

          <div className="progress-list">
            <div>
              <span>Estado</span>
              <strong className={`status-chip status-chip-${group.status?.toLowerCase()}`}>
                {group.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
              </strong>
            </div>
            <div>
              <span>Total de estudiantes</span>
              <strong>{group.students.length}</strong>
            </div>
          </div>
        </section>

        {/* Evaluador */}
        <aside className="dashboard-panel">
          <div className="panel-heading">
            <h2>
              <GraduationCap size={17} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
              Evaluador
            </h2>
          </div>
          <div className="group-member-card group-member-card-evaluator">
            <span className="group-member-avatar">
              {group.evaluator.name.charAt(0).toUpperCase()}
            </span>
            <div className="group-member-info">
              <strong>{group.evaluator.name}</strong>
              <span>
                <Mail size={13} aria-hidden="true" />
                {group.evaluator.email}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Compañeros */}
      <section className="dashboard-panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-heading">
          <h2>
            <Users size={17} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: '0.35rem' }} />
            Compañeros
          </h2>
          <p>{companions.length ? `${companions.length} compañero${companions.length !== 1 ? 's' : ''} en este grupo.` : 'Eres el único estudiante en este grupo por ahora.'}</p>
        </div>

        {companions.length > 0 ? (
          <ul className="group-members-list">
            {companions.map((student) => (
              <li key={student._id ?? student.id} className="group-member-card">
                <span className="group-member-avatar">
                  {student.name.charAt(0).toUpperCase()}
                </span>
                <div className="group-member-info">
                  <strong>{student.name}</strong>
                  <span>
                    <Mail size={13} aria-hidden="true" />
                    {student.email}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </section>
  );
}

export default StudentGroupPage;
