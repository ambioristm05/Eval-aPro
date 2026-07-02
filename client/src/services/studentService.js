import api from './api.js';

export async function getStudentTasks(params = {}) {
  const { data } = await api.get('/tasks', { params: { limit: 100, ...params } });
  return data;
}

export async function getStudentResults(params = {}) {
  const { data } = await api.get('/results/me', { params: { limit: 100, ...params } });
  return data;
}

export async function getStudentFinalGrade() {
  const { data } = await api.get('/results/final-grade/me');
  return data.finalGrade;
}

export async function getMyProfile() {
  const { data } = await api.get('/users/me');
  return data.user;
}

export async function updateMyProfile(payload) {
  const { data } = await api.patch('/users/me', payload);
  return data.user;
}

export async function changeMyPassword(payload) {
  const { data } = await api.patch('/users/me/password', payload);
  return data;
}

export async function deleteMyAccount(payload) {
  const { data } = await api.delete('/users/me', { data: payload });
  return data;
}
