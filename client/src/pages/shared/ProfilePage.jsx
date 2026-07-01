import { Save, Trash2, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore.js';

function ProfilePage({ role }) {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [profile, setProfile] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    specialty: role === 'evaluator' ? 'Lengua y literatura' : '',
    group: role === 'student' ? 'Literatura 4to A' : '',
  });
  const [password, setPassword] = useState('');
  const [confirmDelete, setConfirmDelete] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const saveProfile = () => {
    setMessage('Perfil guardado localmente.');
    window.setTimeout(() => setMessage(''), 2400);
  };

  const deleteAccount = () => {
    if (confirmDelete !== 'ELIMINAR') {
      setMessage('Escribe ELIMINAR para confirmar.');
      return;
    }
    clearSession();
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

      <div className="management-grid">
        <section className="dashboard-panel">
          <div className="panel-heading"><h2>Datos personales</h2><p>Informacion principal de la cuenta.</p></div>
          <form className="stacked-form compact-form">
            <label>Nombre<input name="name" value={profile.name} onChange={handleChange} /></label>
            <label>Email<input name="email" type="email" value={profile.email} onChange={handleChange} /></label>
            {role === 'evaluator' ? (
              <label>Especialidad<input name="specialty" value={profile.specialty} onChange={handleChange} /></label>
            ) : (
              <label>Grupo<input name="group" value={profile.group} onChange={handleChange} /></label>
            )}
            <button className="button button-primary" type="button" onClick={saveProfile}>
              <Save size={18} aria-hidden="true" />
              Guardar perfil
            </button>
          </form>
        </section>

        <aside className="dashboard-panel">
          <div className="panel-heading"><h2>Seguridad</h2><p>Cambio local de contrasena y acciones sensibles.</p></div>
          <form className="stacked-form compact-form">
            <label>Nueva contrasena<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            <button className="button button-secondary" type="button" onClick={() => setMessage('Contrasena preparada para actualizar por API.')}>
              Actualizar contrasena
            </button>
          </form>

          {role === 'student' ? (
            <div className="danger-zone">
              <h3>Eliminar cuenta</h3>
              <p>La eliminacion debe ser logica y cerrar sesion automaticamente.</p>
              <input value={confirmDelete} placeholder="Escribe ELIMINAR" onChange={(event) => setConfirmDelete(event.target.value)} />
              <button className="button danger-button" type="button" onClick={deleteAccount}>
                <Trash2 size={18} aria-hidden="true" />
                Eliminar mi cuenta
              </button>
            </div>
          ) : null}

          {message ? <p className="form-message form-message-success">{message}</p> : null}
        </aside>
      </div>
    </section>
  );
}

export default ProfilePage;
