import { Archive, BookOpenCheck, FolderOpen, Layers3, Pencil, Plus, Save, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { createResource, deleteResource, listResource, updateResource } from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

const emptyForm = {
  name: '',
  description: '',
  status: 'active',
};

const statusLabels = {
  active: 'Activo',
  archived: 'Archivado',
};

function getId(resource) {
  return resource.id ?? resource._id;
}

function EvaluatorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const filteredCourses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        course.name.toLowerCase().includes(normalizedSearch) ||
        (course.description ?? '').toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [courses, searchTerm, statusFilter]);

  const activeCount = courses.filter((course) => course.status === 'active').length;
  const archivedCount = courses.filter((course) => course.status === 'archived').length;

  const loadCourses = async () => {
    const data = await listResource('courses', { limit: 100 });
    setCourses(data.courses ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchCourses() {
      setIsLoading(true);
      setError('');

      try {
        const data = await listResource('courses', { limit: 100 });
        if (!isMounted) return;
        setCourses(data.courses ?? []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    const normalizedName = formData.name.trim();
    if (!normalizedName) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: normalizedName,
        description: formData.description.trim(),
        status: formData.status,
      };

      if (editingId) {
        await updateResource('courses', editingId, payload);
        setMessage('Curso actualizado correctamente.');
      } else {
        await createResource('courses', payload);
        setMessage('Curso creado correctamente.');
      }

      resetForm();
      await loadCourses();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (course) => {
    setEditingId(getId(course));
    setFormData({
      name: course.name,
      description: course.description ?? '',
      status: course.status,
    });
  };

  const archiveCourse = async (course, options = {}) => {
    setError('');
    setMessage('');

    try {
      const data = await deleteResource('courses', getId(course), options);
      const cascade = data.cascade;
      setMessage(
        cascade?.modulesArchived
          ? `Curso archivado junto con ${cascade.modulesArchived} módulo(s) y ${cascade.classesArchived} clase(s).`
          : 'Curso archivado correctamente.'
      );
      if (editingId === getId(course)) resetForm();
      await loadCourses();
    } catch (requestError) {
      if (requestError?.response?.status === 409 && !options.cascade) {
        setConfirmAction({
          title: `Archivar ${course.name} y su contenido`,
          description: `${getErrorMessage(requestError)} Puedes archivar el curso junto con sus módulos y clases activos; las evaluaciones ya publicadas no se verán afectadas.`,
          confirmLabel: 'Archivar todo',
          onConfirm: () => archiveCourse(course, { cascade: true }),
        });
        throw requestError;
      }
      setError(getErrorMessage(requestError));
    }
  };

  const handleArchive = (course) => {
    setConfirmAction({
      title: `Archivar ${course.name}`,
      description: 'El curso quedará oculto para nuevos contenidos, pero no se afectarán las evaluaciones publicadas.',
      confirmLabel: 'Archivar curso',
      onConfirm: () => archiveCourse(course),
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setIsConfirming(true);
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } catch {
      // onConfirm may have replaced confirmAction with a follow-up prompt (e.g. cascade archive);
      // leave that state in place instead of clearing it here.
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <BookOpenCheck size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>Cursos</h1>
          <p className="dashboard-description">
            Organiza la jerarquía académica de cursos, módulos, clases y tareas desde un punto de entrada.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      <div className="metric-grid" aria-label="Resumen de cursos">
        <article className="metric-card">
          <span className="metric-icon">
            <BookOpenCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(courses.length)}</strong>
            <span>Cursos</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Layers3 size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(activeCount)}</strong>
            <span>Activos</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Archive size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(archivedCount)}</strong>
            <span>Archivados</span>
          </div>
        </article>
      </div>

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>{editingId ? 'Editar curso' : 'Crear curso'}</h2>
            <p>Define el contenedor principal para módulos, clases y tareas.</p>
          </div>

          <form className="stacked-form compact-form" onSubmit={handleSubmit}>
            <label>
              Nombre
              <input
                type="text"
                name="name"
                value={formData.name}
                placeholder="Nombre del curso"
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Descripción
              <textarea
                name="description"
                value={formData.description}
                rows="4"
                placeholder="Alcance o propósito del curso"
                onChange={handleChange}
              />
            </label>
            {editingId ? (
              <label>
                Estado
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
            ) : null}

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="button-spinner-ring" aria-hidden="true" />
                ) : editingId ? (
                  <Save size={18} aria-hidden="true" />
                ) : (
                  <Plus size={18} aria-hidden="true" />
                )}
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear curso'}
              </button>
              {editingId ? (
                <button className="button button-ghost" type="button" onClick={resetForm}>
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Listado</h2>
              <p>Busca cursos y entra a sus módulos.</p>
            </div>
            <span className="count-pill">{filteredCourses.length}</span>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                placeholder="Buscar curso"
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
              <option value="archived">Archivados</option>
            </select>
          </div>

          <div className="resource-list">
            {isLoading ? (
              <div className="skeleton-list" aria-label="Cargando cursos">
                {[0, 1, 2].map((item) => (
                  <div className="skeleton-card" key={item}>
                    <span className="skeleton-line skeleton-line-title" />
                    <span className="skeleton-line" />
                    <div className="skeleton-chip-row">
                      <span className="skeleton-chip" />
                      <span className="skeleton-chip" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredCourses.map((course) => (
              <article className="resource-item" key={getId(course)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{course.name}</h3>
                    <span className={`status-badge status-${course.status}`}>
                      {statusLabels[course.status]}
                    </span>
                  </div>
                  <p>{course.description || 'Sin descripción registrada.'}</p>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${course.name}`}>
                  <Link
                    className="icon-button labeled"
                    to={`/evaluator/courses/${getId(course)}`}
                    title="Ver módulos"
                    aria-label={`Ver módulos de ${course.name}`}
                  >
                    <FolderOpen size={17} aria-hidden="true" />
                    <span>Módulos</span>
                  </Link>
                  <button
                    className="icon-button labeled"
                    type="button"
                    onClick={() => handleEdit(course)}
                    title="Editar"
                    aria-label={`Editar ${course.name}`}
                  >
                    <Pencil size={17} aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                  <button
                    className="icon-button labeled"
                    type="button"
                    onClick={() => handleArchive(course)}
                    title="Archivar"
                    aria-label={`Archivar ${course.name}`}
                    disabled={course.status === 'archived'}
                  >
                    <Archive size={17} aria-hidden="true" />
                    <span>Archivar</span>
                  </button>
                </div>
              </article>
            ))}

            {!isLoading && filteredCourses.length === 0 ? (
              <EmptyState
                title="No hay cursos"
                description="Crea un curso para comenzar a organizar módulos, clases y tareas."
                action={{
                  label: 'Crear curso',
                  onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
                }}
              />
            ) : null}
          </div>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        description={confirmAction?.description}
        confirmLabel={confirmAction?.confirmLabel}
        isBusy={isConfirming}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
    </section>
  );
}

export default EvaluatorCoursesPage;
