import api from './api.js';

export async function listMessageContacts() {
  const { data } = await api.get('/messages/contacts');
  return data;
}

export async function getMessageThread(userId) {
  const { data } = await api.get(`/messages/thread/${userId}`);
  return data;
}

export async function createDirectMessage(payload) {
  const { data } = await api.post('/messages', payload);
  return data;
}
