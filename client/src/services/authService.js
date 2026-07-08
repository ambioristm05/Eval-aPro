import api from './api.js';

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data;
}

export async function requestPasswordReset(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function registerStudent(payload) {
  const { data } = await api.post('/auth/register/student', payload);
  return data;
}

export async function registerEvaluatorWithInvitation(payload) {
  const { data } = await api.post('/auth/register/evaluator/invitation', payload);
  return data;
}

export async function createEvaluatorInvitation(payload) {
  const { data } = await api.post('/invitations/evaluator', payload);
  return data;
}

export async function validateInvitation(token) {
  const { data } = await api.get(`/invitations/validate/${token}`);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data.user;
}

export async function logout() {
  await api.post('/auth/logout');
}
