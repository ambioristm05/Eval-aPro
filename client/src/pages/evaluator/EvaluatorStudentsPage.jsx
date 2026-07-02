import {
  CirclePause,
  RotateCcw,
  Save,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  createResource,
  deleteStudent,
  listResource,
  reactivateStudent,
  suspendStudent,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  group: '',
};

const statusLabels = {
  active: 'Activo',
  suspended: 'Suspendido',
  deleted: 'Eliminado',
};

function getId(resource) {
  return resource.id ?? resource._id;
}

function getGroupNames(student) {
  if (!student.groups?.length) return 'Sin grupo';
  return student.groups.map((group) => group.name).filter(Boolean).join(', ') || 'Sin grupo';
}

function EvaluatorStudentsPage() {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return students.filter((student) => {
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        student.name.toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch) ||
        getGroupNames(student).toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [students, searchTerm, statusFilter]);

  const activeCount = students.filter((student) => student.status === 'active').length;
  const suspendedCount = students.filter((student) => student.status === 'suspended').length;
  const deletedCount = students.filter((student) => student.status === 'deleted').length;

  const loadStudents = async () => {
    const [visibleData, deletedData] = await Promise.all([
      listResource('students', { limit: 100 }),
      listResource('students', { status: 'deleted', limit: 100 }),
    ]);

    const mergedStudents = [...(visibleData.students ?? []), ...(deletedData.students ?? [])];
    const uniqueStudents = Array.from(
      new Map(mergedStudents.map((student) => [getId(student), student])).values(),
    );

    setStudents(uniqueStudents);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      setIsLoading(true);
      setError('');

      try {
        const [groupsData] = await Promise.all([
          listResource('groups', { status: 'active', limit: 100 }),
          loadStudents(),
        ]);

        if (!isMounted) return;
        setGroups(groupsData.groups ?? []);
        setFormData((current) => ({
          ...current,
          group: current.group || (groupsData.groups?.[0] ? getId(groupsData.groups[0]) : ''),
        }));
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedName = formData.name.trim();
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || formData.password.length < 8) {
      setError('Completa nombre, correo y una contraseña temporal de al menos 8 caracteres.');
      return;
    }

    if (!formData.group) {
      setError('Crea o selecciona un grupo activo antes de agregar estudiantes.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createResource('students', {
        name: normalizedName,
        email: normalizedEmail,
        password: formData.password,
        group: formData.group,
      });

      setMessage('Estudiante creado correctamente.');
      setFormData((current) => ({
        ...emptyForm,
        group: current.group,
      }));
      await loadStudents();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStudentStatus = async (studentId, status) => {
    setError('');
    setMessage('');

    try {
      if (status === 'suspended') {
        await suspendStudent(studentId, 'Suspendido por el evaluador');
        setMessage('Estudiante suspendido.');
      }

      if (status === 'active') {
        await reactivateStudent(studentId, 'Reactivado por el evaluador');
        setMessage('Estudiante reactivado.');
      }

      if (status === 'deleted') {
        await deleteStudent(studentId, 'Eliminado lógicamente por el evaluador');
        setMessage('Estudiante eliminado lógicamente.');
      }

      await loadStudents();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
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

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

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
            <p>Crea una cuenta de estudiante y vincúlala a un grupo activo.</p>
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
              Correo electrónico
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
              Contraseña temporal
              <input
                type="password"
                name="password"
                value={formData.password}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                onChange={handleChange}
                required
                minLength={8}
              />
            </label>
            <label>
              Grupo
              <select name="group" value={formData.group} onChange={handleChange} required>
                {groups.map((group) => (
                  <option key={getId(group)} value={getId(group)}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="button button-primary"
              type="submit"
              disabled={isSubmitting || !groups.length}
            >
              <UserPlus size={18} aria-hidden="true" />
              {isSubmitting ? 'Agregando...' : 'Agregar estudiante'}
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
              <article className="resource-item" key={getId(student)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{student.name}</h3>
                    <span className={`status-badge status-${student.status}`}>
                      {statusLabels[student.status]}
                    </span>
                  </div>
                  <p>{student.email}</p>
                  <div className="resource-meta">
                    <span>{getGroupNames(student)}</span>
                    <span>Cuenta creada</span>
                  </div>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${student.name}`}>
                  {student.status === 'active' ? (
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => updateStudentStatus(getId(student), 'suspended')}
                      title="Suspender"
                      aria-label={`Suspender ${student.name}`}
                    >
                      <CirclePause size={17} aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      className="icon-button"
                      type="button"
                      onClick={() => updateStudentStatus(getId(student), 'active')}
                      title="Reactivar"
                      aria-label={`Reactivar ${student.name}`}
                    >
                      <RotateCcw size={17} aria-hidden="true" />
                    </button>
                  )}
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => updateStudentStatus(getId(student), 'deleted')}
                    title="Eliminar lógicamente"
                    aria-label={`Eliminar lógicamente ${student.name}`}
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
                <h3>{isLoading ? 'Cargando estudiantes...' : 'No hay estudiantes'}</h3>
                <p>{isLoading ? 'Espera un momento.' : 'Ajusta los filtros o agrega un estudiante nuevo.'}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorStudentsPage;
