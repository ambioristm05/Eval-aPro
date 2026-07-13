import api from './api.js';

export async function getOverviewStatistics() {
  const { data } = await api.get('/statistics/overview');
  return data.statistics;
}

export async function getStatsByEvaluator() {
  const { data } = await api.get('/statistics/by-evaluator');
  return data.statistics;
}

export async function getGroupStatistics(groupId) {
  const { data } = await api.get(`/statistics/groups/${groupId}`);
  return data.statistics;
}

export async function getTaskStatistics(taskId) {
  const { data } = await api.get(`/statistics/tasks/${taskId}`);
  return data.statistics;
}

export async function getInstrumentStatistics(instrumentId) {
  const { data } = await api.get(`/statistics/instruments/${instrumentId}`);
  return data.statistics;
}
