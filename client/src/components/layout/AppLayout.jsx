import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import RoleNav from './RoleNav.jsx';

function AppLayout() {
  return (
    <div className="app-shell">
      <Header />
      <RoleNav />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
