import { Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { useSidebarStore } from '../../stores/sidebarStore.js';
import Header from './Header.jsx';
import RoleNav from './RoleNav.jsx';

function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const collapsed = useSidebarStore((state) => state.collapsed);

  const shellClass = [
    'app-shell',
    user ? 'app-shell-authenticated' : '',
    user && collapsed ? 'sidebar-collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={shellClass}>
      <Header />
      <RoleNav />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
