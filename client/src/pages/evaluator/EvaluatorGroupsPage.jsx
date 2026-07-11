import {
  Archive,
  CheckCircle2,
  GraduationCap,
  Link,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useTimedState } from '../../hooks/useTimedState.js';
import {
  addStudentToGroup,
  createResource,
  deleteResource,
  listResource,
  updateResource,
} from '../../services/resourceService.js';
import { getErrorMessage } from '../../utils/errors.js';
import { getId } from '../../utils/getId.js';

const emptyForm = {
  name: '',
  description: '',
  status: 'active',
};

const statusLabels = {
  active: 'Activo',
  archived: 'Archivado',
};

function getStudentCount(group) {
  return Array.isArray(group.students) ? group.students.length : 0;
}

function getStudentName(student) {
  return student.name ?? student.email ?? 'Estudiante sin nombre';
}

function EvaluatorGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [message, setMessage] = useTimedState();
  const [error, setError] = useTimedState();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [reactivatingId, setReactivatingId] = useState('');

  const activeGroupsForSelect = useMemo(
    () => groups.filter((group) => group.status === 'active'),
    [groups],
  );

  const filteredGroups = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return groups.filter((group) => {
      const matchesStatus = statusFilter === 'all' || group.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        group.name.toLowerCase().includes(normalizedSearch) ||
        (group.description ?? '').toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [groups, searchTerm, statusFilter]);

  const activeGroups = groups.filter((group) => group.status === 'active').length;
  const totalStudents = groups.reduce((total, group) => total + getStudentCount(group), 0);
  const selectedStudent = useMemo(
    () => availableStudents.find((student) => getId(student) === selectedStudentId),
    [availableStudents, selectedStudentId],
  );

  const loadGroups = async () => {
    const data = await listResource('groups', { limit: 100 });
    setGroups(data.groups ?? []);

    if (!selectedGroupId && data.groups?.length) {
      const firstActiveGroup = data.groups.find((group) => group.status === 'active') ?? data.groups[0];
      setSelectedGroupId(getId(firstActiveGroup));
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function fetchGroups() {
      setIsLoading(true);
      setError('');

      try {
        const data = await listResource('groups', { limit: 100 });
        if (!isMounted) return;

        setGroups(data.groups ?? []);
        const firstActiveGroup = data.groups?.find((group) => group.status === 'active') ?? data.groups?.[0];
        setSelectedGroupId(firstActiveGroup ? getId(firstActiveGroup) : '');
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function fetchAvailableStudents() {
      if (!selectedGroupId) {
        setAvailableStudents([]);
        setSelectedStudentId('');
        return;
      }

      try {
        const data = await listResource('students', {
          availableForGroup: selectedGroupId,
          search: studentSearch || undefined,
          limit: 100,
        });

        if (!isMounted) return;
        setAvailableStudents(data.students ?? []);
        setSelectedStudentId((current) => {
          if (data.students?.some((student) => getId(student) === current)) return current;
          return data.students?.[0] ? getId(data.students[0]) : '';
        });
      } catch (requestError) {
        if (!isMounted) return;
        setAvailableStudents([]);
        setSelectedStudentId('');
        setError(getErrorMessage(requestError));
      }
    }

    fetchAvailableStudents();

    return () => {
      isMounted = false;
    };
  }, [selectedGroupId, studentSearch]);

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
      if (editingId) {
        await updateResource('groups', editingId, {
          name: normalizedName,
          description: formData.description.trim(),
          status: formData.status,
        });
        setMessage('Grupo actualizado correctamente.');
      } else {
        await createResource('groups', {
          name: normalizedName,
          description: formData.description.trim(),
        });
        setMessage('Grupo creado correctamente.');
      }

      resetForm();
      await loadGroups();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (group) => {
    setEditingId(getId(group));
    setFormData({
      name: group.name,
      description: group.description ?? '',
      status: group.status,
    });
  };

  const toggleGroupStatus = async (group) => {
    setError('');
    setMessage('');

    try {
      await updateResource('groups', getId(group), {
        status: group.status === 'active' ? 'archived' : 'active',
      });
      setMessage(group.status === 'active' ? 'Grupo archivado.' : 'Grupo reactivado.');
      await loadGroups();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const reactivateGroup = async (group) => {
    const groupId = getId(group);
    setReactivatingId(groupId);
    try {
      await toggleGroupStatus(group);
    } finally {
      setReactivatingId('');
    }
  };

  const handleToggleStatus = (group) => {
    if (group.status !== 'active') {
      reactivateGroup(group);
      return;
    }

    setConfirmAction({
      title: `Archivar ${group.name}`,
      description: 'Podrás reactivar este grupo más adelante.',
      confirmLabel: 'Archivar grupo',
      onConfirm: () => toggleGroupStatus(group),
    });
  };

  const deleteGroup = async (group) => {
    const groupId = getId(group);

    setError('');
    setMessage('');

    try {
      await deleteResource('groups', groupId);
      setMessage('Grupo eliminado correctamente.');
      if (editingId === groupId) resetForm();
      await loadGroups();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  };

  const handleDelete = (group) => {
    setConfirmAction({
      title: `Eliminar ${group.name}`,
      description: 'Esta acción no se puede deshacer desde esta pantalla.',
      confirmLabel: 'Eliminar grupo',
      onConfirm: () => deleteGroup(group),
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

  const handleLinkStudent = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!selectedGroupId || !selectedStudentId) {
      setError('Selecciona un grupo y un estudiante activo.');
      return;
    }

    setIsLinking(true);

    try {
      await addStudentToGroup(selectedGroupId, selectedStudentId);
      setMessage('Estudiante vinculado al grupo correctamente.');
      setStudentSearch('');
      await loadGroups();

      const data = await listResource('students', {
        availableForGroup: selectedGroupId,
        limit: 100,
      });
      setAvailableStudents(data.students ?? []);
      setSelectedStudentId(data.students?.[0] ? getId(data.students[0]) : '');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsLinking(false);
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
            Organiza clases, conserva su historial y vincula estudiantes registrados.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

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
            <span>Estudiantes vinculados</span>
          </div>
        </article>
      </div>

      <div className="management-grid">
        <div className="panel-stack">
          <section className="dashboard-panel">
            <div className="panel-heading">
              <h2>{editingId ? 'Editar grupo' : 'Crear grupo'}</h2>
              <p>Define la información básica de la clase.</p>
            </div>

            <form className="stacked-form compact-form" onSubmit={handleSubmit}>
              <label>
                Nombre del grupo
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  placeholder="Ej. Comunicación oral 3ro A"
                  onChange={handleChange}
                  required
                />
              </label>
              <label>
                Descripción
                <textarea
                  name="description"
                  value={formData.description}
                  placeholder="Propósito del grupo o actividad principal"
                  rows="4"
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
                  {isSubmitting ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear grupo'}
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
            <div className="panel-heading">
              <h2>Vincular estudiante</h2>
              <p>Selecciona un estudiante activo registrado y agrégalo al grupo.</p>
            </div>

            <form className="stacked-form compact-form" onSubmit={handleLinkStudent}>
              <label>
                Grupo
                <select
                  value={selectedGroupId}
                  onChange={(event) => setSelectedGroupId(event.target.value)}
                  required
                >
                  {activeGroupsForSelect.map((group) => (
                    <option key={getId(group)} value={getId(group)}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="assignment-selector">
                <div className="assignment-header">
                  <span>Estudiante disponible</span>
                  <strong>{availableStudents.length}</strong>
                </div>

                {selectedStudent ? (
                  <div className="selected-student-chips" aria-label="Estudiante seleccionado">
                    <button className="student-chip" type="button" onClick={() => setSelectedStudentId('')}>
                      {getStudentName(selectedStudent)}
                    </button>
                  </div>
                ) : null}

                <label className="search-field assignment-search">
                  <Search size={18} aria-hidden="true" />
                  <input
                    type="search"
                    value={studentSearch}
                    placeholder="Nombre o correo"
                    onChange={(event) => setStudentSearch(event.target.value)}
                  />
                </label>

                <div className="assignment-list" aria-label="Seleccionar estudiante disponible">
                  {availableStudents.map((student) => {
                    const studentId = getId(student);
                    const isSelected = selectedStudentId === studentId;

                    return (
                      <label className={`assignment-option${isSelected ? ' assignment-option-selected' : ''}`} key={studentId}>
                        <input
                          type="radio"
                          name="selectedStudentId"
                          checked={isSelected}
                          onChange={() => setSelectedStudentId(studentId)}
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

                  {selectedGroupId && availableStudents.length === 0 ? (
                    <p className="assignment-empty">
                      {studentSearch
                        ? 'No hay estudiantes disponibles que coincidan con la búsqueda.'
                        : 'No hay estudiantes disponibles para vincular a este grupo.'}
                    </p>
                  ) : null}

                  {!selectedGroupId ? (
                    <p className="assignment-empty">Selecciona un grupo activo para buscar estudiantes disponibles.</p>
                  ) : null}
                </div>
              </div>

              <button
                className="button button-primary"
                type="submit"
                disabled={isLinking || !activeGroupsForSelect.length || !availableStudents.length}
              >
                <Link size={18} aria-hidden="true" />
                {isLinking ? 'Vinculando...' : 'Vincular estudiante'}
              </button>
            </form>
          </section>
        </div>

        <section className="dashboard-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Listado</h2>
              <p>Busca por nombre o descripción y filtra por estado.</p>
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
            {isLoading ? (
              <div className="skeleton-list" aria-label="Cargando grupos">
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
            ) : filteredGroups.map((group) => (
              <article className="resource-item" key={getId(group)}>
                <div className="resource-main">
                  <div className="resource-title-row">
                    <h3>{group.name}</h3>
                    <span className={`status-badge status-${group.status}`}>
                      {statusLabels[group.status]}
                    </span>
                  </div>
                  <p>{group.description || 'Sin descripción registrada.'}</p>
                  <div className="resource-meta">
                    <span>{getStudentCount(group)} estudiantes</span>
                  </div>
                </div>

                <div className="resource-actions" aria-label={`Acciones para ${group.name}`}>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(getId(group));
                      setMessage(`Grupo seleccionado: ${group.name}`);
                    }}
                    title="Seleccionar para vincular"
                    aria-label={`Seleccionar ${group.name} para vincular estudiantes`}
                  >
                    <Link size={17} aria-hidden="true" />
                  </button>
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
                    onClick={() => handleToggleStatus(group)}
                    title={group.status === 'active' ? 'Archivar' : 'Reactivar'}
                    aria-label={group.status === 'active' ? `Archivar ${group.name}` : `Reactivar ${group.name}`}
                    disabled={reactivatingId === getId(group)}
                  >
                    {reactivatingId === getId(group) ? (
                      <span className="button-spinner-ring" aria-hidden="true" />
                    ) : group.status === 'active' ? (
                      <Archive size={17} aria-hidden="true" />
                    ) : (
                      <RotateCcw size={17} aria-hidden="true" />
                    )}
                  </button>
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => handleDelete(group)}
                    title="Eliminar"
                    aria-label={`Eliminar ${group.name}`}
                  >
                    <Trash2 size={17} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}

            {!isLoading && filteredGroups.length === 0 ? (
              <EmptyState
                title="No hay grupos"
                description="Ajusta la búsqueda o crea un grupo nuevo."
                action={{
                  label: 'Crear grupo',
                  onClick: () => {
                    resetForm();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  },
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

export default EvaluatorGroupsPage;
