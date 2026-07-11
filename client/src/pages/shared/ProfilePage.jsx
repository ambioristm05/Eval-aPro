import { ArrowLeft, KeyRound, Pencil, Save, Trash2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  changeMyPassword,
  deleteMyAccount,
  getMyProfile,
  updateMyProfile,
} from '../../services/studentService.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useTimedState } from '../../hooks/useTimedState.js';
import { getErrorMessage } from '../../utils/errors.js';

function getGroupNames(user) {
  const groups = user?.groups ?? [];
  if (!groups.length) return 'Sin grupo asignado';
  return groups.map((group) => group.name).join(', ');
}

function getStatusLabel(status) {
  const labels = {
    active: 'Activa',
    suspended: 'Suspendida',
    deleted: 'Eliminada',
  };

  return labels[status] ?? status ?? 'Sin estado';
}

function ProfilePage({ role, mode = 'view' }) {
  const storeUser = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [user, setLocalUser] = useState(storeUser);
  const [profile, setProfile] = useState({
    name: storeUser?.name ?? '',
    email: storeUser?.email ?? '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [deleteForm, setDeleteForm] = useState({
    confirmation: '',
    password: '',
    reason: '',
  });
  const [error, setError] = useTimedState();
  const [message, setMessage] = useTimedState();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const groupNames = useMemo(() => getGroupNames(user), [user]);
  const roleLabels = { admin: 'Administrador', evaluator: 'Evaluador', student: 'Estudiante' };
  const roleLabel = roleLabels[role] ?? 'Usuario';
  const profilePath = `/${role}/profile`;
  const editPath = `/${role}/profile/edit`;
  const deletePath = `/${role}/profile/delete`;

  useEffect(() => {
    let isMounted = true;

    async function fetchProfile() {
      setIsLoading(true);
      setError('');

      try {
        const currentUser = await getMyProfile();
        if (!isMounted) return;
        setLocalUser(currentUser);
        setUser(currentUser);
        setProfile({
          name: currentUser.name ?? '',
          email: currentUser.email ?? '',
        });
      } catch (requestError) {
        if (!isMounted) return;
        setError(getErrorMessage(requestError));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [setUser]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
  };

  const handleDeleteChange = (event) => {
    const { name, value } = event.target;
    setDeleteForm((current) => ({ ...current, [name]: value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const updatedUser = await updateMyProfile({
        name: profile.name,
      });
      setLocalUser(updatedUser);
      setUser(updatedUser);
      setMessage('Perfil actualizado correctamente.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setIsSaving(true);

    try {
      await changeMyPassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
      setMessage('Contraseña actualizada correctamente.');
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = async () => {
    setError('');
    setMessage('');

    if (deleteForm.confirmation !== 'ELIMINAR') {
      setError('Escribe ELIMINAR para confirmar.');
      return;
    }

    setIsSaving(true);

    try {
      await deleteMyAccount({
        password: deleteForm.password,
        reason: deleteForm.reason || undefined,
      });
      clearSession();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const renderViewMode = () => (
    <div className="management-grid">
      <section className="dashboard-panel">
        <div className="panel-heading panel-heading-row">
          <div>
            <h2>Datos personales</h2>
            <p>Información principal del usuario logueado.</p>
          </div>
          <Link className="button button-primary" to={editPath}>
            <Pencil size={18} aria-hidden="true" />
            Modificar perfil
          </Link>
        </div>
        <div className="progress-list">
          <div>
            <span>Nombre</span>
            <strong>{isLoading ? 'Cargando...' : user?.name ?? 'Sin nombre'}</strong>
          </div>
          <div>
            <span>Correo</span>
            <strong className="plain-value">{isLoading ? 'Cargando...' : user?.email ?? 'Sin correo'}</strong>
          </div>
          <div>
            <span>Rol</span>
            <strong>{roleLabel}</strong>
          </div>
          <div>
            <span>Estado</span>
            <strong>{getStatusLabel(user?.status)}</strong>
          </div>
          {role === 'student' ? (
            <div>
              <span>Grupo</span>
              <strong>{groupNames}</strong>
            </div>
          ) : null}
        </div>
      </section>

      <aside className="dashboard-panel">
        <div className="panel-heading">
          <h2>Seguridad</h2>
          <p>Los cambios sensibles se realizan desde la vista de modificación.</p>
        </div>
        <Link className="button button-secondary" to={editPath}>
          <KeyRound size={18} aria-hidden="true" />
          Cambiar contraseña
        </Link>
      </aside>
    </div>
  );

  const renderEditMode = () => (
    <div className="management-grid">
      <section className="dashboard-panel">
        <div className="panel-heading"><h2>Modificar perfil</h2><p>El correo de la cuenta no se puede modificar.</p></div>
        <form className="stacked-form compact-form" onSubmit={saveProfile}>
          <label>Nombre<input name="name" value={profile.name} onChange={handleProfileChange} disabled={isLoading} /></label>
          <label>Correo<input name="email" type="email" value={profile.email} disabled readOnly /></label>
          {role === 'student' ? (
            <label>Grupo<input name="group" value={groupNames} disabled readOnly /></label>
          ) : null}
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={isSaving || isLoading}>
              {isSaving ? (
                <span className="button-spinner-ring" aria-hidden="true" />
              ) : (
                <Save size={18} aria-hidden="true" />
              )}
              {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
            <Link className="button button-secondary" to={profilePath}>
              <ArrowLeft size={18} aria-hidden="true" />
              Volver al perfil
            </Link>
          </div>
        </form>
      </section>

      <aside className="dashboard-panel">
        <div className="panel-heading"><h2>Cambiar contraseña</h2><p>Confirma la nueva contraseña antes de actualizar.</p></div>
        <form className="stacked-form compact-form" onSubmit={updatePassword}>
          <label>
            Contraseña actual
            <input
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <label>
            Nueva contraseña
            <input
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <label>
            Confirmar nueva contraseña
            <input
              name="confirmNewPassword"
              type="password"
              value={passwordForm.confirmNewPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <button className="button button-secondary" type="submit" disabled={isSaving}>
            {isSaving ? <span className="button-spinner-ring" aria-hidden="true" /> : null}
            {isSaving ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>

        {role === 'student' ? (
          <div className="danger-zone">
            <h3>Eliminar cuenta</h3>
            <p>Esta acción está separada para evitar eliminaciones accidentales.</p>
            <Link className="button button-danger" to={deletePath}>
              <Trash2 size={18} aria-hidden="true" />
              Ir a eliminar cuenta
            </Link>
          </div>
        ) : null}
      </aside>
    </div>
  );

  const renderDeleteMode = () => (
    <div className="management-grid">
      <section className="dashboard-panel">
        <div className="panel-heading">
          <h2>Eliminar cuenta</h2>
          <p>La eliminación es lógica y cierra la sesión automáticamente.</p>
        </div>
        <div className="danger-zone">
          <input
            name="confirmation"
            value={deleteForm.confirmation}
            placeholder="Escribe ELIMINAR"
            onChange={handleDeleteChange}
          />
          <input
            name="password"
            type="password"
            value={deleteForm.password}
            placeholder="Contraseña actual"
            onChange={handleDeleteChange}
          />
          <input
            name="reason"
            value={deleteForm.reason}
            placeholder="Motivo opcional"
            onChange={handleDeleteChange}
          />
          <div className="form-actions">
            <button className="button button-danger" type="button" onClick={deleteAccount} disabled={isSaving}>
              <Trash2 size={18} aria-hidden="true" />
              Eliminar mi cuenta
            </button>
            <Link className="button button-ghost" to={editPath}>
              <ArrowLeft size={18} aria-hidden="true" />
              Volver
            </Link>
          </div>
        </div>
      </section>
    </div>
  );

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon"><UserRound size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">{roleLabel}</p>
          <h1>{mode === 'edit' ? 'Modificar perfil' : mode === 'delete' ? 'Eliminar cuenta' : 'Perfil'}</h1>
          <p className="dashboard-description">
            {mode === 'view'
              ? 'Consulta la información de la cuenta con la que iniciaste sesión.'
              : 'Gestiona cambios de cuenta desde una vista dedicada.'}
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      {mode === 'edit' ? renderEditMode() : mode === 'delete' ? renderDeleteMode() : renderViewMode()}
    </section>
  );
}

export default ProfilePage;
