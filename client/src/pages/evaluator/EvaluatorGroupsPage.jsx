import {
  Archive,
  GraduationCap,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';

const initialGroups = [
  {
    id: 'group-literature-4a',
    name: 'Literatura 4to A',
    description: 'Analisis de textos, exposiciones y rubricas de lectura.',
    status: 'active',
    studentsCount: 28,
    tasksCount: 4,
  },
  {
    id: 'group-projects-5b',
    name: 'Proyecto final 5to B',
    description: 'Seguimiento de entregas, presentaciones y defensa oral.',
    status: 'active',
    studentsCount: 22,
    tasksCount: 3,
  },
  {
    id: 'group-observation',
    name: 'Practica de observacion',
    description: 'Grupo archivado para conservar resultados historicos.',
    status: 'archived',
    studentsCount: 16,
    tasksCount: 2,
  },
];

const emptyForm = {
  name: '',
  description: '',
  status: 'active',
};

const statusLabels = {
  active: 'Activo',
  archived: 'Archivado',
};

function EvaluatorGroupsPage() {
  const [groups, setGroups] = useState(initialGroups);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        group.name.toLowerCase().includes(normalizedSearch) ||
        group.description.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [groups, searchTerm, statusFilter]);

  const activeGroups = groups.filter((group) => group.status === 'active').length;
  const totalStudents = groups.reduce((total, group) => total + group.studentsCount, 0);

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
    const normalizedName = formData.name.trim();

    if (!normalizedName) return;

    if (editingId) {
      setGroups((current) =>
        current.map((group) =>
          group.id === editingId
            ? {
                ...group,
                name: normalizedName,
                description: formData.description.trim(),
                status: formData.status,
              }
            : group,
        ),
      );
      resetForm();
      return;
    }

    setGroups((current) => [
      {
        id: `group-${Date.now()}`,
        name: normalizedName,
        description: formData.description.trim(),
        status: formData.status,
        studentsCount: 0,
        tasksCount: 0,
      },
      ...current,
    ]);
    resetForm();
  };

  const handleEdit = (group) => {
    setEditingId(group.id);
    setFormData({
      name: group.name,
      description: group.description,
      status: group.status,
    });
  };

  const handleToggleStatus = (groupId) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId
          ? {
              ...group,
              status: group.status === 'active' ? 'archived' : 'active',
            }
          : group,
      ),
    );
  };

  const handleDelete = (groupId) => {
    setGroups((current) => current.filter((group) => group.id !== groupId));

    if (editingId === groupId) {
      resetForm();
    }
  };

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon">
          <GraduationCap size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>Mis grupos</h1>
          <p className="dashboard-description">
            Organiza clases, conserva su historial y prepara la vinculacion de estudiantes,
            tareas e instrumentos.
          </p>
        </div>
      </div>

      <div className="metric-grid" aria-label="Resumen de grupos">
        <article className="metric-card">
          <span className="metric-icon">
            <GraduationCap size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{groups.length}</strong>
            <span>Grupos</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <RotateCcw size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{activeGroups}</strong>
            <span>Activos</span>
          </div>
        </article>
        <article className="metric-card">
          <span className="metric-icon">
            <Users size={20} aria-hidden="true" />
          </span>
          <div>
            <strong>{totalStudents}</strong>
            <span>Estudiantes</span>
          </div>
        </article>
      </div>

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading">
            <h2>{editingId ? 'Editar grupo' : 'Crear grupo'}</h2>
            <p>Define la informacion basica de la clase.</p>
          </div>

          <form className="stacked-form compact-form" onSubmit={handleSubmit}>
            <label>
              Nombre del grupo
              <input
                type="text"
                name="name"
                value={formData.name}
                placeholder="Ej. Comunicacion oral 3ro A"
                onChange={handleChange}
                required
              />
            </label>
            <label>
              Descripcion
              <textarea
                name="description"
                value={formData.description}
                placeholder="Proposito del grupo o actividad principal"
                rows="4"
                onChange={handleChange}
              />
            </label>
            <label>
              Estado
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="active">Activo</option>
                <option value="archived">Archivado</option>
              </select>
            </label>

            <div className="form-actions">
              <button className="button button-primary" type="submit">
                {editingId ? <Save size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
                {editingId ? 'Guardar cambios' : 'Crear grupo'}
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
              <p>Busca por nombre o descripcion y filtra por estado.</p>
            </div>
            <span className="count-pill">{filteredGroups.length}</span>
          </div>

          <div className="toolbar">
            <label className="search-field">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={searchTerm}
                placeholder="Buscar grupo"
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
            {filteredGroups.map((group) => (
              <article className="resource-item" key={group.id}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{group.name}</h3>
                    <span className={`status-badge status-${group.status}`}>
                      {statusLabels[group.status]}
                    </span>
                  </div>
                  <p>{group.description || 'Sin descripcion registrada.'}</p>
                  <div className="resource-meta">
                    <span>{group.studentsCount} estudiantes</span>
                    <span>{group.tasksCount} tareas</span>
                  </div>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${group.name}`}>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleEdit(group)}
                    title="Editar"
                    aria-label={`Editar ${group.name}`}
                  >
                    <Pencil size={17} aria-hidden="true" />
                  </button>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => handleToggleStatus(group.id)}
                    title={group.status === 'active' ? 'Archivar' : 'Reactivar'}
                    aria-label={group.status === 'active' ? `Archivar ${group.name}` : `Reactivar ${group.name}`}
                  >
                    {group.status === 'active' ? (
                      <Archive size={17} aria-hidden="true" />
                    ) : (
                      <RotateCcw size={17} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => handleDelete(group.id)}
                    title="Eliminar"
                    aria-label={`Eliminar ${group.name}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}

            {filteredGroups.length === 0 ? (
              <div className="inline-empty">
                <h3>No hay grupos</h3>
                <p>Ajusta la busqueda o crea un grupo nuevo.</p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}

export default EvaluatorGroupsPage;
