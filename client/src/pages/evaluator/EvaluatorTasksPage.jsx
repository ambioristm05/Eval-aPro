import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Plus,
  Save,
  Search,
  Trash2,
  Weight,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  createResource,
  deleteResource,
  listResource,
  updateResource,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';

const emptyForm = {
  title: '',
  description: '',
  group: '',
  instrument: '',
  status: 'pending',
  startDate: '',
  dueDate: '',
  weight: 10,
};

const statusLabels = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

function getId(resource) {
  return resource.id ?? resource._id;
}

function toInputDate(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function getGroupName(task) {
  return task.group?.name ?? 'Sin grupo';
}

function getInstrumentName(task) {
  return task.instrument?.title ?? 'Sin instrumento';
}

function buildTaskPayload(formData) {
  return {
    title: formData.title.trim(),
    description: formData.description.trim(),
    group: formData.group || undefined,
    instrument: formData.instrument || undefined,
    status: formData.status,
    startDate: formData.startDate || undefined,
    dueDate: formData.dueDate || undefined,
    weight: Number(formData.weight) || 0,
  };
}

function EvaluatorTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [groups, setGroups] = useState([]);
  const [instruments, setInstruments] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        (task.description ?? '').toLowerCase().includes(normalizedSearch) ||
        getGroupName(task).toLowerCase().includes(normalizedSearch) ||
        getInstrumentName(task).toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, searchTerm, statusFilter]);

  const activeTasks = tasks.filter((task) => ['pending', 'in_progress'].includes(task.status)).length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const totalWeight = tasks.reduce((total, task) => total + Number(task.weight || 0), 0);

  const loadTasks = async () => {
    const data = await listResource('tasks', { limit: 100 });
    setTasks(data.tasks ?? []);
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchInitialData() {
      setIsLoading(true);
      setError('');

      try {
        const [tasksData, groupsData, instrumentsData] = await Promise.all([
          listResource('tasks', { limit: 100 }),
          listResource('groups', { status: 'active', limit: 100 }),
          listResource('instruments', { limit: 100 }),
        ]);

        if (!isMounted) return;
        setTasks(tasksData.tasks ?? []);
        setGroups(groupsData.groups ?? []);
        setInstruments(instrumentsData.instruments ?? []);
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

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
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
        await createResource('tasks', payload);
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
      group: task.group ? getId(task.group) : '',
      instrument: task.instrument ? getId(task.instrument) : '',
      status: task.status,
      startDate: toInputDate(task.startDate),
      dueDate: toInputDate(task.dueDate),
      weight: task.weight ?? 0,
    });
  };

  const updateTaskStatus = async (taskId, status) => {
    setError('');
    setMessage('');

    try {
      await updateResource('tasks', taskId, { status });
      setMessage('Estado de tarea actualizado.');
      await loadTasks();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleDeleteTask = async (taskId) => {
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

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <ClipboardList size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>Tareas</h1>
          <p className="dashboard-description">
            Crea actividades evaluables, asigna grupos e instrumentos, define fechas y prepara
            la ponderacion para la nota final.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      <div className="metric-grid" aria-label="Resumen de tareas">
        <article className="metric-card">
          <span className="metric-icon">
            <CalendarClock size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{activeTasks}</strong>
            <span>Activas</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <CheckCircle2 size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{completedTasks}</strong>
            <span>Completadas</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Weight size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{totalWeight}%</strong>
            <span>Ponderacion</span>
          </div>
        </article>
      </div>

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>{editingId ? 'Editar tarea' : 'Crear tarea'}</h2>
            <p>Define la actividad evaluable y su valor dentro del periodo.</p>
          </div>

          <form className="stacked-form compact-form" onSubmit={handleSubmit}>
            <label>
              Titulo
              <input
                type="text"
                name="title"
                value={formData.title}
                placeholder="Ej. Presentacion oral"
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Descripcion
              <textarea
                name="description"
                value={formData.description}
                placeholder="Instrucciones o alcance de la tarea"
                rows="4"
                onChange={handleChange}
              />
            </label>
            <div className="form-two-columns">
              <label>
                Grupo
                <select name="group" value={formData.group} onChange={handleChange}>
                  <option value="">Sin grupo</option>
                  {groups.map((group) => (
                    <option key={getId(group)} value={getId(group)}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Instrumento
                <select name="instrument" value={formData.instrument} onChange={handleChange}>
                  <option value="">Sin instrumento</option>
                  {instruments.map((instrument) => (
                    <option key={getId(instrument)} value={getId(instrument)}>
                      {instrument.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-two-columns">
              <label>
                Inicio
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
              </label>
              <label>
                Entrega
                <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} />
              </label>
            </div>
            <div className="form-two-columns">
              <label>
                Estado
                <select name="status" value={formData.status} onChange={handleChange}>
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En progreso</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </label>
              <label>
                Peso %
                <input
                  type="number"
                  name="weight"
                  min="0"
                  max="100"
                  value={formData.weight}
                  onChange={handleChange}
                />
              </label>
            </div>

            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={isSubmitting}>
                {editingId ? <Save size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear tarea'}
              </button>
              {editingId ? (
                <button className="button button-secondary" type="button" onClick={resetForm}>
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
              <option value="pending">Pendientes</option>
              <option value="in_progress">En progreso</option>
              <option value="completed">Completadas</option>
              <option value="cancelled">Canceladas</option>
            </select>
          </div>

          <div className="resource-list">
            {filteredTasks.map((task) => (
              <article className="resource-item" key={getId(task)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{task.title}</h3>
                    <span className={`status-badge status-${task.status}`}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  <p>{task.description || 'Sin descripcion registrada.'}</p>
                  <div className="resource-meta">
                    <span>{getGroupName(task)}</span>
                    <span>{getInstrumentName(task)}</span>
                    <span>{task.weight}%</span>
                    <span>{toInputDate(task.dueDate) || 'Sin entrega'}</span>
                  </div>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${task.title}`}>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleEdit(task)}
                    title="Editar"
                    aria-label={`Editar ${task.title}`}
                  >
                    <Pencil size={17} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => updateTaskStatus(getId(task), 'completed')}
                    title="Marcar completada"
                    aria-label={`Marcar completada ${task.title}`}
                    disabled={task.status === 'completed'}
                  >
                    <CheckCircle2 size={17} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => handleDeleteTask(getId(task))}
                    title="Eliminar"
                    aria-label={`Eliminar ${task.title}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}

            {filteredTasks.length === 0 ? (
              <div className="inline-empty">
                <h3>{isLoading ? 'Cargando tareas...' : 'No hay tareas'}</h3>
                <p>{isLoading ? 'Espera un momento.' : 'Ajusta los filtros o crea una tarea nueva.'}</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorTasksPage;
