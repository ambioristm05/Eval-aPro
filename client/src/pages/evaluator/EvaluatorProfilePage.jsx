import { ArrowLeft, KeyRound, Pencil, Save, Trash2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import DirectMessagesPanel from '../../components/common/DirectMessagesPanel.jsx';
import {
  changeMyPassword,
  deleteMyAccount,
  getMyProfile,
  updateMyProfile,
} from '../../services/studentService.js';
import { useTimedState } from '../../hooks/useTimedState.js';
import { useAuthStore } from '../../stores/authStore.js';
import { getErrorMessage } from '../../utils/errors.js';

function getStatusLabel(status) {
  const labels = {
    active: 'Activa',
    suspended: 'Suspendida',
    deleted: 'Eliminada',
  };

  return labels[status] ?? status ?? 'Sin estado';
}

function EvaluatorProfilePage({ mode = 'view' }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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

  const profilePath = '/evaluator/profile';
  const editPath = '/evaluator/profile/edit';
  const deletePath = '/evaluator/profile/delete';
  const initialContactId = searchParams.get('contact') ?? '';

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
  }, [setUser, setError]);

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
      const updatedUser = await updateMyProfile({ name: profile.name });
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
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSaving(false);
    }
  };

  const renderViewMode = () => (
    <>
      <div className="management-grid profile-overview-grid">
        <section className="dashboard-panel">
          <div className="panel-heading panel-heading-row">
            <div>
              <h2>Datos del evaluador</h2>
              <p>Consulta y administra la cuenta con la que trabajas cursos, instrumentos y evaluaciones.</p>
            </div>
            <Link className="button button-primary profile-inline-button" to={editPath}>
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
              <strong>Evaluador</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{getStatusLabel(user?.status)}</strong>
            </div>
          </div>
        </section>

        <aside className="dashboard-panel">
          <div className="panel-heading">
            <h2>Acceso y seguridad</h2>
            <p>Cambia tu clave o ve a la vista dedicada de baja lógica de la cuenta.</p>
          </div>
          <div className="form-actions">
            <Link className="button button-secondary" to={editPath}>
              <KeyRound size={18} aria-hidden="true" />
              Cambiar contraseña
            </Link>
            <Link className="button button-danger" to={deletePath}>
              <Trash2 size={18} aria-hidden="true" />
              Eliminar cuenta
            </Link>
          </div>
        </aside>
      </div>

      <DirectMessagesPanel role="evaluator" initialContactId={initialContactId} />
    </>
  );

  const renderEditMode = () => (
    <div className="management-grid">
      <section className="dashboard-panel">
        <div className="panel-heading">
          <h2>Modificar perfil</h2>
          <p>El correo del evaluador se conserva como identificador principal.</p>
        </div>
        <form className="stacked-form compact-form" onSubmit={saveProfile}>
          <label>
            Nombre
            <input name="name" value={profile.name} onChange={handleProfileChange} disabled={isLoading} />
          </label>
          <label>
            Correo
            <input name="email" type="email" value={profile.email} disabled readOnly />
          </label>
          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={isSaving || isLoading}>
              {isSaving ? <span className="button-spinner-ring" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
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
        <div className="panel-heading">
          <h2>Cambiar contraseña</h2>
          <p>Confirma la nueva contraseña antes de actualizarla.</p>
        </div>
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

        <div className="danger-zone">
          <h3>Baja lógica de la cuenta</h3>
          <p>La cuenta del evaluador se marca como eliminada y la sesión se cierra de inmediato.</p>
          <Link className="button button-danger" to={deletePath}>
            <Trash2 size={18} aria-hidden="true" />
            Ir a eliminar cuenta
          </Link>
        </div>
      </aside>
    </div>
  );

  const renderDeleteMode = () => (
    <div className="management-grid">
      <section className="dashboard-panel">
        <div className="panel-heading">
          <h2>Eliminar cuenta de evaluador</h2>
          <p>Esta acción es lógica: la cuenta se desactiva y el acceso se cierra inmediatamente.</p>
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
        <span className="module-hero-icon">
          <UserRound size={28} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">Evaluador</p>
          <h1>{mode === 'edit' ? 'Modificar perfil' : mode === 'delete' ? 'Eliminar cuenta' : 'Perfil'}</h1>
          <p className="dashboard-description">
            {mode === 'view'
              ? 'Gestiona los datos y accesos de tu cuenta de evaluación.'
              : 'Realiza cambios sensibles desde una vista dedicada para evitar errores.'}
          </p>
        </div>
      </div>

      {error ? <p className="form-message form-message-error">{error}</p> : null}
      {message ? <p className="form-message form-message-success">{message}</p> : null}

      {mode === 'edit' ? renderEditMode() : mode === 'delete' ? renderDeleteMode() : renderViewMode()}
    </section>
  );
}

export default EvaluatorProfilePage;
