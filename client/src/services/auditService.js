import api from './api.js';

export async function getAuditLogs(params = {}) {
  const { data } = await api.get('/audit', { params });
  return data;
}

export async function getAuditEntities() {
  const { data } = await api.get('/audit/entities');
  return data.entities;
}
