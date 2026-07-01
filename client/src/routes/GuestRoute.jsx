import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';
import { getDashboardPath } from '../utils/auth.js';

function GuestRoute() {
  const user = useAuthStore((state) => state.user);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);

  if (isBootstrapping) {
    return <div className="route-loader">Cargando sesion...</div>;
  }

  if (user) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <Outlet />;
}

export default GuestRoute;
