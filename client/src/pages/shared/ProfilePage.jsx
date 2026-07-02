import { Save, Trash2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  changeMyPassword,
  deleteMyAccount,
  getMyProfile,
  updateMyProfile,
} from '../../services/studentService.js';
import { useAuthStore } from '../../stores/authStore.js';
import { getErrorMessage } from '../../utils/errors.js';

function getGroupNames(user) {
  const groups = user?.groups ?? [];
  if (!groups.length) return 'Sin grupo asignado';
  return groups.map((group) => group.name).join(', ');
}

function ProfilePage({ role }) {
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
  });
  const [deleteForm, setDeleteForm] = useState({
    confirmation: '',
    password: '',
    reason: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const groupNames = useMemo(() => getGroupNames(user), [user]);

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
        email: profile.email,
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
    setIsSaving(true);

    try {
      await changeMyPassword(passwordForm);
      setPasswordForm({ currentPassword: '', newPassword: '' });
      setMessage('Contrasena actualizada correctamente.');
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

  return (
    <section className="management-page">
      <div className="module-hero">
        <span className="module-hero-icon"><UserRound size={28} aria-hidden="true" /></span>
        <div>
          <p className="eyebrow">{role === 'evaluator' ? 'Evaluador' : 'Estudiante'}</p>
          <h1>Perfil</h1>
          <p className="dashboard-description">
            Gestiona datos basicos, seguridad de la cuenta y preferencias visibles del usuario.
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading"><h2>Datos personales</h2><p>Informacion principal de la cuenta.</p></div>
          <form className="stacked-form compact-form" onSubmit={saveProfile}>
            <label>Nombre<input name="name" value={profile.name} onChange={handleProfileChange} disabled={isLoading} /></label>
            <label>Email<input name="email" type="email" value={profile.email} onChange={handleProfileChange} disabled={isLoading} /></label>
            {role === 'student' ? (
              <label>Grupo<input name="group" value={groupNames} disabled readOnly /></label>
            ) : null}
            <button className="button button-primary" type="submit" disabled={isSaving || isLoading}>
              <Save size={18} aria-hidden="true" />
              {isSaving ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </form>
        </section>

        <aside className="dashboard-panel">
          <div className="panel-heading"><h2>Seguridad</h2><p>Cambio de contrasena y acciones sensibles.</p></div>
          <form className="stacked-form compact-form" onSubmit={updatePassword}>
            <label>
              Contrasena actual
              <input
                name="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                required
              />
            </label>
            <label>
              Nueva contrasena
              <input
                name="newPassword"
                type="password"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                required
              />
            </label>
            <button className="button button-secondary" type="submit" disabled={isSaving}>
              Actualizar contrasena
            </button>
          </form>

          {role === 'student' ? (
            <div className="danger-zone">
              <h3>Eliminar cuenta</h3>
              <p>La eliminacion es logica y cierra la sesion automaticamente.</p>
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
                placeholder="Contrasena actual"
                onChange={handleDeleteChange}
              />
              <input
                name="reason"
                value={deleteForm.reason}
                placeholder="Motivo opcional"
                onChange={handleDeleteChange}
              />
              <button className="button danger-button" type="button" onClick={deleteAccount} disabled={isSaving}>
                <Trash2 size={18} aria-hidden="true" />
                Eliminar mi cuenta
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

export default ProfilePage;
