import api from './api.js';

export async function getEvaluators(params = {}) {
  const { data } = await api.get('/users/evaluators', { params });
  return data;
}

export async function deleteUserPermanent(userId, { password, reason, cascade } = {}) {
  const { data } = await api.delete(`/users/${userId}/permanent`, {
    data: { password, reason },
    params: cascade ? { cascade: true } : undefined,
  });
  return data;
}
