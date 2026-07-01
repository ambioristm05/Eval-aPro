import {
  CirclePause,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const initialStudents = [
  {
    id: 'student-ana',
    name: 'Ana Martinez',
    email: 'ana.martinez@correo.com',
    group: 'Literatura 4to A',
    status: 'active',
    evaluationsCount: 3,
  },
  {
    id: 'student-carlos',
    name: 'Carlos Jimenez',
    email: 'carlos.jimenez@correo.com',
    group: 'Proyecto final 5to B',
    status: 'suspended',
    evaluationsCount: 1,
  },
  {
    id: 'student-lucia',
    name: 'Lucia Perez',
    email: 'lucia.perez@correo.com',
    group: 'Practica de observacion',
    status: 'deleted',
    evaluationsCount: 4,
  },
];

const emptyForm = {
  name: '',
  email: '',
  group: '',
};

const statusLabels = {
  active: 'Activo',
  suspended: 'Suspendido',
  deleted: 'Eliminado',
};

function EvaluatorStudentsPage() {
  const [students, setStudents] = useState(initialStudents);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch) ||
        student.group.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [students, searchTerm, statusFilter]);

  const activeCount = students.filter((student) => student.status === 'active').length;
  const suspendedCount = students.filter((student) => student.status === 'suspended').length;
  const deletedCount = students.filter((student) => student.status === 'deleted').length;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const normalizedName = formData.name.trim();
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) return;

    setStudents((current) => [
      {
        id: `student-${Date.now()}`,
        name: normalizedName,
        email: normalizedEmail,
        group: formData.group.trim() || 'Sin grupo',
        status: 'active',
        evaluationsCount: 0,
      },
      ...current,
    ]);
    setFormData(emptyForm);
  };

  const updateStudentStatus = (studentId, status) => {
    setStudents((current) =>
      current.map((student) => (student.id === studentId ? { ...student, status } : student)),
    );
  };

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <Users size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>Estudiantes</h1>
          <p className="dashboard-description">
            Gestiona participantes vinculados a tus clases, conserva su historial y controla
            accesos con estados seguros.
          </p>
        </div>
      </div>

      <div className="metric-grid" aria-label="Resumen de estudiantes">
        <article className="metric-card">
          <span className="metric-icon">
            <Users size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{activeCount}</strong>
            <span>Activos</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <CirclePause size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{suspendedCount}</strong>
            <span>Suspendidos</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Trash2 size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{deletedCount}</strong>
            <span>Eliminados</span>
          </div>
        </article>
      </div>

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Agregar estudiante</h2>
            <p>Registro local del participante para preparar la vinculacion real.</p>
          </div>

          <form className="stacked-form compact-form" onSubmit={handleSubmit}>
            <label>
              Nombre completo
              <input
                type="text"
                name="name"
                value={formData.name}
                placeholder="Nombre del estudiante"
                autoComplete="name"
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Correo electronico
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="estudiante@correo.com"
                autoComplete="email"
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Grupo
              <input
                type="text"
                name="group"
                value={formData.group}
                placeholder="Ej. Literatura 4to A"
                onChange={handleChange}
              />
            </label>

            <button className="button button-primary" type="submit">
              <UserPlus size={18} aria-hidden="true" />
              Agregar estudiante
            </button>
          </form>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Listado</h2>
              <p>Busca por nombre, correo o grupo y filtra por estado.</p>
            </div>
            <span className="count-pill">{filteredStudents.length}</span>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                placeholder="Buscar estudiante"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
              <option value="deleted">Eliminados</option>
            </select>
          </div>

          <div className="resource-list">
            {filteredStudents.map((student) => (
              <article className="resource-item" key={student.id}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{student.name}</h3>
                    <span className={`status-badge status-${student.status}`}>
                      {statusLabels[student.status]}
                    </span>
                  </div>
                  <p>{student.email}</p>
                  <div className="resource-meta">
                    <span>{student.group}</span>
                    <span>{student.evaluationsCount} evaluaciones</span>
                  </div>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${student.name}`}>
                  {student.status === 'active' ? (
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => updateStudentStatus(student.id, 'suspended')}
                      title="Suspender"
                      aria-label={`Suspender ${student.name}`}
                    >
                      <CirclePause size={17} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => updateStudentStatus(student.id, 'active')}
                      title="Reactivar"
                      aria-label={`Reactivar ${student.name}`}
                    >
                      <RotateCcw size={17} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => updateStudentStatus(student.id, 'deleted')}
                    title="Eliminar logicamente"
                    aria-label={`Eliminar logicamente ${student.name}`}
                    disabled={student.status === 'deleted'}
                  >
                    {student.status === 'deleted' ? (
                      <Save size={17} aria-hidden="true" />
                    ) : (
                      <Trash2 size={17} aria-hidden="true" />
                    )}
                  </button>
                </div>
              </article>
            ))}

            {filteredStudents.length === 0 ? (
              <div className="inline-empty">
                <h3>No hay estudiantes</h3>
                <p>Ajusta los filtros o agrega un estudiante nuevo.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorStudentsPage;
