import { Archive, BookOpenCheck, FolderOpen, Layers3, Pencil, Plus, Save, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import HierarchyBreadcrumb from '../../components/common/HierarchyBreadcrumb.jsx';
import {
  createCourseModule,
  deleteResource,
  listCourseModules,
  updateResource,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const emptyForm = {
  name: '',
  description: '',
  order: 0,
  status: 'active',
};

const statusLabels = {
  active: 'Activo',
  archived: 'Archivado',
};

function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
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

  const filteredModules = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return modules.filter((module) => {
      const matchesStatus = statusFilter === 'all' || module.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        module.name.toLowerCase().includes(normalizedSearch) ||
        (module.description ?? '').toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [modules, searchTerm, statusFilter]);

  const activeCount = modules.filter((module) => module.status === 'active').length;
  const archivedCount = modules.filter((module) => module.status === 'archived').length;
  const isCourseArchived = course?.status === 'archived';

  const loadModules = async () => {
    const data = await listCourseModules(courseId, { limit: 100 });
    setCourse(data.course);
    setModules(data.modules ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchModules() {
      setIsLoading(true);
      setError('');

      try {
        const data = await listCourseModules(courseId, { limit: 100 });
        if (!isMounted) return;
        setCourse(data.course);
        setModules(data.modules ?? []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchModules();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isCourseArchived) return;

    setError('');
    setMessage('');

    const normalizedName = formData.name.trim();
    if (!normalizedName) return;

    setIsSubmitting(true);

    try {
      const payload = {
        name: normalizedName,
        description: formData.description.trim(),
        order: Number(formData.order) || 0,
        status: formData.status,
      };

      if (editingId) {
        await updateResource('modules', editingId, payload);
        setMessage('Módulo actualizado correctamente.');
      } else {
        await createCourseModule(courseId, payload);
        setMessage('Módulo creado correctamente.');
      }

      resetForm();
      await loadModules();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (module) => {
    setEditingId(getId(module));
    setFormData({
      name: module.name,
      description: module.description ?? '',
      order: module.order ?? 0,
      status: module.status,
    });
  };

  const archiveModule = async (module, options = {}) => {
    setError('');
    setMessage('');

    try {
      const data = await deleteResource('modules', getId(module), options);
      const cascade = data.cascade;
      setMessage(
        cascade?.classesArchived
          ? `Módulo archivado junto con ${cascade.classesArchived} clase(s).`
          : 'Módulo archivado correctamente.'
      );
      if (editingId === getId(module)) resetForm();
      await loadModules();
    } catch (requestError) {
      if (requestError?.response?.status === 409 && !options.cascade) {
        setConfirmAction({
          title: `Archivar ${module.name} y su contenido`,
          description: `${getErrorMessage(requestError)} Puedes archivar el módulo junto con sus clases activas; las evaluaciones ya publicadas no se verán afectadas.`,
          confirmLabel: 'Archivar todo',
          onConfirm: () => archiveModule(module, { cascade: true }),
        });
        throw requestError;
      }
      setError(getErrorMessage(requestError));
    }
  };

  const handleArchive = (module) => {
    setConfirmAction({
      title: `Archivar ${module.name}`,
      description: 'El módulo quedará oculto para nuevos contenidos, pero no se afectarán evaluaciones publicadas.',
      confirmLabel: 'Archivar módulo',
      onConfirm: () => archiveModule(module),
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
      <HierarchyBreadcrumb items={[course ? { label: course.name } : { label: 'Curso' }]} />

      <div className="module-hero">
        <span className="module-hero-icon">
          <BookOpenCheck size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Curso</p>
          <h1>{course?.name ?? 'Detalle de curso'}</h1>
          <p className="dashboard-description">
            {course?.description || 'Gestiona los módulos que organizan las clases y tareas de este curso.'}
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}
      {isCourseArchived ? (
        <p className="form-message form-message-warning">
          Este curso está archivado. Puedes revisar sus módulos, pero no crear nuevos contenidos.
        </p>
      ) : null}

      <div className="metric-grid" aria-label="Resumen de módulos">
        <article className="metric-card">
          <span className="metric-icon">
            <Layers3 size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(modules.length)}</strong>
            <span>Módulos</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <BookOpenCheck size={20} aria-hidden="true" />
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
            <h2>{editingId ? 'Editar módulo' : 'Crear módulo'}</h2>
            <p>Define fechas y capacidad del módulo dentro del curso.</p>
          </div>

          <form className="stacked-form compact-form" onSubmit={handleSubmit}>
            <label>
              Nombre
              <input
                type="text"
                name="name"
                value={formData.name}
                placeholder="Nombre del módulo"
                onChange={handleChange}
                disabled={isCourseArchived}
                required
              />
            </label>
            <label>
              Fecha de inicio y fin
              <textarea
                name="description"
                value={formData.description}
                rows="4"
                placeholder="Ej. Del 12 de agosto al 20 de septiembre"
                onChange={handleChange}
                disabled={isCourseArchived}
              />
            </label>
            <label>
              Cantidad de estudiantes
              <input
                type="number"
                name="order"
                min="0"
                value={formData.order}
                onChange={handleChange}
                disabled={isCourseArchived}
              />
            </label>
            {editingId ? (
              <label>
                Estado
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  disabled={isCourseArchived}
                >
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
            ) : null}

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting || isCourseArchived}>
                {isSubmitting ? (
                  <span className="button-spinner-ring" aria-hidden="true" />
                ) : editingId ? (
                  <Save size={18} aria-hidden="true" />
                ) : (
                  <Plus size={18} aria-hidden="true" />
                )}
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear módulo'}
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
              <h2>Módulos</h2>
              <p>Consulta fechas, capacidad y clases de cada módulo.</p>
            </div>
            <span className="count-pill">{filteredModules.length}</span>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                placeholder="Buscar módulo"
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
              <div className="skeleton-list" aria-label="Cargando módulos">
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
            ) : filteredModules.map((module) => (
              <article className="resource-item" key={getId(module)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{module.name}</h3>
                    <span className={`status-badge status-${module.status}`}>
                      {statusLabels[module.status]}
                    </span>
                  </div>
                  <p>{module.description || 'Sin fecha de inicio y fin registrada.'}</p>
                  <div className="chip-row">
                    <span className="metadata-chip">{module.order ?? 0} estudiantes</span>
                  </div>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${module.name}`}>
                  <Link
                    className="icon-button labeled"
                    to={`/evaluator/courses/${courseId}/modules/${getId(module)}`}
                    title="Ver clases"
                    aria-label={`Ver clases de ${module.name}`}
                  >
                    <FolderOpen size={17} aria-hidden="true" />
                    <span>Clases</span>
                  </Link>
                  <button
                    className="icon-button labeled"
                    type="button"
                    onClick={() => handleEdit(module)}
                    title="Editar"
                    aria-label={`Editar ${module.name}`}
                    disabled={isCourseArchived}
                  >
                    <Pencil size={17} aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                  <button
                    className="icon-button labeled"
                    type="button"
                    onClick={() => handleArchive(module)}
                    title="Archivar"
                    aria-label={`Archivar ${module.name}`}
                    disabled={isCourseArchived || module.status === 'archived'}
                  >
                    <Archive size={17} aria-hidden="true" />
                    <span>Archivar</span>
                  </button>
                </div>
              </article>
            ))}

            {!isLoading && filteredModules.length === 0 ? (
              <EmptyState
                title="No hay módulos"
                description={
                  isCourseArchived
                    ? 'Este curso no tiene módulos activos para mostrar.'
                    : 'Crea el primer módulo para continuar con clases y tareas.'
                }
                action={
                  isCourseArchived
                    ? null
                    : {
                        label: 'Crear módulo',
                        onClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
                      }
                }
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

export default CourseDetailPage;
