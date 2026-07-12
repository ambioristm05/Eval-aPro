import { ArrowLeft, BookOpenCheck, ChevronRight, ClipboardList, FolderOpen, Home, Search, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../../components/common/EmptyState.jsx';
import PermanentDeleteDialog from '../../components/common/PermanentDeleteDialog.jsx';
import {
  deleteResource,
  deleteResourcePermanent,
  listClassTasks,
  listCourseModules,
  listModuleClasses,
  listResource,
} from '../../services/resourceService.js';
import { useTimedState } from '../../hooks/useTimedState.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const LEVELS = {
  COURSES: 'courses',
  MODULES: 'modules',
  CLASSES: 'classes',
  TASKS: 'tasks',
};

const academicStatusLabels = {
  active: 'Activo',
  archived: 'Archivado',
};

const taskStatusLabels = {
  pending: 'Por evaluar',
  completed: 'Evaluada',
};

function AdminCoursesPage() {
  const [level, setLevel] = useState(LEVELS.COURSES);
  const [course, setCourse] = useState(null);
  const [module, setModule] = useState(null);
  const [academicClass, setAcademicClass] = useState(null);
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useTimedState();
  const [message, setMessage] = useTimedState();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cascadeWarning, setCascadeWarning] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadLevel = async (nextLevel, context = {}) => {
    setIsLoading(true);
    setError('');

    try {
      if (nextLevel === LEVELS.COURSES) {
        const data = await listResource('courses', { limit: 100 });
        setItems(data.courses ?? []);
      } else if (nextLevel === LEVELS.MODULES) {
        const data = await listCourseModules(context.courseId, { limit: 100 });
        setItems(data.modules ?? []);
      } else if (nextLevel === LEVELS.CLASSES) {
        const data = await listModuleClasses(context.moduleId, { limit: 100 });
        setItems(data.classes ?? []);
      } else {
        const data = await listClassTasks(context.classId, { limit: 100 });
        setItems(data.tasks ?? []);
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLevel(LEVELS.COURSES);
  }, []);

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return items;

    return items.filter((item) => {
      const label = item.name ?? item.title ?? '';
      return label.toLowerCase().includes(normalizedSearch);
    });
  }, [items, searchTerm]);

  const enterCourse = (selectedCourse) => {
    setCourse(selectedCourse);
    setModule(null);
    setAcademicClass(null);
    setSearchTerm('');
    setLevel(LEVELS.MODULES);
    loadLevel(LEVELS.MODULES, { courseId: getId(selectedCourse) });
  };

  const enterModule = (selectedModule) => {
    setModule(selectedModule);
    setAcademicClass(null);
    setSearchTerm('');
    setLevel(LEVELS.CLASSES);
    loadLevel(LEVELS.CLASSES, { moduleId: getId(selectedModule) });
  };

  const enterClass = (selectedClass) => {
    setAcademicClass(selectedClass);
    setSearchTerm('');
    setLevel(LEVELS.TASKS);
    loadLevel(LEVELS.TASKS, { classId: getId(selectedClass) });
  };

  const goToLevel = (targetLevel) => {
    setSearchTerm('');

    if (targetLevel === LEVELS.COURSES) {
      setCourse(null);
      setModule(null);
      setAcademicClass(null);
      setLevel(LEVELS.COURSES);
      loadLevel(LEVELS.COURSES);
    } else if (targetLevel === LEVELS.MODULES) {
      setModule(null);
      setAcademicClass(null);
      setLevel(LEVELS.MODULES);
      loadLevel(LEVELS.MODULES, { courseId: getId(course) });
    } else if (targetLevel === LEVELS.CLASSES) {
      setAcademicClass(null);
      setLevel(LEVELS.CLASSES);
      loadLevel(LEVELS.CLASSES, { moduleId: getId(module) });
    }
  };

  const reloadCurrentLevel = () => {
    if (level === LEVELS.COURSES) return loadLevel(LEVELS.COURSES);
    if (level === LEVELS.MODULES) return loadLevel(LEVELS.MODULES, { courseId: getId(course) });
    if (level === LEVELS.CLASSES) return loadLevel(LEVELS.CLASSES, { moduleId: getId(module) });
    return loadLevel(LEVELS.TASKS, { classId: getId(academicClass) });
  };

  const runDelete = async (item, cascade = false) => {
    setIsDeleting(true);
    setError('');
    setMessage('');

    try {
      let data;
      if (level === LEVELS.COURSES) data = await deleteResourcePermanent('courses', getId(item), { cascade });
      else if (level === LEVELS.MODULES) data = await deleteResourcePermanent('modules', getId(item), { cascade });
      else if (level === LEVELS.CLASSES) data = await deleteResourcePermanent('classes', getId(item), { cascade });
      else data = await deleteResource('tasks', getId(item));

      const cascadeCounts = data?.cascade ?? {};
      const cascadeSummary = Object.entries(cascadeCounts)
        .filter(([, count]) => count > 0)
        .map(([key, count]) => `${count} ${key}`)
        .join(', ');

      setMessage(cascadeSummary ? `Eliminado de forma definitiva junto con ${cascadeSummary}.` : 'Eliminado de forma definitiva.');
      setDeleteTarget(null);
      setCascadeWarning(null);
      await reloadCurrentLevel();
    } catch (requestError) {
      if (requestError?.response?.status === 409 && !cascade) {
        setCascadeWarning(item);
        setDeleteTarget(null);
        return;
      }
      setError(getErrorMessage(requestError));
      setCascadeWarning(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const heading = {
    [LEVELS.COURSES]: 'Cursos',
    [LEVELS.MODULES]: `Módulos de ${course?.name ?? ''}`,
    [LEVELS.CLASSES]: `Clases de ${module?.name ?? ''}`,
    [LEVELS.TASKS]: `Tareas de ${academicClass?.name ?? ''}`,
  }[level];

  const drillLabel = {
    [LEVELS.COURSES]: 'Ver módulos',
    [LEVELS.MODULES]: 'Ver clases',
    [LEVELS.CLASSES]: 'Ver tareas',
    [LEVELS.TASKS]: null,
  }[level];

  const handleDrill = (item) => {
    if (level === LEVELS.COURSES) enterCourse(item);
    else if (level === LEVELS.MODULES) enterModule(item);
    else if (level === LEVELS.CLASSES) enterClass(item);
  };

  return (
    <section className="management-page">
      <nav className="hierarchy-breadcrumb" aria-label="Jerarquía académica">
        <button type="button" className="hierarchy-breadcrumb-home" onClick={() => goToLevel(LEVELS.COURSES)}>
          <Home size={16} aria-hidden="true" />
          <span>Cursos</span>
        </button>
        {course ? (
          <span className="hierarchy-breadcrumb-item">
            <ChevronRight size={15} aria-hidden="true" />
            {level === LEVELS.MODULES ? (
              <span aria-current="page">{course.name}</span>
            ) : (
              <button className="hierarchy-breadcrumb-link" type="button" onClick={() => goToLevel(LEVELS.MODULES)}>
                {course.name}
              </button>
            )}
          </span>
        ) : null}
        {module ? (
          <span className="hierarchy-breadcrumb-item">
            <ChevronRight size={15} aria-hidden="true" />
            {level === LEVELS.CLASSES ? (
              <span aria-current="page">{module.name}</span>
            ) : (
              <button className="hierarchy-breadcrumb-link" type="button" onClick={() => goToLevel(LEVELS.CLASSES)}>
                {module.name}
              </button>
            )}
          </span>
        ) : null}
        {academicClass ? (
          <span className="hierarchy-breadcrumb-item">
            <ChevronRight size={15} aria-hidden="true" />
            <span aria-current="page">{academicClass.name}</span>
          </span>
        ) : null}
      </nav>

      <div className="module-hero">
        <span className="module-hero-icon">
          <BookOpenCheck size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Administración</p>
          <h1>{heading}</h1>
          <p className="dashboard-description">
            Navega la jerarquía académica de todos los evaluadores y elimina de forma definitiva cursos, módulos,
            clases o tareas cuando sea necesario.
          </p>
        </div>
      </div>

      {level !== LEVELS.COURSES ? (
        <button
          className="button button-ghost"
          type="button"
          onClick={() =>
            goToLevel(
              level === LEVELS.TASKS ? LEVELS.CLASSES : level === LEVELS.CLASSES ? LEVELS.MODULES : LEVELS.COURSES
            )
          }
        >
          <ArrowLeft size={18} aria-hidden="true" />
          Volver
        </button>
      ) : null}

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      <section className="dashboard-panel">
        <div className="panel-heading panel-heading-row">
          <div>
            <h2>{heading}</h2>
            <p>Busca por nombre y entra a un nivel para revisar su contenido.</p>
          </div>
          <span className="count-pill">{filteredItems.length}</span>
        </div>

        <div className="toolbar">
          <label className="search-field">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              placeholder="Buscar"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>

        <div className="resource-list resource-list-inline">
          {isLoading ? (
            <div className="skeleton-list" aria-label="Cargando">
              {[0, 1, 2].map((item) => (
                <div className="skeleton-card" key={item}>
                  <span className="skeleton-line skeleton-line-title" />
                  <span className="skeleton-line" />
                </div>
              ))}
            </div>
          ) : (
            filteredItems.map((item) => (
              <article className="resource-item" key={getId(item)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{item.name ?? item.title}</h3>
                    <span
                      className={`status-badge status-${
                        level === LEVELS.TASKS ? item.status : item.status ?? 'active'
                      }`}
                    >
                      {level === LEVELS.TASKS
                        ? taskStatusLabels[item.status] ?? item.status
                        : academicStatusLabels[item.status] ?? item.status}
                    </span>
                  </div>
                  {level === LEVELS.COURSES ? (
                    <p>{item.evaluator?.name ? `Evaluador: ${item.evaluator.name} (${item.evaluator.email})` : 'Sin evaluador'}</p>
                  ) : (
                    <p>{item.description || 'Sin descripción registrada.'}</p>
                  )}
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${item.name ?? item.title}`}>
                  {drillLabel ? (
                    <button
                      className="icon-button labeled"
                      type="button"
                      onClick={() => handleDrill(item)}
                      title={drillLabel}
                      aria-label={`${drillLabel} de ${item.name}`}
                    >
                      {level === LEVELS.CLASSES ? (
                        <ClipboardList size={17} aria-hidden="true" />
                      ) : (
                        <FolderOpen size={17} aria-hidden="true" />
                      )}
                      <span>{drillLabel}</span>
                    </button>
                  ) : null}
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => setDeleteTarget(item)}
                    title="Eliminar definitivamente"
                    aria-label={`Eliminar definitivamente ${item.name ?? item.title}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))
          )}

          {!isLoading && filteredItems.length === 0 ? (
            <EmptyState title="No hay resultados" description="Ajusta la búsqueda o vuelve a un nivel anterior." />
          ) : null}
        </div>
      </section>

      <PermanentDeleteDialog
        open={Boolean(deleteTarget)}
        title={`Eliminar definitivamente ${deleteTarget?.name ?? deleteTarget?.title ?? ''}`}
        description="Esta acción borra el registro de la base de datos y no se puede deshacer. Si tiene contenido dependiente, te pediremos confirmar la eliminación en cascada."
        requirePassword={false}
        isBusy={isDeleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => runDelete(deleteTarget, false)}
      />

      <PermanentDeleteDialog
        open={Boolean(cascadeWarning)}
        title={`${cascadeWarning?.name ?? cascadeWarning?.title ?? ''} tiene contenido asociado`}
        description="Al continuar se eliminará también, de forma permanente, todo el contenido dependiente (módulos, clases o tareas)."
        requirePassword={false}
        isBusy={isDeleting}
        onCancel={() => setCascadeWarning(null)}
        onConfirm={() => runDelete(cascadeWarning, true)}
      />
    </section>
  );
}

export default AdminCoursesPage;
