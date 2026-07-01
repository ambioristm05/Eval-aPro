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
import { useMemo, useState } from 'react';

const initialTasks = [
  {
    id: 'task-reading-analysis',
    title: 'Analisis de cuento latinoamericano',
    description: 'Entrega escrita con criterios de comprension, estructura y argumentacion.',
    group: 'Literatura 4to A',
    instrument: 'Rubrica analitica de lectura',
    status: 'in_progress',
    startDate: '2026-07-01',
    dueDate: '2026-07-10',
    weight: 20,
  },
  {
    id: 'task-final-presentation',
    title: 'Presentacion del proyecto final',
    description: 'Exposicion oral y defensa de decisiones del proyecto.',
    group: 'Proyecto final 5to B',
    instrument: 'Escala de presentacion oral',
    status: 'pending',
    startDate: '2026-07-08',
    dueDate: '2026-07-18',
    weight: 35,
  },
  {
    id: 'task-observation-guide',
    title: 'Practica de observacion',
    description: 'Registro de desempeno durante actividad guiada.',
    group: 'Practica de observacion',
    instrument: 'Guia de observacion',
    status: 'completed',
    startDate: '2026-06-12',
    dueDate: '2026-06-20',
    weight: 15,
  },
];

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

function EvaluatorTasksPage() {
  const [tasks, setTasks] = useState(initialTasks);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        task.title.toLowerCase().includes(normalizedSearch) ||
        task.description.toLowerCase().includes(normalizedSearch) ||
        task.group.toLowerCase().includes(normalizedSearch) ||
        task.instrument.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [tasks, searchTerm, statusFilter]);

  const activeTasks = tasks.filter((task) => ['pending', 'in_progress'].includes(task.status)).length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const totalWeight = tasks.reduce((total, task) => total + Number(task.weight || 0), 0);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const normalizedTitle = formData.title.trim();

    if (!normalizedTitle) return;

    const taskPayload = {
      title: normalizedTitle,
      description: formData.description.trim(),
      group: formData.group.trim() || 'Sin grupo',
      instrument: formData.instrument.trim() || 'Sin instrumento',
      status: formData.status,
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      weight: Number(formData.weight) || 0,
    };

    if (editingId) {
      setTasks((current) =>
        current.map((task) => (task.id === editingId ? { ...task, ...taskPayload } : task)),
      );
      resetForm();
      return;
    }

    setTasks((current) => [{ id: `task-${Date.now()}`, ...taskPayload }, ...current]);
    resetForm();
  };

  const handleEdit = (task) => {
    setEditingId(task.id);
    setFormData({
      title: task.title,
      description: task.description,
      group: task.group,
      instrument: task.instrument,
      status: task.status,
      startDate: task.startDate,
      dueDate: task.dueDate,
      weight: task.weight,
    });
  };

  const updateTaskStatus = (taskId, status) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status } : task)));
  };

  const deleteTask = (taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));

    if (editingId === taskId) {
      resetForm();
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
                <input
                  type="text"
                  name="group"
                  value={formData.group}
                  placeholder="Grupo asignado"
                  onChange={handleChange}
                />
              </label>
              <label>
                Instrumento
                <input
                  type="text"
                  name="instrument"
                  value={formData.instrument}
                  placeholder="Rubrica o lista"
                  onChange={handleChange}
                />
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
              <button className="button button-primary" type="submit">
                {editingId ? <Save size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                {editingId ? 'Guardar cambios' : 'Crear tarea'}
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
              <article className="resource-item" key={task.id}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{task.title}</h3>
                    <span className={`status-badge status-${task.status}`}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  <p>{task.description || 'Sin descripcion registrada.'}</p>
                  <div className="resource-meta">
                    <span>{task.group}</span>
                    <span>{task.instrument}</span>
                    <span>{task.weight}%</span>
                    <span>{task.dueDate || 'Sin entrega'}</span>
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
                    onClick={() => updateTaskStatus(task.id, 'completed')}
                    title="Marcar completada"
                    aria-label={`Marcar completada ${task.title}`}
                    disabled={task.status === 'completed'}
                  >
                    <CheckCircle2 size={17} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => deleteTask(task.id)}
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
                <h3>No hay tareas</h3>
                <p>Ajusta los filtros o crea una tarea nueva.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorTasksPage;
