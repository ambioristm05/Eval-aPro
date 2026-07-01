import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';

function RoleRoute({ allowedRoles }) {
  const user = useAuthStore((state) => state.user);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  if (isBootstrapping) {
    return <div className="route-loader">Cargando panel...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RoleRoute;
