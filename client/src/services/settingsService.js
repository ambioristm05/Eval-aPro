import api from './api.js';

export async function getSettings() {
  const { data } = await api.get('/settings');
  return data.settings;
}

export async function updateSettings(payload) {
  const { data } = await api.patch('/settings', payload);
  return data;
}
