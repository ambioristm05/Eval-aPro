import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Save,
  Search,
  Trash2,
  Users,
  Weight,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import HierarchyBreadcrumb from '../../components/common/HierarchyBreadcrumb.jsx';
import { useTimedState } from '../../hooks/useTimedState.js';
import {
  deleteResource,
  getResource,
  listResource,
  updateResource,
} from '../../services/resourceService.js';
import { useCourseNavStore } from '../../stores/courseNavStore.js';
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

function getStudentName(student) {
  return student.name ?? student.email ?? 'Estudiante sin nombre';
}

function getGroupNames(task) {
  const names = (task?.groups ?? []).map((group) => group.name).filter(Boolean);
  return names.length ? names.join(', ') : 'Sin grupo';
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

function buildFormData(task) {
  if (!task) return emptyForm;

  return {
    title: task.title,
    description: task.description ?? '',
    groups: (task.groups ?? []).map(getId).filter(Boolean),
    students: (task.students ?? []).map(getId).filter(Boolean),
    instrument: task.instrument ? getId(task.instrument) : '',
    status: normalizeTaskStatus(task.status),
    dueDate: toInputDate(task.dueDate),
    weight: task.weight ?? 0,
  };
}

function EvaluatorTaskDetailPage() {
  const { courseId, moduleId, classId, taskId } = useParams();
  const navigate = useNavigate();
  const setLastClass = useCourseNavStore((state) => state.setClass);
  const [academicClass, setAcademicClass] = useState(null);
  const [task, setTask] = useState(null);
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [error, setError] = useTimedState();
  const [message, setMessage] = useTimedState();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (courseId && moduleId && classId) setLastClass(courseId, moduleId, classId);
  }, [courseId, moduleId, classId, setLastClass]);

  const course = academicClass?.course;
  const module = academicClass?.module;
  const isReadOnly =
    course?.status === 'archived' || module?.status === 'archived' || academicClass?.status === 'archived';

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

  const selectedInstrument = instruments.find((instrument) => getId(instrument) === formData.instrument);
  const classTasksPath = `/evaluator/courses/${courseId}/modules/${moduleId}/classes/${classId}`;

  const loadTask = async () => {
    try {
      const data = await getResource('tasks', taskId);
      setTask(data.task);
      setFormData(buildFormData(data.task));
      setError('');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const retryLoadTask = async () => {
    setIsRetrying(true);
    try {
      await loadTask();
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      setIsLoading(true);
      setError('');

      try {
        const [classResult, taskResult, groupsResult, studentsResult, instrumentsResult] = await Promise.allSettled([
          getResource('classes', classId),
          getResource('tasks', taskId),
          listResource('groups', { status: 'active', limit: 100 }),
          listResource('students', { status: 'active', limit: 100 }),
          listResource('instruments', { limit: 100 }),
        ]);

        if (!isMounted) return;

        if (classResult.status === 'fulfilled') setAcademicClass(classResult.value.class);
        if (taskResult.status === 'fulfilled') {
          setTask(taskResult.value.task);
          setFormData(buildFormData(taskResult.value.task));
        }
        if (groupsResult.status === 'fulfilled') setGroups(groupsResult.value.groups ?? []);
        if (studentsResult.status === 'fulfilled') setStudents(studentsResult.value.students ?? []);
        if (instrumentsResult.status === 'fulfilled') setInstruments(instrumentsResult.value.instruments ?? []);

        const failedResult = [classResult, taskResult, groupsResult, studentsResult, instrumentsResult].find(
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
  }, [classId, taskId]);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isReadOnly) return;

    setError('');
    setMessage('');

    const normalizedTitle = formData.title.trim();
    if (!normalizedTitle) return;

    setIsSubmitting(true);

    try {
      const { task: updatedTask } = await updateResource('tasks', taskId, buildTaskPayload(formData));
      setTask(updatedTask);
      setFormData(buildFormData(updatedTask));
      setMessage('Tarea actualizada correctamente.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteTask = async () => {
    if (!task) return;

    setError('');
    setMessage('');

    try {
      await deleteResource('tasks', taskId);
      navigate(classTasksPath);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleDeleteTask = () => {
    if (!task) return;

    setConfirmAction({
      title: `Eliminar ${task.title}`,
      description: 'Esta acción no se puede deshacer desde esta pantalla.',
      confirmLabel: 'Eliminar tarea',
      onConfirm: deleteTask,
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
      <div className="module-hero">
        <span className="module-hero-icon">
          <ClipboardList size={28} aria-hidden="true" />
        </span>
        <div>
          <div className="module-hero-eyebrow-row">
            <p className="eyebrow">Tarea</p>
            {course?.name ? (
              <div className="course-context-banner">
                <span className="course-context-label">Curso</span>
                <span className="course-context-name">{course.name}</span>
              </div>
            ) : null}
          </div>
          <h1>{task?.title ?? 'Detalle de tarea'}</h1>
          <p className="dashboard-description">
            {task?.description || 'Revisa la asignación, instrumento, fechas y ponderación de esta tarea.'}
          </p>
        </div>
      </div>

      {error ? (
        <div className="form-message form-message-error">
          <span>{error}</span>
          <button className="button button-secondary" type="button" onClick={retryLoadTask} disabled={isRetrying}>
            {isRetrying ? <span className="button-spinner-ring" aria-hidden="true" /> : null}
            {isRetrying ? 'Reintentando...' : 'Reintentar tarea'}
          </button>
        </div>
      ) : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}
      {isReadOnly ? (
        <p className="form-message form-message-warning">
          Este nivel está archivado. Puedes revisar la tarea, pero no modificarla.
        </p>
      ) : null}

      <div className="metric-grid" aria-label="Resumen de tarea">
        <article className="metric-card">
          <span className="metric-icon">
            <CheckCircle2 size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : statusLabels[normalizeTaskStatus(task?.status)]}</strong>
            <span>Estado</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Users size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(task?.students?.length ?? 0)}</strong>
            <span>Estudiantes</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Weight size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{isLoading ? '...' : String(task?.weight ?? 0)}</strong>
            <span>Nota</span>
          </div>
        </article>
      </div>

      <HierarchyBreadcrumb
        items={[
          { label: 'Módulos', to: `/evaluator/courses/${getId(course) || courseId}` },
          {
            label: 'Clases',
            to: `/evaluator/courses/${courseId}/modules/${getId(module) || moduleId}`,
          },
          { label: 'Tareas', to: classTasksPath },
          task ? { label: task.title } : { label: 'Tarea' },
        ]}
      />

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Resumen</h2>
            <p>Contexto principal de la tarea seleccionada.</p>
          </div>

          <div className="spaced-list">
            <div className="criterion-score">
              <span>Grupos</span>
              <strong>{task ? getGroupNames(task) : 'Sin grupo'}</strong>
            </div>
            <div className="criterion-score">
              <span>Instrumento</span>
              <strong>{selectedInstrument?.title ?? task?.instrument?.title ?? 'Sin instrumento'}</strong>
            </div>
            <div className="criterion-score">
              <span>Fecha</span>
              <strong>{toInputDate(task?.dueDate) || 'Sin fecha'}</strong>
            </div>
          </div>

          <div className="panel-heading panel-heading-compact">
            <h2>Estudiantes vinculados</h2>
          </div>
          <div className="selected-student-chips" aria-label="Estudiantes vinculados a la tarea">
            {(task?.students ?? []).length ? (
              task.students.map((student) => (
                <span className="student-chip" key={getId(student)}>
                  {getStudentName(student)}
                </span>
              ))
            ) : (
              <p className="assignment-empty">No hay estudiantes vinculados a esta tarea.</p>
            )}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>Editar tarea</h2>
            <p>Ajusta la configuración sin perder el contexto de la clase.</p>
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
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    placeholder="Instrucciones o alcance de la tarea"
                    onChange={handleChange}
                    disabled={isReadOnly}
                  />
                </label>
              </div>
            </details>

            <details className="form-section" open>
              <summary>Asignación</summary>
              <div className="form-section-body">
                <label className="label-inline">
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

                  <div className="assignment-list assignment-list-inline" aria-label="Seleccionar grupos para esta tarea">
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

                  <div className="assignment-list assignment-list-inline" aria-label="Seleccionar estudiantes para esta tarea">
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

            <details className="form-section" open>
              <summary>Fecha y nota</summary>
              <div className="form-section-body">
                <div className="form-fields-inline">
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
              </div>
            </details>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting || isReadOnly}>
                {isSubmitting ? <span className="button-spinner-ring" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
                {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <button className="button button-ghost" type="button" onClick={() => setFormData(buildFormData(task))}>
                Descartar
              </button>
              <button className="button button-danger" type="button" onClick={handleDeleteTask} disabled={isReadOnly}>
                <Trash2 size={18} aria-hidden="true" />
                Eliminar
              </button>
            </div>
          </form>
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

export default EvaluatorTaskDetailPage;
