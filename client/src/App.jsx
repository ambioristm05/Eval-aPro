import { useEffect } from 'react';
import AppRoutes from './routes/AppRoutes.jsx';
import { useAuthStore } from './stores/authStore.js';

function App() {
  const bootstrapSession = useAuthStore((state) => state.bootstrapSession);

  useEffect(() => {
    bootstrapSession();
  }, [bootstrapSession]);

  return <AppRoutes />;
}

export default App;
