import { Archive, BookOpenCheck, ClipboardList, FolderOpen, Pencil, Plus, Save, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import HierarchyBreadcrumb from '../../components/common/HierarchyBreadcrumb.jsx';
import {
  createModuleClass,
  deleteResource,
  listModuleClasses,
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

function ModuleDetailPage() {
  const { courseId, moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [classes, setClasses] = useState([]);
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

  const filteredClasses = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return classes.filter((academicClass) => {
      const matchesStatus = statusFilter === 'all' || academicClass.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        academicClass.name.toLowerCase().includes(normalizedSearch) ||
        (academicClass.description ?? '').toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [classes, searchTerm, statusFilter]);

  const activeCount = classes.filter((academicClass) => academicClass.status === 'active').length;
  const archivedCount = classes.filter((academicClass) => academicClass.status === 'archived').length;
  const course = module?.course;
  const isCourseArchived = course?.status === 'archived';
  const isModuleArchived = module?.status === 'archived';
  const isReadOnly = isCourseArchived || isModuleArchived;

  const loadClasses = async () => {
    const data = await listModuleClasses(moduleId, { limit: 100 });
    setModule(data.module);
    setClasses(data.classes ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchClasses() {
      setIsLoading(true);
      setError('');

      try {
        const data = await listModuleClasses(moduleId, { limit: 100 });
        if (!isMounted) return;
        setModule(data.module);
        setClasses(data.classes ?? []);
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchClasses();

    return () => {
      isMounted = false;
    };
  }, [moduleId]);

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
    if (isReadOnly) return;

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
        await updateResource('classes', editingId, payload);
        setMessage('Clase actualizada correctamente.');
      } else {
        await createModuleClass(moduleId, payload);
        setMessage('Clase creada correctamente.');
      }

      resetForm();
      await loadClasses();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (academicClass) => {
    setEditingId(getId(academicClass));
    setFormData({
      name: academicClass.name,
      description: academicClass.description ?? '',
      order: academicClass.order ?? 0,
      status: academicClass.status,
    });
  };

  const archiveClass = async (academicClass, options = {}) => {
    setError('');
    setMessage('');

    try {
      const data = await deleteResource('classes', getId(academicClass), options);
      const linkedTasks = data.linkedTasks ?? 0;
      setMessage(
        linkedTasks
          ? `Clase archivada. Sus ${linkedTasks} tarea(s) asociada(s) siguen disponibles en modo solo lectura.`
          : 'Clase archivada correctamente.'
      );
      if (editingId === getId(academicClass)) resetForm();
      await loadClasses();
    } catch (requestError) {
      if (requestError?.response?.status === 409 && !options.cascade) {
        setConfirmAction({
          title: `Archivar ${academicClass.name} de todas formas`,
          description: `${getErrorMessage(requestError)} Las tareas asociadas no se eliminarán ni se verán afectadas sus evaluaciones publicadas.`,
          confirmLabel: 'Archivar de todas formas',
          onConfirm: () => archiveClass(academicClass, { cascade: true }),
        });
        throw requestError;
      }
      setError(getErrorMessage(requestError));
    }
  };

  const handleArchive = (academicClass) => {
    setConfirmAction({
      title: `Archivar ${academicClass.name}`,
      description: 'La clase quedará oculta para nuevos contenidos, pero no se afectarán evaluaciones publicadas.',
      confirmLabel: 'Archivar clase',
      onConfirm: () => archiveClass(academicClass),
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
      <HierarchyBreadcrumb
        items={[
          course ? { label: course.name, to: `/evaluator/courses/${getId(course) || courseId}` } : { label: 'Curso' },
          module ? { label: module.name } : { label: 'Módulo' },
        ]}
      />

      <div className="module-hero">
        <span className="module-hero-icon">
          <BookOpenCheck size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Módulo</p>
          <h1>{module?.name ?? 'Detalle de módulo'}</h1>
          <p className="dashboard-description">
            {module?.description || 'Gestiona las clases que agrupan las tareas de este módulo.'}
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}
      {isReadOnly ? (
        <p className="form-message form-message-warning">
          Este nivel está archivado. Puedes revisar sus clases, pero no crear nuevos contenidos.
        </p>
      ) : null}

      <div className="metric-grid" aria-label="Resumen de clases">
        <article className="metric-card">
          <span className="metric-icon">
            <ClipboardList size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(classes.length)}</strong>
            <span>Clases</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <BookOpenCheck size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(activeCount)}</strong>
            <span>Activas</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Archive size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(archivedCount)}</strong>
            <span>Archivadas</span>
          </div>
        </article>
      </div>

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>{editingId ? 'Editar clase' : 'Crear clase'}</h2>
            <p>Define sesiones o unidades operativas dentro del módulo.</p>
          </div>

          <form className="stacked-form compact-form" onSubmit={handleSubmit}>
            <label>
              Nombre
              <input
                type="text"
                name="name"
                value={formData.name}
                placeholder="Nombre de la clase"
                onChange={handleChange}
                disabled={isReadOnly}
                required
              />
            </label>
            <label>
              Descripción
              <textarea
                name="description"
                value={formData.description}
                rows="4"
                placeholder="Propósito o contenido de la clase"
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </label>
            <label>
              Orden
              <input
                type="number"
                name="order"
                min="0"
                value={formData.order}
                onChange={handleChange}
                disabled={isReadOnly}
              />
            </label>
            {editingId ? (
              <label>
                Estado
                <select name="status" value={formData.status} onChange={handleChange} disabled={isReadOnly}>
                  <option value="active">Activo</option>
                  <option value="archived">Archivado</option>
                </select>
              </label>
            ) : null}

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting || isReadOnly}>
                {isSubmitting ? (
                  <span className="button-spinner-ring" aria-hidden="true" />
                ) : editingId ? (
                  <Save size={18} aria-hidden="true" />
                ) : (
                  <Plus size={18} aria-hidden="true" />
                )}
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear clase'}
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
              <h2>Clases</h2>
              <p>Organiza las clases que luego contendrán tareas.</p>
            </div>
            <span className="count-pill">{filteredClasses.length}</span>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                placeholder="Buscar clase"
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="all">Todas</option>
              <option value="active">Activas</option>
              <option value="archived">Archivadas</option>
            </select>
          </div>

          <div className="resource-list">
            {isLoading ? (
              <div className="skeleton-list" aria-label="Cargando clases">
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
            ) : filteredClasses.map((academicClass) => (
              <article className="resource-item" key={getId(academicClass)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{academicClass.name}</h3>
                    <span className={`status-badge status-${academicClass.status}`}>
                      {statusLabels[academicClass.status]}
                    </span>
                  </div>
                  <p>{academicClass.description || 'Sin descripción registrada.'}</p>
                  <div className="chip-row">
                    <span className="metadata-chip">Orden {academicClass.order ?? 0}</span>
                  </div>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${academicClass.name}`}>
                  <Link
                    className="icon-button labeled"
                    to={`/evaluator/courses/${courseId}/modules/${moduleId}/classes/${getId(academicClass)}`}
                    title="Ver tareas"
                    aria-label={`Ver tareas de ${academicClass.name}`}
                  >
                    <FolderOpen size={17} aria-hidden="true" />
                    <span>Tareas</span>
                  </Link>
                  <button
                    className="icon-button labeled"
                    type="button"
                    onClick={() => handleEdit(academicClass)}
                    title="Editar"
                    aria-label={`Editar ${academicClass.name}`}
                    disabled={isReadOnly}
                  >
                    <Pencil size={17} aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                  <button
                    className="icon-button labeled"
                    type="button"
                    onClick={() => handleArchive(academicClass)}
                    title="Archivar"
                    aria-label={`Archivar ${academicClass.name}`}
                    disabled={isReadOnly || academicClass.status === 'archived'}
                  >
                    <Archive size={17} aria-hidden="true" />
                    <span>Archivar</span>
                  </button>
                </div>
              </article>
            ))}

            {!isLoading && filteredClasses.length === 0 ? (
              <EmptyState
                title="No hay clases"
                description={
                  isReadOnly
                    ? 'Este módulo no tiene clases activas para mostrar.'
                    : 'Crea la primera clase para continuar con tareas.'
                }
                action={
                  isReadOnly
                    ? null
                    : {
                        label: 'Crear clase',
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

export default ModuleDetailPage;
