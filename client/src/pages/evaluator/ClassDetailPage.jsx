import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FolderOpen,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  Weight,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import HierarchyBreadcrumb from '../../components/common/HierarchyBreadcrumb.jsx';
import {
  createClassTask,
  deleteResource,
  getResource,
  listClassTasks,
  listResource,
  updateResource,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const emptyForm = {
  title: '',
  description: '',
  groups: [],
  students: [],
  instrument: '',
  status: 'pending',
  dueDate: '',
  weight: 10,
};

const statusLabels = {
  pending: 'Por evaluar',
  completed: 'Evaluada',
};

function toInputDate(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function getGroupNames(task) {
  const names = (task.groups ?? []).map((group) => group.name).filter(Boolean);
  return names.length ? names.join(', ') : 'Sin grupo';
}

function getInstrumentName(task) {
  return task.instrument?.title ?? 'Sin instrumento';
}

function getStudentName(student) {
  return student.name ?? student.email ?? 'Estudiante sin nombre';
}

function getStudentGroupIds(student) {
  return (student.groups ?? []).map(getId).filter(Boolean);
}

function studentBelongsToGroup(student, groupId) {
  return getStudentGroupIds(student).includes(groupId);
}

function studentBelongsToAnyGroup(student, groupIds) {
  if (!groupIds.length) return true;
  return groupIds.some((groupId) => studentBelongsToGroup(student, groupId));
}

function normalizeTaskStatus(status) {
  return status === 'completed' ? 'completed' : 'pending';
}

function buildTaskPayload(formData) {
  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    groups: formData.groups,
    students: formData.students,
    instrument: formData.instrument || undefined,
    status: formData.status,
    dueDate: formData.dueDate || undefined,
    weight: Number(formData.weight) || 0,
  };
}

function ClassDetailPage() {
  const { courseId, moduleId, classId } = useParams();
  const [academicClass, setAcademicClass] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRetryingTasks, setIsRetryingTasks] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState('');

  const course = academicClass?.course;
  const module = academicClass?.module;
  const isReadOnly =
    course?.status !== 'active' || module?.status !== 'active' || academicClass?.status !== 'active';

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || normalizeTaskStatus(task.status) === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        (task.description ?? '').toLowerCase().includes(normalizedSearch) ||
        getGroupNames(task).toLowerCase().includes(normalizedSearch) ||
        getInstrumentName(task).toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, searchTerm, statusFilter]);

  const pendingTasks = tasks.filter((task) => normalizeTaskStatus(task.status) === 'pending').length;
  const evaluatedTasks = tasks.filter((task) => normalizeTaskStatus(task.status) === 'completed').length;
  const totalWeight = tasks.reduce((total, task) => total + Number(task.weight || 0), 0);

  const assignableStudents = useMemo(
    () => students.filter((student) => studentBelongsToAnyGroup(student, formData.groups)),
    [students, formData.groups]
  );

  const filteredAssignableStudents = useMemo(() => {
    const normalizedSearch = studentSearchTerm.trim().toLowerCase();
    if (!normalizedSearch) return assignableStudents;

    return assignableStudents.filter(
      (student) =>
        getStudentName(student).toLowerCase().includes(normalizedSearch) ||
        student.email.toLowerCase().includes(normalizedSearch)
    );
  }, [assignableStudents, studentSearchTerm]);

  const selectedStudents = useMemo(
    () => students.filter((student) => formData.students.includes(getId(student))),
    [formData.students, students]
  );

  const loadTasks = async () => {
    try {
      const data = await listClassTasks(classId, { limit: 100 });
      setTasks(data.tasks ?? []);
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const retryLoadTasks = async () => {
    setIsRetryingTasks(true);
    try {
      await loadTasks();
    } finally {
      setIsRetryingTasks(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      setIsLoading(true);
      setError('');

      try {
        const [classResult, tasksResult, groupsResult, studentsResult, instrumentsResult] = await Promise.allSettled([
          getResource('classes', classId),
          listClassTasks(classId, { limit: 100 }),
          listResource('groups', { status: 'active', limit: 100 }),
          listResource('students', { status: 'active', limit: 100 }),
          listResource('instruments', { limit: 100 }),
        ]);

        if (!isMounted) return;

        if (classResult.status === 'fulfilled') setAcademicClass(classResult.value.class);
        if (tasksResult.status === 'fulfilled') setTasks(tasksResult.value.tasks ?? []);
        if (groupsResult.status === 'fulfilled') setGroups(groupsResult.value.groups ?? []);
        if (studentsResult.status === 'fulfilled') setStudents(studentsResult.value.students ?? []);
        if (instrumentsResult.status === 'fulfilled') setInstruments(instrumentsResult.value.instruments ?? []);

        const failedResult = [classResult, tasksResult, groupsResult, studentsResult, instrumentsResult].find(
          (result) => result.status === 'rejected'
        );

        if (failedResult) {
          setError(getErrorMessage(failedResult.reason));
        }
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
  }, [classId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleGroupToggle = (groupId) => {
    setFormData((current) => {
      const isSelected = current.groups.includes(groupId);
      const nextGroups = isSelected
        ? current.groups.filter((currentId) => currentId !== groupId)
        : [...current.groups, groupId];

      return {
        ...current,
        groups: nextGroups,
        students: current.students.filter((studentId) => {
          const student = students.find((item) => getId(item) === studentId);
          return student ? studentBelongsToAnyGroup(student, nextGroups) : false;
        }),
      };
    });
  };

  const handleStudentToggle = (studentId) => {
    setFormData((current) => {
      const isSelected = current.students.includes(studentId);
      return {
        ...current,
        students: isSelected
          ? current.students.filter((currentId) => currentId !== studentId)
          : [...current.students, studentId],
      };
    });
  };

  const handleSelectAllInGroup = (groupId) => {
    const groupStudentIds = students
      .filter((student) => studentBelongsToGroup(student, groupId))
      .map(getId);
    const allSelected = groupStudentIds.every((studentId) => formData.students.includes(studentId));

    setFormData((current) => {
      const nextStudents = new Set(current.students);
      groupStudentIds.forEach((studentId) => {
        if (allSelected) {
          nextStudents.delete(studentId);
        } else {
          nextStudents.add(studentId);
        }
      });
      return { ...current, students: [...nextStudents] };
    });
  };

  const resetForm = () => {
    setFormData({ ...emptyForm, students: [] });
    setEditingId(null);
    setStudentSearchTerm('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isReadOnly) return;

    setError('');
    setMessage('');

    const normalizedTitle = formData.title.trim();
    if (!normalizedTitle) return;

    setIsSubmitting(true);

    try {
      const payload = buildTaskPayload(formData);

      if (editingId) {
        await updateResource('tasks', editingId, payload);
        setMessage('Tarea actualizada correctamente.');
      } else {
        await createClassTask(classId, payload);
        setMessage('Tarea creada correctamente.');
      }

      resetForm();
      await loadTasks();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (task) => {
    setEditingId(getId(task));
    setFormData({
      title: task.title,
      description: task.description ?? '',
      groups: (task.groups ?? []).map(getId).filter(Boolean),
      students: (task.students ?? []).map(getId).filter(Boolean),
      instrument: task.instrument ? getId(task.instrument) : '',
      status: normalizeTaskStatus(task.status),
      dueDate: toInputDate(task.dueDate),
      weight: task.weight ?? 0,
    });
  };

  const updateTaskStatus = async (taskId, status) => {
    setError('');
    setMessage('');
    setUpdatingStatusId(taskId);

    try {
      await updateResource('tasks', taskId, { status });
      setMessage('Estado de tarea actualizado.');
      await loadTasks();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setUpdatingStatusId('');
    }
  };

  const deleteTask = async (task) => {
    const taskId = getId(task);

    setError('');
    setMessage('');

    try {
      await deleteResource('tasks', taskId);
      setMessage('Tarea eliminada correctamente.');
      if (editingId === taskId) resetForm();
      await loadTasks();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleDeleteTask = (task) => {
    setConfirmAction({
      title: `Eliminar ${task.title}`,
      description: 'Esta acción no se puede deshacer desde esta pantalla.',
      confirmLabel: 'Eliminar tarea',
      onConfirm: () => deleteTask(task),
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;

    setIsConfirming(true);
    try {
      await confirmAction.onConfirm();
      setConfirmAction(null);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <section className="management-page">
      <HierarchyBreadcrumb
        items={[
          course ? { label: course.name, to: `/evaluator/courses/${getId(course) || courseId}` } : { label: 'Curso' },
          module
            ? {
                label: module.name,
                to: `/evaluator/courses/${courseId}/modules/${getId(module) || moduleId}`,
              }
            : { label: 'Módulo' },
          academicClass ? { label: academicClass.name } : { label: 'Clase' },
        ]}
      />

      <div className="module-hero">
        <span className="module-hero-icon">
          <ClipboardList size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Clase</p>
          <h1>{academicClass?.name ?? 'Detalle de clase'}</h1>
          <p className="dashboard-description">
            {academicClass?.description || 'Crea y gestiona las tareas evaluables de esta clase.'}
          </p>
        </div>
      </div>

      {error ? (
        <div className="form-message form-message-error">
          <span>{error}</span>
          <button
            className="button button-secondary"
            type="button"
            onClick={retryLoadTasks}
            disabled={isRetryingTasks}
          >
            {isRetryingTasks ? <span className="button-spinner-ring" aria-hidden="true" /> : null}
            {isRetryingTasks ? 'Reintentando...' : 'Reintentar tareas'}
          </button>
        </div>
      ) : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}
      {isReadOnly ? (
        <p className="form-message form-message-warning">
          Este nivel no está activo. Puedes revisar sus tareas, pero no crear nuevos contenidos.
        </p>
      ) : null}

      <div className="metric-grid" aria-label="Resumen de tareas de la clase">
        <article className="metric-card">
          <span className="metric-icon">
            <CalendarClock size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(pendingTasks)}</strong>
            <span>Por evaluar</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <CheckCircle2 size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(evaluatedTasks)}</strong>
            <span>Evaluadas</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Weight size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(totalWeight)}</strong>
            <span>Notas</span>
          </div>
        </article>
      </div>

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>{editingId ? 'Editar tarea' : 'Crear tarea'}</h2>
            <p>Define la actividad evaluable dentro de esta clase.</p>
          </div>

          <form className="stacked-form compact-form task-form" onSubmit={handleSubmit}>
            <details className="form-section" open>
              <summary>Datos básicos</summary>
              <div className="form-section-body">
                <label>
                  Título
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    placeholder="Ej. Práctica de digitación"
                    onChange={handleChange}
                    disabled={isReadOnly}
                    required
                  />
                </label>
                <label>
                  Objetivo
                  <textarea
                    name="description"
                    value={formData.description}
                    placeholder="Instrucciones o alcance de la tarea"
                    rows="4"
                    onChange={handleChange}
                    disabled={isReadOnly}
                  />
                </label>
              </div>
            </details>

            <details className="form-section">
              <summary>Asignación</summary>
              <div className="form-section-body">
                <label>
                  Instrumento
                  <select
                    name="instrument"
                    value={formData.instrument}
                    onChange={handleChange}
                    disabled={isReadOnly}
                  >
                    <option value="">Sin instrumento</option>
                    {instruments.map((instrument) => (
                      <option key={getId(instrument)} value={getId(instrument)}>
                        {instrument.title}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="assignment-selector">
                  <div className="assignment-header">
                    <span>Grupos</span>
                    <strong>{formData.groups.length}</strong>
                  </div>

                  <div className="assignment-list" aria-label="Seleccionar grupos para esta tarea">
                    {groups.map((group) => {
                      const groupId = getId(group);
                      const isSelected = formData.groups.includes(groupId);
                      const groupStudentIds = students
                        .filter((student) => studentBelongsToGroup(student, groupId))
                        .map(getId);
                      const allGroupStudentsSelected =
                        groupStudentIds.length > 0 &&
                        groupStudentIds.every((studentId) => formData.students.includes(studentId));

                      return (
                        <div className="group-option-row" key={groupId}>
                          <label className={`assignment-option${isSelected ? ' assignment-option-selected' : ''}`}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleGroupToggle(groupId)}
                              disabled={isReadOnly}
                            />
                            <span className="assignment-check" aria-hidden="true">
                              <CheckCircle2 size={15} />
                            </span>
                            <span className="assignment-student">
                              <strong>{group.name}</strong>
                            </span>
                          </label>
                          {isSelected ? (
                            <button
                              className="button button-ghost button-compact"
                              type="button"
                              onClick={() => handleSelectAllInGroup(groupId)}
                              disabled={isReadOnly || groupStudentIds.length === 0}
                            >
                              {allGroupStudentsSelected ? 'Deseleccionar todos' : 'Seleccionar todos'}
                            </button>
                          ) : null}
                        </div>
                      );
                    })}

                    {groups.length === 0 ? <p className="assignment-empty">No hay grupos disponibles.</p> : null}
                  </div>
                </div>

                <div className="assignment-selector">
                  <div className="assignment-header">
                    <span>Estudiantes asignados</span>
                    <strong>{formData.students.length}</strong>
                  </div>

                  {selectedStudents.length ? (
                    <div className="selected-student-chips" aria-label="Estudiantes seleccionados">
                      {selectedStudents.map((student) => (
                        <button
                          className="student-chip"
                          type="button"
                          key={getId(student)}
                          onClick={() => handleStudentToggle(getId(student))}
                          disabled={isReadOnly}
                        >
                          {getStudentName(student)}
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <label className="search-field assignment-search">
                    <Search size={18} aria-hidden="true" />
                    <input
                      type="search"
                      value={studentSearchTerm}
                      placeholder="Buscar estudiante"
                      onChange={(event) => setStudentSearchTerm(event.target.value)}
                      disabled={isReadOnly}
                    />
                  </label>

                  <div className="assignment-list" aria-label="Seleccionar estudiantes para esta tarea">
                    {filteredAssignableStudents.map((student) => {
                      const studentId = getId(student);
                      const isSelected = formData.students.includes(studentId);

                      return (
                        <label className={`assignment-option${isSelected ? ' assignment-option-selected' : ''}`} key={studentId}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleStudentToggle(studentId)}
                            disabled={isReadOnly}
                          />
                          <span className="assignment-check" aria-hidden="true">
                            <CheckCircle2 size={15} />
                          </span>
                          <span className="assignment-student">
                            <strong>{getStudentName(student)}</strong>
                            <small>{student.email}</small>
                          </span>
                        </label>
                      );
                    })}

                    {assignableStudents.length === 0 ? (
                      <p className="assignment-empty">
                        {formData.groups.length
                          ? 'No hay estudiantes activos en los grupos seleccionados.'
                          : 'Crea estudiantes o vincúlalos a un grupo para asignarlos.'}
                      </p>
                    ) : null}

                    {assignableStudents.length > 0 && filteredAssignableStudents.length === 0 ? (
                      <p className="assignment-empty">No hay estudiantes que coincidan con la búsqueda.</p>
                    ) : null}
                  </div>
                </div>
              </div>
            </details>

            <details className="form-section">
              <summary>Fecha y nota</summary>
              <div className="form-section-body">
                <div className="form-two-columns">
                  <label>
                    Fecha
                    <span className="date-field">
                      <CalendarDays size={17} aria-hidden="true" />
                      <input
                        type="date"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        disabled={isReadOnly}
                      />
                    </span>
                  </label>
                  <label>
                    Estado
                    <select name="status" value={formData.status} onChange={handleChange} disabled={isReadOnly}>
                      <option value="pending">Por evaluar</option>
                      <option value="completed">Evaluada</option>
                    </select>
                  </label>
                </div>
                <label>
                  Nota
                  <input
                    type="number"
                    name="weight"
                    min="0"
                    max="100"
                    value={formData.weight}
                    onChange={handleChange}
                    disabled={isReadOnly}
                  />
                </label>
              </div>
            </details>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting || isReadOnly}>
                {isSubmitting ? (
                  <span className="button-spinner-ring" aria-hidden="true" />
                ) : editingId ? (
                  <Save size={18} aria-hidden="true" />
                ) : (
                  <Plus size={18} aria-hidden="true" />
                )}
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear tarea'}
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
              <h2>Tareas</h2>
              <p>Busca por tarea, grupo o instrumento y filtra por estado.</p>
            </div>
            <span className="count-pill">{filteredTasks.length}</span>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                placeholder="Buscar tarea"
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
              <option value="pending">Por evaluar</option>
              <option value="completed">Evaluadas</option>
            </select>
          </div>

          <div className="resource-list">
            {isLoading ? (
              <div className="skeleton-list" aria-label="Cargando tareas">
                {[0, 1, 2].map((item) => (
                  <div className="skeleton-card" key={item}>
                    <span className="skeleton-line skeleton-line-title" />
                    <span className="skeleton-line" />
                    <div className="skeleton-chip-row">
                      <span className="skeleton-chip" />
                      <span className="skeleton-chip" />
                      <span className="skeleton-chip" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTasks.map((task) => (
              <article className="resource-item" key={getId(task)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{task.title}</h3>
                    <span className={`status-badge status-${normalizeTaskStatus(task.status)}`}>
                      {statusLabels[normalizeTaskStatus(task.status)]}
                    </span>
                  </div>
                  <p>{task.description || 'Sin descripción registrada.'}</p>
                  <div className="resource-meta">
                    <span>{getGroupNames(task)}</span>
                    <span>{getInstrumentName(task)}</span>
                    <span>
                      <Users size={14} aria-hidden="true" />
                      {task.students?.length ?? 0}
                    </span>
                    <span>Nota: {task.weight}</span>
                    <span>{toInputDate(task.dueDate) || 'Sin fecha'}</span>
                  </div>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${task.title}`}>
                  <Link
                    className="icon-button labeled"
                    to={`/evaluator/courses/${courseId}/modules/${moduleId}/classes/${classId}/tasks/${getId(task)}`}
                    title="Ver detalle"
                    aria-label={`Ver detalle de ${task.title}`}
                  >
                    <FolderOpen size={17} aria-hidden="true" />
                    <span>Detalle</span>
                  </Link>
                  <button
                    className="icon-button labeled"
                    type="button"
                    onClick={() => handleEdit(task)}
                    title="Editar"
                    aria-label={`Editar ${task.title}`}
                    disabled={isReadOnly}
                  >
                    <Pencil size={17} aria-hidden="true" />
                    <span>Editar</span>
                  </button>
                  <button
                    className="icon-button labeled"
                    type="button"
                    onClick={() => updateTaskStatus(getId(task), 'completed')}
                    title="Marcar evaluada"
                    aria-label={`Marcar evaluada ${task.title}`}
                    disabled={isReadOnly || task.status === 'completed' || updatingStatusId === getId(task)}
                  >
                    {updatingStatusId === getId(task) ? (
                      <span className="button-spinner-ring" aria-hidden="true" />
                    ) : (
                      <CheckCircle2 size={17} aria-hidden="true" />
                    )}
                    <span>Evaluada</span>
                  </button>
                  <button
                    className="icon-button danger labeled"
                    type="button"
                    onClick={() => handleDeleteTask(task)}
                    title="Eliminar"
                    aria-label={`Eliminar ${task.title}`}
                    disabled={isReadOnly}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                    <span>Eliminar</span>
                  </button>
                </div>
              </article>
            ))}

            {!isLoading && filteredTasks.length === 0 ? (
              <EmptyState
                title="No hay tareas"
                description={
                  isReadOnly
                    ? 'Esta clase no tiene tareas activas para mostrar.'
                    : 'Crea la primera tarea de esta clase.'
                }
                action={
                  isReadOnly
                    ? null
                    : {
                        label: 'Crear tarea',
                        onClick: () => {
                          resetForm();
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        },
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

export default ClassDetailPage;
