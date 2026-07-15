import { useSearchParams } from 'react-router-dom';
import DirectMessagesPanel from '../../components/common/DirectMessagesPanel.jsx';
import { useAuthStore } from '../../stores/authStore.js';

function MessagesPage() {
  const user = useAuthStore((state) => state.user);
  const [searchParams] = useSearchParams();
  const initialContactId = searchParams.get('contact') ?? '';

  if (!user) return null;

  return (
    <section className="messages-page">
      <DirectMessagesPanel role={user.role} initialContactId={initialContactId} />
    </section>
  );
}

export default MessagesPage;
