import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import Header from './Header.jsx';
import RoleNav from './RoleNav.jsx';

function AppLayout() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className={`app-shell${user ? ' app-shell-authenticated' : ''}`}>
      <Header />
      <RoleNav />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
