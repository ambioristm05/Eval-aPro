import { useSearchParams } from 'react-router-dom';
import DirectMessagesPanel from '../../components/common/DirectMessagesPanel.jsx';
import { useAuthStore } from '../../stores/authStore.js';

function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const initialContactId = searchParams.get('contact') ?? '';

  if (!user) return null;

  return (
    <section className="management-page">
      <div className="module-hero">
        <div>
          <p className="eyebrow">Mensajes</p>
          <h1>Bandeja de mensajes</h1>
          <p className="dashboard-description">
            Conversaciones directas con los perfiles vinculados a tu cuenta.
          </p>
        </div>
      </div>

      <DirectMessagesPanel role={user.role} initialContactId={initialContactId} />
    </section>
  );
}

export default MessagesPage;
